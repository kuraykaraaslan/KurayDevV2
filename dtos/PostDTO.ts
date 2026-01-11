import { z } from "zod";
import PostMessages from "@/messages/PostMessages";
import { PostStatusEnum } from "@/types/content/BlogTypes";

// Request DTOs
export const GetPostsRequestSchema = z.object({
    page: z.number().int().default(0),
    pageSize: z.number().int().default(10),
    postId: z.string().optional(),
    authorId: z.string().optional(),
    status: PostStatusEnum.optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
});

// Translation schema for multi-language support
export const PostTranslationInputSchema = z.object({
    language: z.string().min(2).max(5),
    title: z.string().min(1),
    content: z.string().min(1),
    description: z.string().optional(),
    slug: z.string().min(1),
    keywords: z.array(z.string()).optional(),
});

export const CreatePostRequestSchema = z.object({
    title: z.string().min(1, PostMessages.TITLE_REQUIRED),
    content: z.string().min(1, PostMessages.CONTENT_REQUIRED),
    authorId: z.string().min(1, PostMessages.AUTHOR_ID_REQUIRED),
    description: z.string().min(1, PostMessages.DESCRIPTION_REQUIRED),
    slug: z.string().min(1, PostMessages.SLUG_REQUIRED),
    keywords: z.array(z.string()).min(1, PostMessages.KEYWORDS_REQUIRED),
    createdAt: z.coerce.date(),
    categoryId: z.string(),
    image: z.string().nullable(),
    status: PostStatusEnum.default("DRAFT"),
    views: z.number().default(0),
    deletedAt: z.date().nullable().optional(),
    translations: z.array(PostTranslationInputSchema).optional(),
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
export type PostTranslationInput = z.infer<typeof PostTranslationInputSchema>;
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;
export type UpdatePostRequest = z.infer<typeof UpdatePostRequestSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;
