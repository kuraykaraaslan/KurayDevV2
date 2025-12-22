import { z } from 'zod'
import PostMessages from '@/messages/PostMessages'

// Like Post DTOs
export const LikePostRequestSchema = z.object({
  postId: z.string().min(1, PostMessages.POST_NOT_FOUND),
})

export const LikePostResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  liked: z.boolean().optional(),
})

// Get Like Count DTOs
export const GetLikeCountRequestSchema = z.object({
  postId: z.string().min(1, PostMessages.POST_NOT_FOUND),
})

export const GetLikeCountResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  total: z.number().optional(),
})

// Type Exports
export type LikePostRequest = z.infer<typeof LikePostRequestSchema>
export type LikePostResponse = z.infer<typeof LikePostResponseSchema>
export type GetLikeCountRequest = z.infer<typeof GetLikeCountRequestSchema>
export type GetLikeCountResponse = z.infer<typeof GetLikeCountResponseSchema>

// Schema Exports
export {
  LikePostRequestSchema,
  LikePostResponseSchema,
  GetLikeCountRequestSchema,
  GetLikeCountResponseSchema,
} as const
