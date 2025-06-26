import { Post , PostWithCategory } from '@/types/BlogTypes';
import prisma from '@/libs/prisma';
import { MetadataRoute } from 'next';

export default class PostService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention


    /**
     * Creates a new post with regex validation.
     * @param data - Post data
     * @returns The created post
     */
    static async createPost(data: Omit<Post, 'postId'>): Promise<Post> {

        var { title, content, description, slug, keywords, image, authorId, categoryId, status, createdAt } = data;

        // Validate input
        if (!title || !content || !description || !slug || !keywords || !authorId || !categoryId) {
            throw new Error('All fields are required.');
        }

        if (keywords && typeof keywords === 'string') {
            keywords = (keywords as string).split(',');
        }

        // Validate input
        const existingPost = await prisma.post.findFirst({
            where: { OR: [{ title }, { slug }] },
        });

        if (existingPost) {
            throw new Error('Post with the same title or slug already exists.');
        }

        return await prisma.post.create({ data });
    }

    /**
     * Retrieves all posts with optional pagination and search.
     * @param page - The page number
     * @param perPage - The number of posts per page
     * @param search - The search query
     * @returns An array of posts
     */
    static async getAllPosts(
        data: {
            page: number;
            pageSize: number;
            search?: string;
            categoryId?: string;
            userId?: string;
            status?: string; //ALL, PUBLISHED, DRAFT
            postId?: string;
            slug?: string;
        }): Promise<{ posts: PostWithCategory[], total: number }> {

        const { page, pageSize, search, categoryId, status, userId, postId, slug } = data;
        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        //ALL, PUBLISHED, DRAFT

        const now = new Date();
        // Get posts by search query
        const query = {
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                postId: true,
                title: true,
                description: true,
                slug: true,
                keywords: true,
                image: true,
                authorId: true,
                categoryId: true,
                createdAt: true,
                status: true,
                views: true,
                content: postId ? true : slug ? true : false,
                deletedAt: true,
                category: {
                    select: {
                        categoryId: true,
                        title: true,
                        slug: true,
                        image: true,
                    },
                },
            },
            where: {
                OR: [
                    {
                        title: {
                            contains: search || '',
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: search || '',
                            mode: 'insensitive',
                        },
                    }
                ],
                userId: userId ? userId : undefined,
                postId: postId ? postId : undefined,
                categoryId: categoryId ? categoryId : undefined,
                status: status ? status === "ALL" ? undefined : status : "PUBLISHED",
                createdAt: {
                    lte: status === "ALL" ? undefined : now,
                },
                deletedAt: {
                    equals: status === "ALL" ? undefined : null,
                },
                slug: slug ? slug : undefined,
            },
        };

        const countQuery = {
            //skip: query.skip,
            //take: query.take,
            where: query.where,
        };



        const transaction = await prisma.$transaction([
            prisma.post.findMany(query as any),
            prisma.post.count(countQuery as any),
        ]);


        return { posts: transaction[0] as PostWithCategory[], total: transaction[1] };


    }

    /**
     * Updates a post by its ID.
     * @param postId - The ID of the post
     * @param data - The updated post data
     * @returns The updated post
     */
    static async updatePost(data: Post): Promise<Post> {

        const { postId, title, content, description, slug, keywords, image, authorId, categoryId, status, createdAt } = data;

        // Validate input
        if (!title || !content || !description || !slug || !keywords || !authorId || !categoryId) {
            throw new Error('All fields are required.');
        }

        if (keywords && typeof keywords === 'string') {
            data.keywords = (keywords as string).split(',');
        }

        // Update the post
        const post = await prisma.post.update({
            where: { postId },
            data,
        });

        return post;
    }

    /**
     * Deletes a post by its ID.
     * @param postId - The ID of the post
     */
    static async deletePost(postId: string): Promise<void> {
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

        return post;
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
     * @returns The post
     */
    static async getPostById(postId: string): Promise<Post | null> {
        return await prisma.post.findUnique({
            where: { postId },
        });

    }


}