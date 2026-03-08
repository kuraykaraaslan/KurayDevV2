import { z } from 'zod'
import MediaMessages from '@/messages/MediaMessages'

// Request DTOs
export const UpdateMediaRequestSchema = z.object({
  name: z.string().min(1, MediaMessages.NAME_REQUIRED).optional(),
  altText: z.string().optional(),
})

export const DeleteMediaRequestSchema = z.object({
  key: z.string().min(1, MediaMessages.KEY_REQUIRED),
})

export const UploadFromUrlRequestSchema = z.object({
  url: z.string().url(MediaMessages.URL_REQUIRED),
  folder: z.string().optional(),
})

// Response DTOs
export const MediaResponseSchema = z.object({
  mediaId: z.string(),
  key: z.string(),
  url: z.string(),
  folder: z.string(),
  mimeType: z.string(),
  size: z.number(),
  name: z.string().nullable(),
  altText: z.string().nullable(),
  originalName: z.string(),
  uploadedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const MediaUploadResponseSchema = z.object({
  message: z.string(),
  url: z.string(),
  media: MediaResponseSchema.optional(),
})

// Type exports
export type UpdateMediaRequest = z.infer<typeof UpdateMediaRequestSchema>
export type DeleteMediaRequest = z.infer<typeof DeleteMediaRequestSchema>
export type UploadFromUrlRequest = z.infer<typeof UploadFromUrlRequestSchema>
export type MediaResponse = z.infer<typeof MediaResponseSchema>
export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>
