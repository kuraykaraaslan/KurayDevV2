'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'
import { useChatbotSSE } from './useChatbotSSE'
import type { ChatMessage, ChatSource } from '@/types/features/ChatbotTypes'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'

export function useChatbot() {
  const { t } = useTranslation()
  const { user } = useGlobalStore()
  const { isOpen, closeChatbot, setHasUnread } = useChatbotStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState<{ role: 'ADMIN' | 'ASSISTANT' } | null>(null)
  const [sources, setSources] = useState<ChatSource[]>([])
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Browser identity for session persistence
  const browserIdRef = useRef<string>('')
  const [browserIdReady, setBrowserIdReady] = useState(false)
  useEffect(() => {
    const STORAGE_KEY = 'chatbot_browser_id'
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    browserIdRef.current = id
    setBrowserIdReady(true)
  }, [])

  // Accumulated text for current streaming response
  const accumulatedRef = useRef('')
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const chatSessionIdRef = useRef(chatSessionId)
  chatSessionIdRef.current = chatSessionId

  // ── SSE event handler ────────────────────────────────────────────
  const handleSSEEvent = useCallback((event: Record<string, unknown>) => {
    switch (event.type) {
      case 'history':
        if (event.chatSessionId) setChatSessionId(event.chatSessionId as string)
        if (Array.isArray(event.messages)) {
          setMessages(event.messages as ChatMessage[])
        }
        if (event.status === 'CLOSED') {
          setSessionClosed(true)
        }
        break

      case 'meta':
        if (event.chatSessionId) {
          setChatSessionId(event.chatSessionId as string)
        }
        break

      case 'chunk':
        setIsTyping(null)
        if (event.content && event.content !== ADMIN_TAKEOVER_SENTINEL) {
          accumulatedRef.current += event.content as string
          const text = accumulatedRef.current
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'ASSISTANT', content: text }
            return updated
          })
        }
        break

      case 'typing':
        if (event.role) {
          setIsTyping({ role: event.role as 'ADMIN' | 'ASSISTANT' })
        }
        break

      case 'sources':
        if (event.sources) {
          setSources(event.sources as ChatSource[])
        }
        break

      case 'done':
        accumulatedRef.current = ''
        setIsLoading(false)
        setIsTyping(null)
        break

      case 'error': {
        let content = t('shared.chatbot.error_message')
        if (event.error === 'USER_BANNED') content = t('shared.chatbot.user_banned')
        else if (event.error === 'RATE_LIMIT_EXCEEDED') content = t('shared.chatbot.rate_limit_exceeded')

        setMessages((prev) => {
          const updated = [...prev]
          if (updated.length > 0 && updated[updated.length - 1].role === 'ASSISTANT') {
            updated[updated.length - 1] = { role: 'ASSISTANT', content }
          } else {
            updated.push({ role: 'ASSISTANT', content })
          }
          return updated
        })
        accumulatedRef.current = ''
        setIsLoading(false)
        setIsTyping(null)
        break
      }
    }
  }, [t])

  const { sendChat, restore, isStreaming } = useChatbotSSE({
    onEvent: handleSSEEvent,
  })

  // ── Restore session on mount ─────────────────────────────────────
  useEffect(() => {
    if (!browserIdReady) return
    const doRestore = async () => {
      await restore(browserIdRef.current)
      setIsReady(true)
    }
    doRestore()
  }, [browserIdReady, user, restore])

  // ── Send message ─────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || isStreaming) return

    // Read page context set by proactive trigger
    let pageContext: string | undefined
    try {
      const ctx = localStorage.getItem('chatbot_page_context')
      if (ctx) {
        pageContext = ctx
        localStorage.removeItem('chatbot_page_context')
      }
    } catch { /* ignore */ }

    const userMessage: ChatMessage = { role: 'USER', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSources([])
    accumulatedRef.current = ''

    // Placeholder for streaming response
    setMessages((prev) => [...prev, { role: 'ASSISTANT', content: '' }])

    sendChat(trimmed, chatSessionIdRef.current, undefined, undefined, pageContext, browserIdRef.current)
  }, [input, isLoading, isStreaming, sendChat])

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
    isTyping,
    sources,
    sessionClosed,
    isConnected: isReady,
    status: isReady ? 'connected' as const : 'connecting' as const,
    // Actions
    setInput,
    handleSend,
    handleClear,
    closeChatbot,
  }
}
