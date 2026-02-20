import { z } from 'zod'

export const NotificationSchema = z.object({
  notificationId: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(),
  path: z.string().optional(),
})

export type Notification = z.infer<typeof NotificationSchema>

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().int().nonnegative(),
})

export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>
