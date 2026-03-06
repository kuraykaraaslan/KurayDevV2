/**
 * Chatbot feature types — shared across service, components, and admin pages.
 * All TypeScript types are derived from Zod schemas via `z.infer<>`.
 */

import { z } from 'zod'

// ── Source reference returned alongside AI replies ───────────────────
export const ChatSourceSchema = z.object({
  postId:       z.string(),
  title:        z.string(),
  slug:         z.string(),
  categorySlug: z.string(),
  score:        z.number(),
})
export type ChatSource = z.infer<typeof ChatSourceSchema>

// ── Client-side message ──────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  id:          z.string().optional(),
  role:        z.enum(['user', 'assistant', 'admin', 'system']),
  content:     z.string(),
  sources:     z.array(ChatSourceSchema).optional(),
  adminUserId: z.string().optional(),
  createdAt:   z.string().optional(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

// ── Session metadata ────────────────────────────────────────────────
export const ChatSessionSchema = z.object({
  chatSessionId: z.string(),
  userId:        z.string(),
  userEmail:     z.string().optional(),
  status:        z.enum(['ACTIVE', 'CLOSED', 'TAKEN_OVER']),
  title:         z.string().optional(),
  takenOverBy:   z.string().optional(),
  createdAt:     z.string(),
  updatedAt:     z.string(),
})
export type ChatSession = z.infer<typeof ChatSessionSchema>

// ── RAG context used internally by ChatbotService ───────────────────
export const RAGContextSchema = z.object({
  postId:       z.string(),
  title:        z.string(),
  slug:         z.string(),
  categorySlug: z.string(),
  score:        z.number(),
  snippet:      z.string(),
})
export type RAGContext = z.infer<typeof RAGContextSchema>

// ── Dataset types (loaded from optional JSON files) ─────────────────
export const DatasetDocumentSchema = z.object({
  id:    z.string(),
  title: z.string(),
  text:  z.string(),
  tags:  z.array(z.string()),
  type:  z.string(),
})
export type DatasetDocument = z.infer<typeof DatasetDocumentSchema>

export const FaqItemSchema = z.object({
  id:       z.string(),
  question: z.string(),
  answer:   z.string(),
  tags:     z.array(z.string()),
})
export type FaqItem = z.infer<typeof FaqItemSchema>

export const PolicyItemSchema = z.object({
  id:       z.string(),
  title:    z.string(),
  rule:     z.string(),
  severity: z.string(),
})
export type PolicyItem = z.infer<typeof PolicyItemSchema>

export const SystemPromptRuleSchema = z.object({
  id:   z.number(),
  name: z.string(),
  rule: z.string(),
})
export type SystemPromptRule = z.infer<typeof SystemPromptRuleSchema>

export const SystemPromptDataSchema = z.object({
  intro: z.string(),
  rules: z.array(SystemPromptRuleSchema),
})
export type SystemPromptData = z.infer<typeof SystemPromptDataSchema>

// ── Admin stats ────────────────────────────────────────────────────
export const ChatbotStatsSchema = z.object({
  totalSessions:        z.number().int().nonnegative(),
  activeSessions:       z.number().int().nonnegative(),
  closedSessions:       z.number().int().nonnegative(),
  takenOverSessions:    z.number().int().nonnegative(),
  totalMessages:        z.number().int().nonnegative(),
  avgMessagesPerSession: z.number().nonnegative(),
  uniqueUsers:          z.number().int().nonnegative(),
  recentSessions:       z.array(ChatSessionSchema),
})
export type ChatbotStats = z.infer<typeof ChatbotStatsSchema>

// ── WebSocket event types (namespace = 'chatbot') ──────────────────

const WS_NS = z.literal('chatbot')

/** Client → Server events */
export const ChatbotWSClientEventSchema = z.discriminatedUnion('type', [
  z.object({
    ns: WS_NS, type: z.literal('chat'),
    message:       z.string(),
    chatSessionId: z.string().optional(),
    provider:      z.string().optional(),
    model:         z.string().optional(),
    page_context:  z.string().optional(),
  }),
  z.object({ ns: WS_NS, type: z.literal('subscribe'),   chatSessionId: z.string() }),
  z.object({ ns: WS_NS, type: z.literal('admin_reply'), chatSessionId: z.string(), message: z.string() }),
  z.object({ ns: WS_NS, type: z.literal('restore'),     browserId: z.string() }),
  z.object({ ns: WS_NS, type: z.literal('typing'),      chatSessionId: z.string() }),
])
export type ChatbotWSClientEvent = z.infer<typeof ChatbotWSClientEventSchema>

/** Server → Client events */
export const ChatbotWSServerEventSchema = z.discriminatedUnion('type', [
  z.object({ ns: WS_NS, type: z.literal('meta'),    chatSessionId: z.string() }),
  z.object({ ns: WS_NS, type: z.literal('chunk'),   content: z.string() }),
  z.object({ ns: WS_NS, type: z.literal('sources'), sources: z.array(ChatSourceSchema) }),
  z.object({ ns: WS_NS, type: z.literal('done') }),
  z.object({ ns: WS_NS, type: z.literal('error'),   error: z.string() }),
  z.object({
    ns: WS_NS, type: z.literal('new_message'),
    chatSessionId: z.string(),
    message:       ChatMessageSchema,
  }),
  z.object({
    ns: WS_NS, type: z.literal('session_update'),
    chatSessionId: z.string(),
    status:        z.string(),
    takenOverBy:   z.string().optional(),
  }),
  z.object({
    ns: WS_NS, type: z.literal('browser_status'),
    chatSessionId: z.string(),
    online:        z.boolean(),
  }),
  z.object({ ns: WS_NS, type: z.literal('connected'), userId: z.string() }),
  z.object({
    ns: WS_NS, type: z.literal('history'),
    chatSessionId: z.string(),
    messages:      z.array(ChatMessageSchema),
    status:        z.string(),
  }),
  /** Typing indicator: admin is composing a reply, or AI stream is starting. */
  z.object({
    ns: WS_NS, type: z.literal('typing'),
    role:          z.enum(['admin', 'assistant']),
    chatSessionId: z.string().optional(),
  }),
])
export type ChatbotWSServerEvent = z.infer<typeof ChatbotWSServerEventSchema>

/** @deprecated Use ChatbotWSClientEvent */
export type WSClientEvent = ChatbotWSClientEvent
/** @deprecated Use ChatbotWSServerEvent */
export type WSServerEvent = ChatbotWSServerEvent
