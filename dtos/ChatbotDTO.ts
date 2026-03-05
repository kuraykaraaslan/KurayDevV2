import { z } from 'zod'
import ChatbotMessages from '@/messages/ChatbotMessages'

// ── Chat Message Roles ───────────────────────────────────────────────

export const ChatMessageRoleEnum = z.enum(['user', 'assistant', 'admin'])
export type ChatMessageRole = z.infer<typeof ChatMessageRoleEnum>

export const ChatSessionStatusEnum = z.enum(['ACTIVE', 'CLOSED', 'TAKEN_OVER'])
export type ChatSessionStatus = z.infer<typeof ChatSessionStatusEnum>

// ── Stored Message (Redis) ───────────────────────────────────────────

export const StoredChatMessageSchema = z.object({
  id: z.string(),
  role: ChatMessageRoleEnum,
  content: z.string(),
  sources: z.array(z.object({
    postId: z.string(),
    title: z.string(),
    slug: z.string(),
    categorySlug: z.string(),
    score: z.number(),
  })).optional(),
  adminUserId: z.string().optional(),
  createdAt: z.string(),
})
export type StoredChatMessage = z.infer<typeof StoredChatMessageSchema>

// ── Stored Session (Redis) ───────────────────────────────────────────

export const StoredChatSessionSchema = z.object({
  chatSessionId: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  status: ChatSessionStatusEnum,
  title: z.string().optional(),
  takenOverBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type StoredChatSession = z.infer<typeof StoredChatSessionSchema>

// ── Frontend Request / Response ──────────────────────────────────────

export const ChatbotRequestSchema = z.object({
  message: z.string().min(1, ChatbotMessages.MESSAGE_REQUIRED).max(2000, ChatbotMessages.MESSAGE_TOO_LONG),
  chatSessionId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
})
export type ChatbotRequest = z.infer<typeof ChatbotRequestSchema>

export const ChatbotSourceSchema = z.object({
  postId: z.string(),
  title: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  score: z.number(),
})
export type ChatbotSource = z.infer<typeof ChatbotSourceSchema>

// ── Admin Schemas ────────────────────────────────────────────────────

export const AdminChatReplySchema = z.object({
  chatSessionId: z.string().min(1),
  message: z.string().min(1, ChatbotMessages.MESSAGE_REQUIRED).max(5000, ChatbotMessages.MESSAGE_TOO_LONG),
})
export type AdminChatReply = z.infer<typeof AdminChatReplySchema>

export const AdminTakeoverSchema = z.object({
  chatSessionId: z.string().min(1),
})
export type AdminTakeover = z.infer<typeof AdminTakeoverSchema>

export const AdminCloseSessionSchema = z.object({
  chatSessionId: z.string().min(1),
})
export type AdminCloseSession = z.infer<typeof AdminCloseSessionSchema>
