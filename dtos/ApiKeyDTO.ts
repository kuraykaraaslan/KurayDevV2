import { z } from 'zod'

// ── Request DTOs ─────────────────────────────────────────────────────────────

export const CreateApiKeySchema = z.object({
  /** Human-readable label chosen by the user. */
  name: z.string().min(1, 'API key name is required').max(100, 'Name too long'),
  /** Optional ISO-8601 expiry date; omit for a non-expiring key. */
  expiresAt: z.string().datetime({ offset: true }).optional(),
  /** Maximum requests per calendar day; omit for unlimited. */
  dailyLimit: z.number().int().positive().optional(),
  /** Maximum requests per calendar month; omit for unlimited. */
  monthlyLimit: z.number().int().positive().optional(),
})

export const DeleteApiKeySchema = z.object({
  apiKeyId: z.string().cuid(),
})

// ── Response DTOs ────────────────────────────────────────────────────────────

export const ApiKeyResponseSchema = z.object({
  apiKeyId: z.string(),
  name: z.string(),
  /** First 12 characters of the raw key — safe to display without exposing the full key. */
  prefix: z.string(),
  dailyLimit: z.number().int().positive().optional(),
  monthlyLimit: z.number().int().positive().optional(),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
})

export const CreateApiKeyResponseSchema = ApiKeyResponseSchema.extend({
  /** Returned **once only** at creation time. Never stored in plain-text. */
  rawKey: z.string(),
})

// ── Inferred Types ───────────────────────────────────────────────────────────

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>
export type DeleteApiKeyInput = z.infer<typeof DeleteApiKeySchema>
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>

// ── Quota ────────────────────────────────────────────────────────────────────

export const ApiKeyQuotaStatusSchema = z.object({
  dailyCount: z.number().int(),
  monthlyCount: z.number().int(),
  dailyLimit: z.number().int().positive().nullable(),
  monthlyLimit: z.number().int().positive().nullable(),
  dailyExceeded: z.boolean(),
  monthlyExceeded: z.boolean(),
})

export type ApiKeyQuotaStatus = z.infer<typeof ApiKeyQuotaStatusSchema>
