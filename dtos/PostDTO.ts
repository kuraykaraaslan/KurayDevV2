import { z } from "zod";
import PostMessages from "@/messages/PostMessages";
import { PostStatus } from "@/types";

// Request DTOs
export const GetPostsRequestSchema = z.object({
    page: z.number().int().default(0),
    pageSize: z.number().int().default(10),
    postId: z.string().optional(),
    authorId: z.string().optional(),
    status: PostStatus.default("PUBLISHED"),
    categoryId: z.string().optional(),
    search: z.string().optional(),
});

export const CreatePostRequestSchema = z.object({
    title: z.string().min(1, PostMessages.TITLE_REQUIRED),
    content: z.string().min(1, PostMessages.CONTENT_REQUIRED),
    authorId: z.string().min(1, PostMessages.AUTHOR_ID_REQUIRED),
    description: z.string().min(1, PostMessages.DESCRIPTION_REQUIRED),
    slug: z.string().min(1, PostMessages.SLUG_REQUIRED),
    keywords: z.array(z.string()).min(1, PostMessages.KEYWORDS_REQUIRED),
    createdAt: z.date(),
    categoryId: z.string(),
    image: z.string().nullable(),
    status: z.string().default("PUBLISHED"),
    views: z.number().default(0),
    deletedAt: z.date().nullable().optional(),
});

export const UpdatePostRequestSchema = CreatePostRequestSchema.extend({
    postId: z.string().min(1, "Post ID is required"),
});

// Response DTOs
export const PostResponseSchema = z.object({
    postId: z.string(),
    title: z.string(),
    content: z.string(),
    authorId: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    keywords: z.array(z.string()),
    createdAt: z.date(),
    categoryId: z.string(),
    image: z.string().nullable(),
    status: z.string().default("PUBLISHED"),
    views: z.number().default(0),
    deletedAt: z.date().nullable().optional(),
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
