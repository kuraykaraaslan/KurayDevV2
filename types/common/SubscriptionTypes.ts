import { z } from 'zod'

const SubscriptionSchema = z.object({
  email: z.string().email(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
  unsubscribeToken: z.string(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
export { SubscriptionSchema }
