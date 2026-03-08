import { z } from 'zod'

// Push Notification Target enum
export const PushTargetEnum = z.enum(['all', 'admins'])
export type PushTarget = z.infer<typeof PushTargetEnum>
