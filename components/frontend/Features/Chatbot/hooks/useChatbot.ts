'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'
import { useChatbotWebSocket } from './useChatbotWebSocket'
import type { ChatMessage, ChatSource, ChatbotWSServerEvent } from '@/types/features/ChatbotTypes'
import type { WSSystemServerEvent } from '@/types/common/WebSocketTypes'

type ServerEvent = ChatbotWSServerEvent | WSSystemServerEvent

export function useChatbot() {
  const { t } = useTranslation()
  const { user } = useGlobalStore()
  const { isOpen, closeChatbot, setHasUnread } = useChatbotStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<ChatSource[]>([])
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined)
  const [sessionClosed, setSessionClosed] = useState(false)

  // Browser identity for session persistence
  const browserIdRef = useRef<string>('')
  useEffect(() => {
    const STORAGE_KEY = 'chatbot_browser_id'
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    browserIdRef.current = id
  }, [])

  // Accumulated text for current streaming response
  const accumulatedRef = useRef('')
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen

  // ── WebSocket event handler ──────────────────────────────────────
  const handleWSEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'connected':
        if (browserIdRef.current) restore(browserIdRef.current)
        break

      case 'history':
        if ('chatSessionId' in event) setChatSessionId(event.chatSessionId as string)
        if ('messages' in event && Array.isArray(event.messages)) {
          setMessages(event.messages as ChatMessage[])
        }
        if ('status' in event && event.status === 'CLOSED') {
          setSessionClosed(true)
        }
        break

      case 'meta':
        if ('chatSessionId' in event) {
          setChatSessionId(event.chatSessionId)
        }
        break

      case 'chunk':
        if ('content' in event && event.content && event.content !== '__ADMIN_TAKEOVER__') {
          accumulatedRef.current += event.content
          const text = accumulatedRef.current
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: text }
            return updated
          })
        }
        break

      case 'sources':
        if ('sources' in event && event.sources) {
          setSources(event.sources)
        }
        break

      case 'done':
        accumulatedRef.current = ''
        setIsLoading(false)
        break

      case 'error': {
        let content = t('shared.chatbot.error_message')
        if ('error' in event) {
          if (event.error === 'USER_BANNED') content = t('shared.chatbot.user_banned')
          else if (event.error === 'RATE_LIMIT_EXCEEDED') content = t('shared.chatbot.rate_limit_exceeded')
        }
        setMessages((prev) => {
          const updated = [...prev]
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1] = { role: 'assistant', content }
          } else {
            updated.push({ role: 'assistant', content })
          }
          return updated
        })
        accumulatedRef.current = ''
        setIsLoading(false)
        break
      }

      case 'new_message':
        if ('message' in event && event.message) {
          const msg = event.message as ChatMessage
          if (msg.content === '__ADMIN_TAKEOVER__') break
          setMessages((prev) => {
            if (msg.id && prev.some((m) => m.id === msg.id)) return prev
            if (msg.role === 'admin') {
              if (!isOpenRef.current) setHasUnread(true)
              return [...prev, msg]
            }
            return prev
          })
        }
        break

      case 'session_update':
        if ('status' in event && event.status === 'CLOSED') {
          setSessionClosed(true)
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: t('shared.chatbot.session_closed') },
          ])
          if (!isOpenRef.current) setHasUnread(true)
        }
        break

      case 'pong':
        break
    }
  }, [t, setHasUnread])

  const { isConnected, connect, disconnect, sendChat, restore, status } = useChatbotWebSocket({
    onEvent: handleWSEvent,
    autoConnect: !!user,
    reconnectDelay: 3000,
    maxReconnects: 10,
  })

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || !isConnected) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSources([])
    accumulatedRef.current = ''

    // Placeholder for streaming response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    sendChat(trimmed, chatSessionId)
  }, [input, isLoading, isConnected, chatSessionId, sendChat])

  const handleClear = useCallback(() => {
    setMessages([])
    setSources([])
    setChatSessionId(undefined)
    setSessionClosed(false)
    accumulatedRef.current = ''
  }, [])

  return {
    // State
    user,
    isOpen,
    messages,
    input,
    isLoading,
    sources,
    sessionClosed,
    isConnected,
    status,
    // Actions
    setInput,
    handleSend,
    handleClear,
    closeChatbot,
  }
}
