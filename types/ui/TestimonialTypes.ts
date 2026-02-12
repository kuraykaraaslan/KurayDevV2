import { z } from 'zod'

const TestimonialSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  review: z.string(),
})

export type Testimonial = z.infer<typeof TestimonialSchema>
export { TestimonialSchema }
