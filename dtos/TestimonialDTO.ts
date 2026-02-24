import { z } from 'zod'
import TestimonialMessages from '@/messages/TestimonialMessages'

// Request DTOs
export const GetTestimonialsRequestSchema = z.object({
  page: z.number().int().default(0),
  pageSize: z.number().int().default(10),
  search: z.string().optional(),
})

export const CreateTestimonialRequestSchema = z.object({
  name: z.string().min(1, TestimonialMessages.NAME_REQUIRED),
  title: z.string().min(1, TestimonialMessages.TITLE_REQUIRED),
  review: z.string().min(1, TestimonialMessages.REVIEW_REQUIRED),
  image: z.string().optional().default(''),
  status: z.string().optional().default('PUBLISHED'),
})

export const UpdateTestimonialRequestSchema = CreateTestimonialRequestSchema.extend({
  testimonialId: z.string().min(1, TestimonialMessages.INVALID_TESTIMONIAL_ID),
})

export const GetTestimonialByIdRequestSchema = z.object({
  testimonialId: z.string().min(1, TestimonialMessages.INVALID_TESTIMONIAL_ID),
})

// Response DTOs
export const TestimonialResponseSchema = z.object({
  testimonialId: z.string(),
  name: z.string(),
  title: z.string(),
  review: z.string(),
  image: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const TestimonialListResponseSchema = z.object({
  testimonials: z.array(TestimonialResponseSchema),
  total: z.number(),
})

// Type exports
export type GetTestimonialsRequest = z.infer<typeof GetTestimonialsRequestSchema>
export type CreateTestimonialRequest = z.infer<typeof CreateTestimonialRequestSchema>
export type UpdateTestimonialRequest = z.infer<typeof UpdateTestimonialRequestSchema>
export type GetTestimonialByIdRequest = z.infer<typeof GetTestimonialByIdRequestSchema>
export type TestimonialResponse = z.infer<typeof TestimonialResponseSchema>
export type TestimonialListResponse = z.infer<typeof TestimonialListResponseSchema>
