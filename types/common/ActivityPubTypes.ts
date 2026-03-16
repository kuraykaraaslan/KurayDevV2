import { z } from 'zod'

// ── JSON-LD context ──────────────────────────────────────────────────

export const AP_CONTEXT = [
  'https://www.w3.org/ns/activitystreams',
  'https://w3id.org/security/v1',
] as const

export const AP_PUBLIC_AUDIENCE = 'https://www.w3.org/ns/activitystreams#Public'

// ── Core object interfaces ───────────────────────────────────────────

export interface APPublicKey {
  id: string
  owner: string
  publicKeyPem: string
}

export interface APImage {
  type: 'Image'
  mediaType: string
  url: string
}

export interface APHashtag {
  type: 'Hashtag'
  href: string
  name: string
}

export interface APActor {
  '@context'?: unknown
  id: string
  type: string
  preferredUsername: string
  name?: string
  summary?: string
  url?: string
  inbox: string
  outbox: string
  followers: string
  following: string
  icon?: APImage
  publicKey: APPublicKey
  endpoints?: { sharedInbox?: string }
}

export interface APArticle {
  '@context'?: unknown
  id: string
  type: 'Article'
  attributedTo: string
  content: string
  name: string
  summary?: string
  url: string
  published: string
  to: string[]
  cc: string[]
  tag?: APHashtag[]
}

export interface APCreateActivity {
  '@context': unknown
  id: string
  type: 'Create'
  actor: string
  published: string
  to: string[]
  cc: string[]
  object: APArticle
}

export interface APFollowActivity {
  '@context'?: unknown
  id: string
  type: 'Follow'
  actor: string
  object: string
}

export interface APAcceptActivity {
  '@context': unknown
  id: string
  type: 'Accept'
  actor: string
  object: APFollowActivity | string
}

export interface APUndoActivity {
  '@context'?: unknown
  id: string
  type: 'Undo'
  actor: string
  object: APFollowActivity | string
}

export interface APUpdateActivity {
  '@context': unknown
  id: string
  type: 'Update'
  actor: string
  published: string
  to: string[]
  cc: string[]
  object: APArticle
}

export interface APDeleteActivity {
  '@context'?: unknown
  id: string
  type: 'Delete'
  actor: string
  object: string | { id: string; type: string }
}

/** Union of all recognised incoming activity types */
export type APIncomingActivity =
  | APFollowActivity
  | APUndoActivity
  | APDeleteActivity
  | Record<string, unknown>

// ── DB model type ────────────────────────────────────────────────────

export interface ActivityPubFollower {
  id: string
  actorUrl: string
  inbox: string
  sharedInbox: string | null
  accepted: boolean
  createdAt: Date
}

// ── Zod schemas ──────────────────────────────────────────────────────

export const APIncomingActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.union([z.string().url(), z.object({ id: z.string().url() }).passthrough()]),
  object: z.union([z.string(), z.object({}).passthrough()]).optional(),
})

export type APIncomingActivityInput = z.infer<typeof APIncomingActivitySchema>
