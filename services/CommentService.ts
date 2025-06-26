import { Comment, CommentWithPost } from "@/types/BlogTypes";
import prisma from "@/libs/prisma";

export default class CommentService {

    private static sqlInjectionRegex = /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)|(--)|(\b(AND|OR|NOT|IS|NULL|LIKE|IN|BETWEEN|EXISTS|CASE|WHEN|THEN|END|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|HAVING|GROUP|BY|ORDER|ASC|DESC|LIMIT|OFFSET)\b)/i; // SQL injection prevention
    private static emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    private static commentRegex = /^[a-zA-Z0-9\s.,!?()]+$/;
    private static noHTMLRegex = /<[^>]*>?/gm;
    private static noJS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

    /**
     * Creates a new comment with regex validation.
     * @param data - Comment data
     * @returns The created comment
     */

    static async createComment(data: Omit<Comment, 'commentId'>): Promise<Comment> {

        var { content, postId, parentId, email, name } = data;

        // Validate input
        if (!content || !postId || !email || !name) {
            throw new Error('All fields are required.');
        }

        // Check for SQL injection
        if (this.sqlInjectionRegex.test(content)) {
            throw new Error('SQL injection detected.');
        }

        // Validate email

        if (!this.emailRegex.test(email)) {
            throw new Error('Invalid email.');
        }

        // Validate comment content
        if (!this.commentRegex.test(content)) {
            throw new Error('Invalid comment content.');
        }

        // Sanitize input
        content = content.replace(this.noHTMLRegex, '');
        content = content.replace(this.noJS, '');

        

        // Validate input
        const existingComment = await prisma.comment.findFirst({
            where: { content },
        });

        if (existingComment) {
            throw new Error('Comment with the same content already exists.');
        }

        return await prisma.comment.create({ data });

    }

    /**
     * Retrieves all comments with optional pagination and search.
     * @param page - The page number
     * @param perPage - The number of comments per page
     * @param search - The search query
     * @param postId - The post ID
     * @returns An array of comments
     */
    static async getAllComments(
        data: {
            page: number;
            pageSize: number;
            search?: string;
            postId?: string;
            pending?: boolean;
        }): Promise<{ comments: CommentWithPost[], total: number }> {

        const { page, pageSize, search, postId , pending } = data;

        // Validate search query
        if (search && this.sqlInjectionRegex.test(search)) {
            throw new Error('SQL injection detected.');
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                content: {
                    contains: search,
                },
                status: pending ? undefined : 'APPROVED',
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                commentId: true,
                content: true,
                email: true,
                name: true,
                postId: true,
                parentId: true,
                status: true,
                createdAt: true,
                post: {
                    select: {
                        title: true,
                        slug: true,
                        postId: true,
                        image: true,
                    },
                },
            },
        });

        const total = await prisma.comment.count({
            where: {
                postId,
                content: {
                    contains: search,
                },
            },
        });

        // @ts-ignore
        return { comments, total };
    }

    /**
     * Retrieves a comment by ID.
     * @param commentId - The comment ID
     * @returns The comment
     */
    static async getCommentById(commentId: string): Promise<Comment> {
        const comment = await prisma.comment.findUnique({
            where: { commentId },
        });

        if (!comment) {
            throw new Error('Comment not found.');
        }

        return comment;
    }

    /**
     * Deletes a comment by ID.
     * @param commentId - The comment ID
     * @returns The deleted comment
     */
    static async deleteComment(commentId: string): Promise<Comment> {
        const comment = await prisma.comment.delete({
            where: { commentId },
        });

        if (!comment) {
            throw new Error('Comment not found.');
        }

        return comment;
    }

    /**
     * Updates a comment by ID.
     * @param commentId - The comment ID
     * @param data - The comment data
     * @returns The updated comment
     */
    static async updateComment(data: Comment): Promise<Comment> {
        const { commentId, content, postId, parentId, email, name, status } = data;

        // Update the comment
        const comment = await prisma.comment.update({
            where: { commentId },
            data,
        });

        return comment;
    }
}


