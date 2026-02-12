import { z } from 'zod'
import AIMessages from '@/messages/AIMessages'
import ContactMessages from '@/messages/ContactMessages'

// AI Service Request DTOs
export const GPT4oRequestSchema = z.object({
  prompt: z.string().min(1, AIMessages.PROMPT_REQUIRED),
  maxTokens: z.number().int().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const DallERequestSchema = z.object({
  prompt: z.string().min(1, AIMessages.PROMPT_REQUIRED),
  size: z.enum(['256x256', '512x512', '1024x1024']).default('1024x1024'),
  n: z.number().int().min(1).max(10).default(1),
})

// Response DTOs
export const GPT4oResponseSchema = z.object({
  text: z.string(),
  tokens: z.number().optional(),
  model: z.string().optional(),
})

export const DallEResponseSchema = z.object({
  imageUrl: z.string().url(),
  revisedPrompt: z.string().optional(),
})

// Contact Form DTOs
export const ContactFormRequestSchema = z.object({
  name: z.string().min(1, ContactMessages.NAME_REQUIRED),
  email: z.string().email(ContactMessages.INVALID_EMAIL),
  phone: z.string().min(1, ContactMessages.PHONE_REQUIRED),
  message: z.string().min(1, ContactMessages.MESSAGE_REQUIRED),
  // Honeypot field - should be empty for real users
  website: z.string().optional(),
  // Form load timestamp for timing check
  _formLoadTime: z.number().optional(),
})

export const ContactFormResponseSchema = z.object({
  message: z.string(),
})

// Subscription DTOs
export const SubscriptionRequestSchema = z.object({
  email: z.string().email(ContactMessages.INVALID_EMAIL),
})

export const SubscriptionResponseSchema = z.object({
  message: z.string(),
})

// Settings DTOs
export const GetSettingsResponseSchema = z.object({
  settings: z.record(z.any()),
})

export const UpdateSettingsRequestSchema = z.object({
  settings: z.record(z.any()),
})

export const UpdateSettingsResponseSchema = z.object({
  settings: z.record(z.any()),
})

// AWS File Upload DTOs
export const AWSUploadRequestSchema = z.object({
  file: z.instanceof(File),
  folder: z.string().optional(),
})

export const AWSUploadResponseSchema = z.object({
  url: z.string().url(),
})

// Search DTOs
export enum SearchType {
  BLOG = 'BLOG',
  PROJECT = 'PROJECT',
  USER = 'USER',
}

export const SearchResultItemSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  path: z.string(),
  type: z.nativeEnum(SearchType),
  createdAt: z.date(),
})

export const SearchRequestSchema = z.object({
  q: z.string().optional().default(''),
})

export const SearchResponseSchema = z.object({
  hits: z.array(SearchResultItemSchema),
})

// Type exports
export type GPT4oRequest = z.infer<typeof GPT4oRequestSchema>
export type DallERequest = z.infer<typeof DallERequestSchema>
export type GPT4oResponse = z.infer<typeof GPT4oResponseSchema>
export type DallEResponse = z.infer<typeof DallEResponseSchema>
export type ContactFormRequest = z.infer<typeof ContactFormRequestSchema>
export type ContactFormResponse = z.infer<typeof ContactFormResponseSchema>
export type SubscriptionRequest = z.infer<typeof SubscriptionRequestSchema>
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>
export type GetSettingsResponse = z.infer<typeof GetSettingsResponseSchema>
export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>
export type UpdateSettingsResponse = z.infer<typeof UpdateSettingsResponseSchema>
export type AWSUploadRequest = z.infer<typeof AWSUploadRequestSchema>
export type AWSUploadResponse = z.infer<typeof AWSUploadResponseSchema>
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>
export type SearchRequest = z.infer<typeof SearchRequestSchema>
export type SearchResponse = z.infer<typeof SearchResponseSchema>
