import { Post, User } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class PostService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention


    /**
     * Creates a new post with regex validation.
     * @param data - Post data
     * @returns The created post
     */
    static async createPost(data: {
        title: string;
        content: string;
        description: string;
        slug: string;
        keywords: string[];
        image: string;
        authorId: string;
        categoryId: string;

    }): Promise<any> {

        console.log(data);

        var { title, content, description, slug, keywords, image, authorId, categoryId } = data;

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

        // Create the post
        const post = await prisma.post.create({
            data: {
                title,
                content,
                description,
                slug,
                keywords,
                image,
                authorId,
                categoryId,
            },
        });

        return post;
    }

    /**
     * Retrieves a post by its ID.
     * @param postId - The ID of the post
     * @returns The requested post or null if not found
     */
    static async getPostById(postId: string): Promise<Post | null> {
        const post = await prisma.post.findUnique({
            where: { postId },
        });

        return post;
    }

    /**
     * Retrieves all posts with optional pagination and search.
     * @param page - The page number
     * @param perPage - The number of posts per page
     * @param search - The search query
     * @returns An array of posts
     */
    static async getAllPosts(
        page = 1,
        perPage = 10,
        search?: string
    ): Promise<{ posts: Post[], total: number }> {

        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('Invalid search query.');
        }

        if (search && search !== '') {
            // Get posts by search query
            const query = await prisma.$transaction([
                prisma.post.findMany({
                    skip: (page - 1) * perPage,
                    take: perPage,
                    orderBy: { createdAt: 'asc' },
                    where: {
                        OR: [
                            { title: { contains: search } },
                            { content: { contains: search } },
                            { description: { contains: search } },
                            { slug: { contains: search } },
                            { keywords: { hasSome: search.split(',') } },
                        ],
                    },
                }),
                prisma.post.count({
                    where: {
                        OR: [
                            { title: { contains: search } },
                            { content: { contains: search } },
                            { description: { contains: search } },
                            { slug: { contains: search } },
                            { keywords: { hasSome: search.split(',') } },
                        ],
                    },
                }),
            ]);
  
            return { posts: query[0], total: query[1] };
        }

        // Get all posts
        const query = await prisma.$transaction([
            prisma.post.findMany({
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma.post.count(),
        ]);

        return { posts: query[0], total: query[1] };
    }


    /**
     * Get posts by slug    
     * @param slug - The slug of the post
     * @returns The requested post or null if not found
     */

    static async getPostBySlug(slug: string): Promise<Post | null> {
        const post = await prisma.post.findFirst({
            where: { slug },
        });

        return post;
    }

    /**
     * Updates a post by its ID.
     * @param postId - The ID of the post
     * @param data - The updated post data
     * @returns The updated post
     */
    static async updatePost(postId: string, data: {
        title: string;
        content: string;
        description: string;
        slug: string;
        keywords: string[];
        image: string;
        authorId: string;
        categoryId: string;
    }): Promise<Post> {
            
            const { title, content, description, slug, keywords, image, authorId, categoryId } = data;
    
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
            await prisma.post.delete({
                where: { postId },
            });
        }

}