import { Post, User } from '@prisma/client';
import prisma from '@/libs/prisma';

export default class PostService {




    // Regular expressions for validation
    private static titleRegex = /^.{1,100}$/; // Title must be between 1 and 100 characters
    private static slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // Slug must be URL-friendly
    private static urlRegex = /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_.]*)?)?$/i; // Validates URLs
    private static searchQueryRegex = /^[a-zA-Z0-9\s]{0,100}$/; // Search query validation


    /**
     * Creates a new post with regex validation.
     * @param data - Post data
     * @returns The created post
     */
    static async createPost(data: {
        title: string;
        content: string;
        authorId: string;
        description?: string;
        slug: string;
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        imageUrl?: string;
    },
        author: Partial<User>
    ): Promise<Post> {
        // Regex validation
        if (!this.titleRegex.test(data.title)) {
            throw new Error('Title must be between 1 and 100 characters.');
        }

        if (!this.slugRegex.test(data.slug)) {
            throw new Error('Slug can only contain lowercase letters, numbers, and hyphens.');
        }

        if (data.imageUrl && !this.urlRegex.test(data.imageUrl)) {
            throw new Error('Invalid image URL.');
        }

        // Create the post
        const post = await prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                authorId: data.authorId,
                description: data.description,
                slug: data.slug,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                keywords: data.keywords,
                imageUrl: data.imageUrl,
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
     * Updates a post with regex validation.
     * @param postId - The ID of the post to update
     * @param data - Updated post data
     * @returns The updated post
     */
    static async updatePost(
        postId: string,
        data: {
            title?: string;
            content?: string;
            description?: string;
            slug?: string;
            metaTitle?: string;
            metaDescription?: string;
            keywords?: string[];
            imageUrl?: string;
        }
    ): Promise<Post> {
        // Regex validation
        if (data.title && !this.titleRegex.test(data.title)) {
            throw new Error('Title must be between 1 and 100 characters.');
        }

        if (data.slug && !this.slugRegex.test(data.slug)) {
            throw new Error('Slug can only contain lowercase letters, numbers, and hyphens.');
        }

        if (data.imageUrl && !this.urlRegex.test(data.imageUrl)) {
            throw new Error('Invalid image URL.');
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
     * @param postId - The ID of the post to delete
     * @returns The deleted post
     */
    static async deletePost(postId: string): Promise<Post> {
        const post = await prisma.post.delete({
            where: { postId },
        });

        return post;
    }

    /**
     * Retrieves all posts with optional pagination and search query.
     * @param page - Page number (default is 1)
     * @param pageSize - Number of posts per page (default is 10)
     * @param search - Search query to filter posts by title or content
     * @returns An array of posts
     */
    static async getAllPosts(
        page: number = 1,
        pageSize: number = 10,
        search?: string
    ): Promise<{ data: Post[]; page: number; pageSize: number; total: number }> {
        // Validate page and pageSize
        if (page < 1) {
            throw new Error('Page number must be greater than 0.');
        }
        if (pageSize < 1) {
            throw new Error('Page size must be greater than 0.');
        }

        // Regex validation for search query
        if (search && !this.searchQueryRegex.test(search)) {
            throw new Error('Search query can only contain letters, numbers, and spaces, up to 100 characters.');
        }

        const skip = (page - 1) * pageSize;

        // Build the where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        const posts = await prisma.$transaction([
            prisma.post.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.post.count({ where }),
        ]);


        return {
            data: posts[0],
            page,
            pageSize,
            total: posts[1],
        };
    }



    /**
     * Retrieves a post by its slug.
     * @param slug - The slug of the post
     * @returns The requested post or null if not found
     */
    static async getPostBySlug(slug: string): Promise<Post | null> {
        // Regex validation
        if (!this.slugRegex.test(slug)) {
            throw new Error('Invalid slug format.');
        }

        const post = await prisma.post.findUnique({
            where: { slug },
        });

        return post;
    }
}