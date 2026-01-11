import { prisma } from '@/libs/prisma';
import redisInstance from "@/libs/redis";
import { Project } from '@/types/content/ProjectTypes';
import { MetadataRoute } from 'next';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'es', 'nl'];

export default class ProjectService {
    private static CACHE_KEY = 'sitemap:project';

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i;

    /**
     * Transforms raw project data with translations to flat Project format
     */
    private static transformProjectWithTranslation(project: any, language: string): Project | null {
        const translation = project.translations?.find((t: any) => t.language === language) || project.translations?.[0];

        return {
            projectId: project.projectId,
            title: translation?.title || project.title,
            description: translation?.description || project.description,
            content: translation?.content || project.content,
            slug: translation?.slug || project.slug,
            image: project.image,
            status: project.status,
            platforms: project.platforms,
            technologies: project.technologies,
            projectLinks: project.projectLinks,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };
    }

    static async getAllProjects(
        data: {
            page: number;
            pageSize: number;
            projectId?: string;
            projectSlug?: string;
            search?: string;
            onlyPublished?: boolean;
            language?: string;
        }): Promise<{ projects: Project[], total: number }> {

        const { page, pageSize, search, onlyPublished, projectId, projectSlug, language = DEFAULT_LANGUAGE } = data;

        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        // Search in translations
        const translationSearchFilter = search ? {
            translations: {
                some: {
                    language,
                    OR: [
                        { title: { contains: search, mode: 'insensitive' as const } },
                        { description: { contains: search, mode: 'insensitive' as const } },
                        { content: { contains: search, mode: 'insensitive' as const } },
                    ],
                },
            },
        } : {};

        const where = {
            ...translationSearchFilter,
            status: !onlyPublished ? undefined : 'PUBLISHED',
            projectId: projectId ? projectId : undefined,
            slug: projectSlug ? projectSlug : undefined,
        };

        const rawProjects = await prisma.project.findMany({
            where: where as any,
            skip: page * pageSize,
            take: pageSize,
            include: {
                translations: {
                    where: { language },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const total = await prisma.project.count({ where: where as any });

        const projects = rawProjects
            .map(proj => this.transformProjectWithTranslation(proj, language))
            .filter((proj): proj is Project => proj !== null);

        return { projects, total };
    }

    static async getProjectById(projectId: string, language: string = DEFAULT_LANGUAGE): Promise<Project | null> {
        const project = await prisma.project.findUnique({
            where: { projectId },
            include: {
                translations: {
                    where: { language },
                },
            },
        });

        if (!project) return null;
        return this.transformProjectWithTranslation(project, language);
    }

    static async getProjectBySlug(slug: string, language: string = DEFAULT_LANGUAGE): Promise<Project | null> {
        const project = await prisma.project.findFirst({
            where: {
                translations: {
                    some: { slug, language },
                },
            },
            include: {
                translations: {
                    where: { language },
                },
            },
        });

        if (!project) return null;
        return this.transformProjectWithTranslation(project, language);
    }

    static async createProject(data: {
        title: string;
        description: string | null;
        slug: string;
        content: string;
        image?: string | null;
        status?: string;
        platforms?: string[];
        technologies?: string[];
        projectLinks?: string[];
        translations?: Array<{
            language: string;
            title: string;
            content: string;
            description: string;
            slug: string;
        }>;
    }): Promise<Project> {

        let { title, description, slug, content, image, status, platforms, technologies, projectLinks, translations } = data;

        // If translations provided, use first valid translation as defaults
        if (translations && translations.length > 0) {
            const validTranslation = translations.find(t => t.title && t.slug);
            if (validTranslation) {
                title = title || validTranslation.title;
                description = description || validTranslation.description;
                slug = slug || validTranslation.slug;
                content = content || validTranslation.content;
            }
        }

        // Validate input
        if (!title || !slug || !content) {
            throw new Error('Title, slug, and content are required.');
        }

        // Check for existing slugs in translations
        if (translations && translations.length > 0) {
            for (const t of translations) {
                const existingTranslation = await prisma.projectTranslation.findFirst({
                    where: { slug: t.slug, language: t.language },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }
            }
        }

        await redisInstance.del(this.CACHE_KEY);

        const project = await prisma.project.create({
            data: {
                title,
                description: description || '',
                slug,
                content,
                image: image || null,
                status: status || 'PUBLISHED',
                platforms: platforms || [],
                technologies: technologies || [],
                projectLinks: projectLinks || [],
                ...(translations && translations.length > 0 ? {
                    translations: {
                        create: translations.map(t => ({
                            language: t.language,
                            title: t.title,
                            content: t.content,
                            description: t.description || '',
                            slug: t.slug,
                        })),
                    },
                } : {}),
            },
        });

        return project;
    }

    static async updateProject(projectId: string, data: {
        title: string;
        description: string | null;
        slug: string;
        content: string;
        image?: string | null;
        status?: string;
        platforms?: string[];
        technologies?: string[];
        projectLinks?: string[];
        translations?: Array<{
            language: string;
            title: string;
            content: string;
            description: string;
            slug: string;
        }>;
    }): Promise<Project> {

        const { title, description, slug, content, image, status, platforms, technologies, projectLinks, translations } = data;

        await redisInstance.del(this.CACHE_KEY);

        // Update base project
        const project = await prisma.project.update({
            where: { projectId },
            data: {
                title,
                description: description || '',
                slug,
                content,
                image: image || null,
                status: status || 'PUBLISHED',
                platforms: platforms ? { set: platforms } : undefined,
                technologies: technologies ? { set: technologies } : undefined,
                projectLinks: projectLinks ? { set: projectLinks } : undefined,
            },
        });

        // Update translations if provided
        if (translations && translations.length > 0) {
            for (const t of translations) {
                // Check if slug conflicts with another project's translation
                const existingTranslation = await prisma.projectTranslation.findFirst({
                    where: {
                        slug: t.slug,
                        language: t.language,
                        NOT: { projectId },
                    },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }

                // Upsert translation
                await prisma.projectTranslation.upsert({
                    where: {
                        projectId_language: {
                            projectId,
                            language: t.language,
                        },
                    },
                    create: {
                        projectId,
                        language: t.language,
                        title: t.title,
                        content: t.content,
                        description: t.description || '',
                        slug: t.slug,
                    },
                    update: {
                        title: t.title,
                        content: t.content,
                        description: t.description || '',
                        slug: t.slug,
                    },
                });
            }
        }

        return project;
    }

    static async deleteProject(projectId: string): Promise<void> {
        await redisInstance.del(this.CACHE_KEY);

        await prisma.project.delete({
            where: { projectId },
        });
    }

    static async deleteAllProjects(): Promise<void> {
        await redisInstance.del(this.CACHE_KEY);

        await prisma.project.deleteMany();
    }

    static async generateSiteMap(): Promise<MetadataRoute.Sitemap> {
        const projects = await prisma.project.findMany({
            select: {
                slug: true,
                updatedAt: true,
            },
            where: {
                status: 'PUBLISHED',
            },
        });

        return projects.map(project => {
            return {
                url: `/project/${project.slug}`,
                lastModified: project.updatedAt ? new Date(project.updatedAt) : new Date(),
                changeFrequency: 'daily',
                priority: 0.7,
            };
        });
    }

    static async getAllProjectSlugs(language: string = DEFAULT_LANGUAGE): Promise<{ title: string; slug: string }[]> {
        const projects = await prisma.project.findMany({
            where: {
                status: 'PUBLISHED',
                translations: {
                    some: { language },
                },
            },
            include: {
                translations: {
                    where: { language },
                },
            },
        });

        return projects.map(proj => {
            const translation = proj.translations[0];
            return {
                title: translation?.title || proj.title,
                slug: translation?.slug || proj.slug,
            };
        });
    }
}
