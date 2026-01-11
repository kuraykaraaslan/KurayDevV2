import { Post, PostSchema, PostWithData } from '@/types/content/BlogTypes';
import {prisma} from '@/libs/prisma';
import { MetadataRoute } from 'next';
import redisInstance from '@/libs/redis';

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'es', 'nl'];

export default class PostService {
    private static CACHE_KEY = 'sitemap:blog';
    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention

    private static getPostWithDataSelect(language: string) {
        return {
            postId: true,
            image: true,
            authorId: true,
            categoryId: true,
            createdAt: true,
            status: true,
            views: true,
            deletedAt: true,
            // Get translation for the requested language
            translations: {
                where: { language },
                select: {
                    title: true,
                    content: true,
                    description: true,
                    slug: true,
                    keywords: true,
                    language: true,
                },
            },
            category: {
                select: {
                    categoryId: true,
                    image: true,
                    translations: {
                        where: { language },
                        select: {
                            title: true,
                            slug: true,
                        },
                    },
                },
            },
            author: {
                select: {
                    userId: true,
                    userProfile: true
                },
            },
        };
    }

    /**
     * Transforms raw post data with translations to flat PostWithData format
     */
    private static transformPostWithTranslation(post: any): PostWithData | null {
        const translation = post.translations?.[0];
        if (!translation) return null;

        const categoryTranslation = post.category?.translations?.[0];

        return {
            postId: post.postId,
            title: translation.title,
            content: translation.content,
            description: translation.description,
            slug: translation.slug,
            keywords: translation.keywords,
            image: post.image,
            authorId: post.authorId,
            categoryId: post.categoryId,
            createdAt: post.createdAt,
            status: post.status,
            views: post.views,
            deletedAt: post.deletedAt,
            author: post.author,
            category: {
                categoryId: post.category.categoryId,
                title: categoryTranslation?.title || '',
                slug: categoryTranslation?.slug || '',
                image: post.category.image,
            },
        } as PostWithData;
    }

