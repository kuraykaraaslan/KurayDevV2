import { z } from 'zod'

const ContactFormSchema = z.object({
  contactId: z.string().nullable(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string(),
  createdAt: z.date().optional(),
})

export type ContactForm = z.infer<typeof ContactFormSchema>
export { ContactFormSchema }
