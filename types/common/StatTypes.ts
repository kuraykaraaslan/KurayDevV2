import { z } from 'zod'

export const StatFrequencySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'fiveMin',
  'hourly',
  'all-time',
])

export type StatFrequency = z.infer<typeof StatFrequencySchema>

export const StatSchema = z.object({
  totalPosts: z.number().int().nonnegative(),
  totalCategories: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  totalComments: z.number().int().nonnegative(),
  totalChatSessions: z.number().int().nonnegative(),
  totalChatMessages: z.number().int().nonnegative(),
})

export type Stat = z.infer<typeof StatSchema>

// ── Chatbot-specific stats (returned alongside Stat) ──────────────
export interface ChatbotStat {
  totalSessions: number
  activeSessions: number
  closedSessions: number
  takenOverSessions: number
  totalMessages: number
  avgMessagesPerSession: number
  uniqueUsers: number
  recentSessions: {
    chatSessionId: string
    userId: string
    userEmail?: string
    status: 'ACTIVE' | 'CLOSED' | 'TAKEN_OVER'
    title?: string
    updatedAt: string
  }[]
}
