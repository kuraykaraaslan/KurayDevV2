/**
 * Chatbot feature types — shared across service, components, and admin pages.
 */

// ── Client-side message (lightweight, no Zod dependency) ────────────
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'admin'
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
