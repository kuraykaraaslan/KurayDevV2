import { z } from "zod";
import PostMessages from "@/messages/PostMessages";

// Request DTOs
export const GetPostsRequestSchema = z.object({
    page: z.number().int().default(0),
    pageSize: z.number().int().default(10),
    postId: z.string().optional(),
    authorId: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('PUBLISHED'),
    categoryId: z.string().optional(),
    search: z.string().optional(),
});

export const CreatePostRequestSchema = z.object({
    title: z.string().min(1, PostMessages.TITLE_REQUIRED),
    description: z.string().optional(),
    content: z.string().min(1, PostMessages.CONTENT_REQUIRED),
    slug: z.string().min(1, PostMessages.SLUG_REQUIRED),
    image: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
    categoryId: z.string().min(1, PostMessages.CATEGORY_REQUIRED),
    authorId: z.string().min(1, PostMessages.AUTHOR_REQUIRED),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
});

export const UpdatePostRequestSchema = CreatePostRequestSchema.extend({
    postId: z.string().min(1, "Post ID is required"),
});

// Response DTOs
export const PostResponseSchema = z.object({
    postId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    content: z.string(),
    slug: z.string(),
    image: z.string().nullable(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
    categoryId: z.string(),
    authorId: z.string(),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    seoKeywords: z.array(z.string()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const PostListResponseSchema = z.object({
    posts: z.array(PostResponseSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

// Type exports
export type GetPostsRequest = z.infer<typeof GetPostsRequestSchema>;
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;
export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;
