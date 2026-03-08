import { z } from 'zod'
import PushNotificationMessages from '@/messages/PushNotificationMessages'
import { PushTargetEnum } from '@/types/features/PushNotificationTypes'

// Request DTOs
export const SendPushNotificationRequestSchema = z.object({
  title: z.string().min(1, PushNotificationMessages.TITLE_REQUIRED),
  body: z.string().min(1, PushNotificationMessages.BODY_REQUIRED),
  url: z.string().optional(),
  target: PushTargetEnum.default('all'),
})

export const SubscribePushRequestSchema = z.object({
  endpoint: z.string().min(1, PushNotificationMessages.ENDPOINT_REQUIRED),
  keys: z.object({
    p256dh: z.string().min(1, PushNotificationMessages.KEYS_REQUIRED),
    auth: z.string().min(1, PushNotificationMessages.KEYS_REQUIRED),
  }),
})

// Response DTOs
export const PushNotificationResponseSchema = z.object({
  message: z.string(),
})

// Type exports
export type SendPushNotificationRequest = z.infer<typeof SendPushNotificationRequestSchema>
export type SubscribePushRequest = z.infer<typeof SubscribePushRequestSchema>
export type PushNotificationResponse = z.infer<typeof PushNotificationResponseSchema>
