'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import axiosInstance from '@/libs/axios'
import type { ChatMessage, ChatSource } from '@/types/features/ChatbotTypes'
import type { StoredChatSession } from '@/dtos/ChatbotDTO'

interface SSEEvent {
  type: string
  chatSessionId?: string
  content?: string
  sources?: ChatSource[]
  error?: string
  role?: 'admin' | 'assistant'
  messages?: ChatMessage[]
  message?: ChatMessage
  status?: string
  takenOverBy?: string
}

interface UseChatbotSSEOptions {
  onEvent: (event: SSEEvent) => void
}

/**
 * SSE + REST based chatbot hook.
 * Replaces WebSocket-based communication since Next.js dev server
 * does not support UPGRADE handlers for route files.
 *
 * - Chat messages are sent via POST /api/chatbot/stream (SSE response)
 * - Session history is loaded via GET /api/chatbot?chatSessionId=...
 * - Session restore is done via GET /api/chatbot (browser session lookup)
 */
export function useChatbotSSE({ onEvent }: UseChatbotSSEOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const sendChat = useCallback(
    async (
      message: string,
      chatSessionId?: string,
      provider?: string,
      model?: string,
      pageContext?: string,
      browserId?: string,
    ) => {
      if (isStreaming) return

      abortRef.current = new AbortController()
      setIsStreaming(true)

      try {
        const response = await fetch('/api/chatbot/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message,
            chatSessionId,
            browserId,
            provider,
            model,
            page_context: pageContext,
          }),
          signal: abortRef.current.signal,
        })

        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({}))
          const errorMsg = (errorData as Record<string, string>).message

          if (response.status === 429) {
            onEventRef.current({ type: 'error', error: 'RATE_LIMIT_EXCEEDED' })
          } else if (response.status === 403) {
            onEventRef.current({ type: 'error', error: 'USER_BANNED' })
          } else {
            onEventRef.current({ type: 'error', error: errorMsg ?? 'Unknown error' })
          }
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr) as SSEEvent
              onEventRef.current(event)
            } catch { /* skip malformed */ }
          }
        }

        // Process remaining buffer
        if (buffer.startsWith('data: ')) {
          const jsonStr = buffer.slice(6).trim()
          if (jsonStr) {
            try {
              const event = JSON.parse(jsonStr) as SSEEvent
              onEventRef.current(event)
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onEventRef.current({ type: 'error', error: 'Network error' })
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [isStreaming],
  )

  const restore = useCallback(async (browserId: string): Promise<{
    session?: StoredChatSession
    messages?: ChatMessage[]
  }> => {
    try {
      const res = await axiosInstance.get('/api/chatbot', {
        params: { browserId },
      })
      const data = res.data as { session?: StoredChatSession; messages?: ChatMessage[]; sessions?: StoredChatSession[] }

      if (data.session && data.messages) {
        onEventRef.current({
          type: 'history',
          chatSessionId: data.session.chatSessionId,
          messages: data.messages,
          status: data.session.status,
        })
        return { session: data.session, messages: data.messages }
      }

      // If no specific session returned, check sessions list for most recent active
      if (data.sessions && data.sessions.length > 0) {
        const activeSession = data.sessions.find((s) => s.status !== 'CLOSED') ?? data.sessions[0]
        const sessionRes = await axiosInstance.get('/api/chatbot', {
          params: { chatSessionId: activeSession.chatSessionId, browserId },
        })
        const sessionData = sessionRes.data as { session: StoredChatSession; messages: ChatMessage[] }
        if (sessionData.session) {
          onEventRef.current({
            type: 'history',
            chatSessionId: sessionData.session.chatSessionId,
            messages: sessionData.messages ?? [],
            status: sessionData.session.status,
          })
          return { session: sessionData.session, messages: sessionData.messages }
        }
      }
    } catch { /* ignore restore failure */ }
    return {}
  }, [])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    sendChat,
    restore,
    cancelStream,
    isStreaming,
  }
}
