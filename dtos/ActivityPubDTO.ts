import { z } from 'zod'

/**
 * Validates a raw incoming ActivityPub activity from the inbox.
 * Kept loose so we can handle any activity type gracefully.
 */
export const InboxActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.union([
    z.string().url(),
    z.object({ id: z.string().url() }).passthrough(),
  ]),
  object: z.union([z.string(), z.object({}).passthrough()]).optional(),
})

export type InboxActivityInput = z.infer<typeof InboxActivitySchema>