    /**
     * Creates a new post with translations.
     * @param data - Post data with optional translations
     * @returns The created post
     */
    static async createPost(data: Omit<Post, 'postId'> & {
        translations?: Array<{
            language: string;
            title: string;
            content: string;
            description?: string;
            slug: string;
            keywords?: string[];
        }>;
    }): Promise<Post> {

        let { title, content, description, slug, keywords, authorId, categoryId, translations } = data as any;

        // Validate input
        if (!authorId || !categoryId) {
            throw new Error('Author and Category are required.');
        }

        // If translations provided, validate at least one complete translation
        if (translations && translations.length > 0) {
            const validTranslation = translations.find((t: any) => t.title && t.content && t.slug);
            if (!validTranslation) {
                throw new Error('At least one translation must have title, content, and slug.');
            }
            // Use first translation as default values
            title = title || validTranslation.title;
            content = content || validTranslation.content;
            description = description || validTranslation.description || '';
            slug = slug || validTranslation.slug;
            keywords = keywords || validTranslation.keywords || [];
        }

        // Validate required fields
        if (!title || !content || !slug) {
            throw new Error('Title, content, and slug are required.');
        }

        if (keywords && typeof keywords === 'string') {
            keywords = (keywords as string).split(',');
        }

        // Check for existing slugs in translations
        if (translations && translations.length > 0) {
            for (const t of translations) {
                const existingTranslation = await prisma.postTranslation.findFirst({
                    where: { slug: t.slug, language: t.language },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }
            }
        }

        await redisInstance.del(this.CACHE_KEY);

        // Create post with translations
        const post = await prisma.post.create({
            data: {
                title,
                content,
                description,
                slug,
                keywords,
                authorId,
                categoryId,
                image: data.image,
                status: data.status,
                createdAt: data.createdAt || new Date(),
                // Create translations if provided
                ...(translations && translations.length > 0 ? {
                    translations: {
                        create: translations.map((t: any) => ({
                            language: t.language,
                            title: t.title,
                            content: t.content,
                            description: t.description || '',
                            slug: t.slug,
                            keywords: t.keywords || [],
                        })),
                    },
                } : {}),
            },
        });

        return PostSchema.parse(post);
    }

    /**
     * Retrieves all posts with optional pagination and search.
     * @param page - The page number
     * @param perPage - The number of posts per page
     * @param search - The search query
     * @param language - The language code (default: 'en')
     * @returns An array of posts
     */
    static async getAllPosts(
        data: {
            page: number;
            pageSize: number;
            search?: string;
            categoryId?: string;
            authorId?: string;
            status?: string; //ALL, PUBLISHED, DRAFT
            postId?: string;
            slug?: string;
            createdAfter?: Date;
            language?: string;
        }): Promise<{ posts: PostWithData[], total: number }> {

        const { page, pageSize, search, categoryId, status, authorId, postId, slug } = data;
        const language = data.language || DEFAULT_LANGUAGE;

        console.log("Fetching posts with params:", data);

        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        const now = new Date();

        // Build where clause for translations search
        const translationSearchFilter = search ? {
            translations: {
                some: {
                    language,
                    OR: [
                        { title: { contains: search, mode: 'insensitive' as const } },
                        { description: { contains: search, mode: 'insensitive' as const } },
                    ],
                },
            },
        } : {};

        // Build where clause for slug (search in translations)
        const slugFilter = slug ? {
            translations: {
                some: {
                    language,
                    slug,
                },
            },
        } : {};

        const baseWhere = {
            ...translationSearchFilter,
            ...slugFilter,
            authorId: authorId || undefined,
            postId: postId || undefined,
            categoryId: categoryId || undefined,
            status: status === "ALL" ? undefined : (status || "PUBLISHED"),
            createdAt: {
                lte: status === "ALL" ? undefined : now,
                gte: data.createdAfter || undefined,
            },
            deletedAt: status === "ALL" ? undefined : null,
            // Only return posts that have translation in requested language
            translations: {
                some: { language },
            },
        };

        const query = {
            skip: page * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' as const },
            select: this.getPostWithDataSelect(language),
            where: baseWhere,
        };

        const countQuery = { where: baseWhere };

        const transaction = await prisma.$transaction([
            prisma.post.findMany(query as any),
            prisma.post.count(countQuery as any),
        ]);

        // Transform posts with translations to flat format
        const posts = (transaction[0] as any[])
            .map(post => this.transformPostWithTranslation(post))
            .filter((post): post is PostWithData => post !== null);

        return { posts, total: transaction[1] };
    }

    /**
     * Updates a post by its ID with translations.
     * @param data - The updated post data with optional translations
     * @returns The updated post
     */
    static async updatePost(data: Post & {
        translations?: Array<{
            language: string;
            title: string;
            content: string;
            description?: string;
            slug: string;
            keywords?: string[];
        }>;
    }): Promise<Post> {

        const { postId, title, content, description, slug, keywords, authorId, categoryId, translations } = data as any;

        console.log("Updating post:", postId);

        // Validate input
        if (!authorId || !categoryId) {
            throw new Error('Author and Category are required.');
        }

        let processedKeywords = keywords;
        if (keywords && typeof keywords === 'string') {
            processedKeywords = (keywords as string).split(',');
        }

        console.log("Validated data for post:", postId);

        // Update the post base data
        const post = await prisma.post.update({
            where: { postId },
            data: {
                title,
                content,
                description,
                slug,
                keywords: processedKeywords,
                authorId,
                categoryId,
                image: (data as any).image,
                status: (data as any).status,
                views: (data as any).views,
                createdAt: (data as any).createdAt,
            },
        });

        // Update translations if provided
        if (translations && translations.length > 0) {
            for (const t of translations) {
                // Check if slug conflicts with another post's translation
                const existingTranslation = await prisma.postTranslation.findFirst({
                    where: {
                        slug: t.slug,
                        language: t.language,
                        NOT: { postId },
                    },
                });
                if (existingTranslation) {
                    throw new Error(`Slug "${t.slug}" already exists for language "${t.language}".`);
                }

                // Upsert translation
                await prisma.postTranslation.upsert({
                    where: {
                        postId_language: {
                            postId,
                            language: t.language,
                        },
                    },
                    create: {
                        postId,
                        language: t.language,
                        title: t.title,
                        content: t.content,
                        description: t.description || '',
                        slug: t.slug,
                        keywords: t.keywords || [],
                    },
                    update: {
                        title: t.title,
                        content: t.content,
                        description: t.description || '',
                        slug: t.slug,
                        keywords: t.keywords || [],
                    },
                });
            }
        }

        await redisInstance.del(this.CACHE_KEY);

        return PostSchema.parse(post);
    }

    /**
     * Deletes a post by its ID.
     * @param postId - The ID of the post
     */
    static async deletePost(postId: string): Promise<void> {

        await redisInstance.del(this.CACHE_KEY);
        
        await prisma.post.update({
            where: { postId },
            data: {
                status: 'ARCHIVED',
                deletedAt: new Date(),
            },
        });
    }

    /**
     * Save one view to the post
     * @param postId - The ID of the post
     * @returns The updated post
     * */
    static async incrementViewCount(postId: string): Promise<Post> {
        const post = await prisma.post.update({
            where: { postId },
            data: {
                views: {
                    increment: 1,
                },
            },
        });

        return PostSchema.parse(post);
    }


    //generate site map how do i do use: 
    static async generateSiteMap(): Promise<MetadataRoute.Sitemap> {
        const { posts } = await this.getAllPosts({ page: 1, pageSize: 1000, search: '', categoryId: '', status: 'PUBLISHED' });
        return posts.map(post => {
            return {
                url: `/blog/${post.slug}`,
                lastModified: post.createdAt.toISOString(),
                changeFrequency: 'daily',
                priority: 0.7,
            };
        }
        );
    }


    /**
     * Retrieves a post by its ID.
     * @param postId - The ID of the post
     * @param language - The language code (default: 'en')
     * @returns The post
     */
    static async getPostById(postId: string, language: string = DEFAULT_LANGUAGE): Promise<PostWithData | null> {
        const post = await prisma.post.findUnique({
            where: { postId },
            select: this.getPostWithDataSelect(language),
        });

        if (!post) return null;
        return this.transformPostWithTranslation(post);
    }

    /**
     * Retrieves a post by its slug and language.
     * @param slug - The slug of the post
     * @param language - The language code (default: 'en')
     * @returns The post
     */
    static async getPostBySlug(slug: string, language: string = DEFAULT_LANGUAGE): Promise<PostWithData | null> {
        const post = await prisma.post.findFirst({
            where: {
                translations: {
                    some: { slug, language },
                },
                status: 'PUBLISHED',
                deletedAt: null,
            },
            select: this.getPostWithDataSelect(language),
        });

        if (!post) return null;
        return this.transformPostWithTranslation(post);
    }

    /**
     * Get all blogpost slugs with postName and categorySlug
     * @param language - The language code (default: 'en')
     * @returns Array of objects with postName and categorySlug
     */
    static async getAllPostSlugs(language: string = DEFAULT_LANGUAGE): Promise<{ title: string; slug: string; categorySlug: string }[]> {
        const posts = await prisma.post.findMany({
            where: {
                status: 'PUBLISHED',
                deletedAt: null,
                createdAt: {
                    lte: new Date(),
                },
                translations: {
                    some: { language },
                },
            },
            select: {
                translations: {
                    where: { language },
                    select: {
                        title: true,
                        slug: true,
                    },
                },
                category: {
                    select: {
                        translations: {
                            where: { language },
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        return posts
            .filter(post => post.translations[0] && post.category.translations[0])
            .map(post => ({
                title: post.translations[0].title,
                slug: post.translations[0].slug,
                categorySlug: post.category.translations[0].slug,
            }));
    }

    /**
     * Get available languages for a post
     * @param postId - The ID of the post
     * @returns Array of language codes
     */
    static async getPostLanguages(postId: string): Promise<string[]> {
        const translations = await prisma.postTranslation.findMany({
            where: { postId },
            select: { language: true },
        });
        return translations.map(t => t.language);
    }

}