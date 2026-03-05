'use client'

import { useCallback } from 'react'
import { useWebSocket } from '@/libs/hooks/useWebSocket'
import type { ChatbotWSClientEvent, ChatbotWSServerEvent } from '@/types/features/ChatbotTypes'
import type { WSSystemServerEvent } from '@/types/common/WebSocketTypes'

type ChatbotServerEvent = ChatbotWSServerEvent | WSSystemServerEvent

interface UseChatbotWSOptions {
  /** Called for every server event (chatbot + system) */
  onEvent: (event: ChatbotServerEvent) => void
  /** Auto-connect on mount (default: false) */
  autoConnect?: boolean
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number
  /** Max reconnect attempts (default: 5) */
  maxReconnects?: number
}

/**
 * Chatbot-specific WebSocket hook.
 * Wraps the generic useWebSocket with chatbot event types and
 * convenience methods (sendChat, subscribe, sendAdminReply).
 */
export function useChatbotWebSocket({
  onEvent,
  autoConnect = false,
  reconnectDelay = 3000,
  maxReconnects = 5,
}: UseChatbotWSOptions) {
  const {
    status,
    connect,
    disconnect,
    sendEvent,
    isConnected,
  } = useWebSocket<ChatbotWSClientEvent, ChatbotServerEvent>({
    path: '/api/chatbot',
    onEvent,
    autoConnect,
    reconnectDelay,
    maxReconnects,
  })

  // ── Convenience methods ──────────────────────────────────────────

  const sendChat = useCallback(
    (message: string, chatSessionId?: string, provider?: string, model?: string) =>
      sendEvent({ ns: 'chatbot', type: 'chat', message, chatSessionId, provider, model }),
    [sendEvent],
  )

  const subscribe = useCallback(
    (chatSessionId: string) =>
      sendEvent({ ns: 'chatbot', type: 'subscribe', chatSessionId }),
    [sendEvent],
  )

  const sendAdminReply = useCallback(
    (chatSessionId: string, message: string) =>
      sendEvent({ ns: 'chatbot', type: 'admin_reply', chatSessionId, message }),
    [sendEvent],
  )

  const ping = useCallback(
    () => sendEvent({ ns: 'system', type: 'ping' } as unknown as ChatbotWSClientEvent),
    [sendEvent],
  )

  return {
    status,
    connect,
    disconnect,
    sendEvent,
    sendChat,
    subscribe,
    sendAdminReply,
    ping,
    isConnected,
  }
}
