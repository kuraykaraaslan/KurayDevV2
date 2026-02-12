import { z } from 'zod'
import CommentMessages from '@/messages/CommentMessages'

// Request DTOs
export const CreateCommentRequestSchema = z.object({
  content: z.string().min(1, CommentMessages.CONTENT_REQUIRED),
  postId: z.string().min(1, CommentMessages.POST_ID_REQUIRED),
  parentId: z.string().nullable().default(null),
  email: z.string().email(CommentMessages.INVALID_EMAIL),
  name: z.string().min(1, CommentMessages.NAME_REQUIRED),
})

export const GetCommentsRequestSchema = z.object({
  postId: z.string().min(1, CommentMessages.POST_ID_REQUIRED),
  page: z.number().int().default(0),
  pageSize: z.number().int().default(10),
  status: z.enum(['PUBLISHED', 'NOT_PUBLISHED', 'SPAM', 'PENDING']).optional(),
})

// Response DTOs
export const CommentResponseSchema = z.object({
  commentId: z.string(),
  content: z.string(),
  postId: z.string(),
  parentId: z.string().nullable(),
  email: z.string(),
  name: z.string(),
  status: z.enum(['PUBLISHED', 'NOT_PUBLISHED', 'SPAM', 'PENDING']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CommentListResponseSchema = z.object({
  comments: z.array(CommentResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const CreateCommentResponseSchema = z.object({
  message: z.string(),
  status: z.enum(['PUBLISHED', 'NOT_PUBLISHED', 'SPAM', 'PENDING']),
})

// Type exports
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>
export type GetCommentsRequest = z.infer<typeof GetCommentsRequestSchema>
export type CommentResponse = z.infer<typeof CommentResponseSchema>
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>
