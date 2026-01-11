import { Category } from '@/types/content/BlogTypes';
import {prisma} from '@/libs/prisma';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'es', 'nl'];

export default class CategoryService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention

    /**
     * Transforms raw category data with translations to flat Category format
     */
    private static transformCategoryWithTranslation(category: any, language: string): Category | null {
        const translation = category.translations?.find((t: any) => t.language === language) || category.translations?.[0];
        if (!translation && category.translations?.length > 0) return null;

        return {
            categoryId: category.categoryId,
            title: translation?.title || category.title,
            description: translation?.description || category.description,
            slug: translation?.slug || category.slug,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            image: category.image,
            keywords: category.keywords,
        };
    }


    /**
     * Creates a new category with translations.
     * @param data - Category data with optional translations
     * @returns The created category
     */
    static async createCategory(data: {
        title: string;
        description: string;
        slug: string;
        image?: string;
        keywords?: string[];
        translations?: Array<{
            language: string;
            title: string;
            description: string;
            slug: string;
        }>;
    }): Promise<any> {

        let { title, description, slug, image, keywords, translations } = data;

        // If translations provided, use first valid translation as defaults
        if (translations && translations.length > 0) {
            const validTranslation = translations.find(t => t.title && t.slug);
            if (validTranslation) {
                title = title || validTranslation.title;
                description = description || validTranslation.description;
                slug = slug || validTranslation.slug;
            }
        }

        // Validate input
        if (!title || !slug) {
            throw new Error('Title and slug are required.');
        }

        // Check for existing slugs in translations
        if (translations && translations.length > 0) {
            for (const t of translations) {
                const existingTranslation = await prisma.categoryTranslation.findFirst({
                    where: { slug: t.slug, language: t.language },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }
            }
        }

        // Create the category with translations
        const category = await prisma.category.create({
            data: {
                title,
                description: description || '',
                slug,
                image: image || null,
                keywords: keywords || [],
                ...(translations && translations.length > 0 ? {
                    translations: {
                        create: translations.map(t => ({
                            language: t.language,
                            title: t.title,
                            description: t.description || '',
                            slug: t.slug,
                        })),
                    },
                } : {}),
            },
        });

        return category;
    }

    /**
     * Retrieves all categories with optional pagination and search.
     * @param page - The page number
     * @param pageSize - The page size
     * @param search - The search query
     * @param language - The language code (default: 'en')
     * @returns The categories and total count
     */
    static async getAllCategories(
        page: number,
        pageSize: number,
        search?: string,
        language: string = DEFAULT_LANGUAGE
    ): Promise<{ categories: Category[], total: number }> {

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
                        { slug: { contains: search, mode: 'insensitive' as const } },
                    ],
                },
            },
        } : {};

        const where = {
            ...translationSearchFilter,
            translations: {
                some: { language },
            },
        };

        const rawCategories = await prisma.category.findMany({
            where: where as any,
            skip: page * pageSize,
            take: pageSize,
            include: {
                translations: {
                    where: { language },
                },
            },
        });

        const total = await prisma.category.count({ where: where as any });

        const categories = rawCategories
            .map(cat => this.transformCategoryWithTranslation(cat, language))
            .filter((cat): cat is Category => cat !== null);

        return { categories, total };
    }

    /**
     * Retrieves a category by its ID.
     * @param categoryId - The ID of the category
     * @param language - The language code (default: 'en')
     * @returns The requested category or null if not found
     */
    static async getCategoryById(categoryId: string, language: string = DEFAULT_LANGUAGE): Promise<Category | null> {
        const category = await prisma.category.findUnique({
            where: { categoryId },
            include: {
                translations: {
                    where: { language },
                },
            },
        });

        if (!category) return null;
        return this.transformCategoryWithTranslation(category, language);
    }

    /**
     * Updates a category by its ID with translations.
     * @param categoryId - The ID of the category
     * @param data - The updated category data with optional translations
     * @returns The updated category
     */
    static async updateCategory(categoryId: string, data: {
        title: string;
        description: string;
        slug: string;
        image?: string;
        keywords?: string[];
        translations?: Array<{
            language: string;
            title: string;
            description: string;
            slug: string;
        }>;
    }): Promise<Category> {

        const { title, description, slug, image, keywords, translations } = data;

        // Update base category
        const category = await prisma.category.update({
            where: { categoryId },
            data: {
                title,
                description,
                slug,
                image: image || null,
                keywords: keywords ? { set: keywords } : undefined,
            },
        });

        // Update translations if provided
        if (translations && translations.length > 0) {
            for (const t of translations) {
                // Check if slug conflicts with another category's translation
                const existingTranslation = await prisma.categoryTranslation.findFirst({
                    where: {
                        slug: t.slug,
                        language: t.language,
                        NOT: { categoryId },
                    },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }

                // Upsert translation
                await prisma.categoryTranslation.upsert({
                    where: {
                        categoryId_language: {
                            categoryId,
                            language: t.language,
                        },
                    },
                    create: {
                        categoryId,
                        language: t.language,
                        title: t.title,
                        description: t.description || '',
                        slug: t.slug,
                    },
                    update: {
                        title: t.title,
                        description: t.description || '',
                        slug: t.slug,
                    },
                });
            }
        }

        return category;
    }

    /**
     * Deletes a category by its ID.
     * @param categoryId - The ID of the category
     * @returns The deleted category
        */
    static async deleteCategory(categoryId: string): Promise<Category> {
        const category = await prisma.category.delete({
            where: { categoryId },
        });

        return category;
    }


    /**
     * Retrieves a category by its slug.
     * @param slug - The slug of the category
     * @param language - The language code (default: 'en')
     * @returns The requested category or null if not found
     */
    static async getCategoryBySlug(slug: string, language: string = DEFAULT_LANGUAGE): Promise<Category | null> {
        const category = await prisma.category.findFirst({
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

        if (!category) return null;
        return this.transformCategoryWithTranslation(category, language);
    }


    /**
     * Deletes all categories.
     * @returns The deleted categories
     * */
    static async deleteAllCategories(): Promise<void> {
        await prisma.category.deleteMany();

        return;
    }
}