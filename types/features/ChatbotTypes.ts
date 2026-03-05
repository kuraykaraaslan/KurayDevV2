/**
 * Chatbot feature types — shared across service, components, and admin pages.
 */

// ── Client-side message (lightweight, no Zod dependency) ────────────
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'admin' | 'system'
  content: string
  sources?: ChatSource[]
  adminUserId?: string
  createdAt?: string
}

// ── Source reference returned alongside AI replies ───────────────────
export interface ChatSource {
  postId: string
  title: string
  slug: string
  categorySlug: string
  score: number
}

// ── Session metadata ────────────────────────────────────────────────
export type ChatSession = {
  chatSessionId: string
  userId: string
  userEmail?: string
  status: 'ACTIVE' | 'CLOSED' | 'TAKEN_OVER'
  title?: string
  takenOverBy?: string
  createdAt: string
  updatedAt: string
}

// ── RAG context used internally by ChatbotService ───────────────────
export interface RAGContext {
  postId: string
  title: string
  slug: string
  categorySlug: string
  score: number
  snippet: string
}

// ── Dataset types (loaded from optional JSON files) ─────────────────
export interface DatasetDocument {
  id: string
  title: string
  text: string
  tags: string[]
  type: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  tags: string[]
}

export interface PolicyItem {
  id: string
  title: string
  rule: string
  severity: string
}

export interface SystemPromptRule {
  id: number
  name: string
  rule: string
}

export interface SystemPromptData {
  intro: string
  rules: SystemPromptRule[]
}

// ── WebSocket event types (namespace = 'chatbot') ──────────────────

/** Client → Server events */
export type ChatbotWSClientEvent =
  | { ns: 'chatbot'; type: 'chat'; message: string; chatSessionId?: string; provider?: string; model?: string }
  | { ns: 'chatbot'; type: 'subscribe'; chatSessionId: string }
  | { ns: 'chatbot'; type: 'admin_reply'; chatSessionId: string; message: string }
  | { ns: 'chatbot'; type: 'restore'; browserId: string }

/** Server → Client events */
export type ChatbotWSServerEvent =
  | { ns: 'chatbot'; type: 'meta'; chatSessionId: string }
  | { ns: 'chatbot'; type: 'chunk'; content: string }
  | { ns: 'chatbot'; type: 'sources'; sources: ChatSource[] }
  | { ns: 'chatbot'; type: 'done' }
  | { ns: 'chatbot'; type: 'error'; error: string }
  | { ns: 'chatbot'; type: 'new_message'; chatSessionId: string; message: ChatMessage }
  | { ns: 'chatbot'; type: 'session_update'; chatSessionId: string; status: string; takenOverBy?: string }
  | { ns: 'chatbot'; type: 'browser_status'; chatSessionId: string; online: boolean }
  | { ns: 'chatbot'; type: 'connected'; userId: string }
  | { ns: 'chatbot'; type: 'history'; chatSessionId: string; messages: ChatMessage[]; status: string }

/** @deprecated Use ChatbotWSClientEvent */
export type WSClientEvent = ChatbotWSClientEvent
/** @deprecated Use ChatbotWSServerEvent */
export type WSServerEvent = ChatbotWSServerEvent

import { z } from 'zod'

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'admin', 'system']),
  content: z.string(),
  sources: z.array(z.lazy(() => ChatSourceSchema)).optional(),
  adminUserId: z.string().optional(),
  createdAt: z.string().optional(),
})

export const ChatSourceSchema = z.object({
  postId: z.string(),
  title: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  score: z.number(),
})

export const ChatSessionSchema = z.object({
  chatSessionId: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'TAKEN_OVER']),
  title: z.string().optional(),
  takenOverBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const RAGContextSchema = z.object({
  postId: z.string(),
  title: z.string(),
  slug: z.string(),
  categorySlug: z.string(),
  score: z.number(),
  snippet: z.string(),
})

export const DatasetDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  tags: z.array(z.string()),
  type: z.string(),
})

export const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  tags: z.array(z.string()),
})

export const PolicyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  rule: z.string(),
  severity: z.string(),
})

export const SystemPromptRuleSchema = z.object({
  id: z.number(),
  name: z.string(),
  rule: z.string(),
})

export const SystemPromptDataSchema = z.object({
  intro: z.string(),
  rules: z.array(SystemPromptRuleSchema),
})
