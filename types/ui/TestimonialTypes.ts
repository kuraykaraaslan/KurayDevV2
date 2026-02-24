import { z } from 'zod'

const TestimonialSchema = z.object({
  testimonialId: z.string(),
  name: z.string(),
  title: z.string(),
  review: z.string(),
  image: z.string().nullable().optional(),
  status: z.string().default('PUBLISHED'),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Testimonial = z.infer<typeof TestimonialSchema>
export { TestimonialSchema }