const Testimonial = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  review: z.string(),
})

export type Testimonial = z.infer<typeof Testimonial>
export { Testimonial }