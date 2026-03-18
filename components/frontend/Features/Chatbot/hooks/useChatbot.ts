'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand'
import { useChatbotSSE } from './useChatbotSSE'
import type { ChatMessage, ChatSource } from '@/types/features/ChatbotTypes'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'

import type { SSEEvent } from './useChatbotSSE'

export function useChatbot() {
  const { t } = useTranslation()
  const { user } = useUserStore()
  const { isOpen, closeChatbot } = useChatbotStore()

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
  const handleSSEEvent = useCallback((event: SSEEvent) => {
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
        if (event.content === ADMIN_TAKEOVER_SENTINEL) {
          // Session is taken over — remove the empty placeholder added by handleSend
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'ASSISTANT' && last?.content === '') return prev.slice(0, -1)
            return prev
          })
        } else if (event.content) {
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

      case 'new_message': {
        const msg = event.message as ChatMessage | undefined
        if (msg && msg.content !== ADMIN_TAKEOVER_SENTINEL) {
          setMessages((prev) => {
            // Don't duplicate: skip if same role+content already at end
            const last = prev[prev.length - 1]
            if (last?.role === msg.role && last?.content === msg.content) return prev
            // If there's an empty ASSISTANT placeholder, replace it; otherwise append
            if (msg.role === 'ASSISTANT' && last?.role === 'ASSISTANT' && last?.content === '') {
              return [...prev.slice(0, -1), msg]
            }
            return [...prev, msg]
          })
        }
        break
      }

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

  // ── Poll for new messages (catches admin replies) ─────────────────
  const isStreamingRef = useRef(isStreaming)
  useEffect(() => { isStreamingRef.current = isStreaming }, [isStreaming])

  useEffect(() => {
    if (!chatSessionId || !isOpen) return

    const poll = async () => {
      if (isStreamingRef.current) return
      try {
        const params = new URLSearchParams({ chatSessionId })
        if (browserIdRef.current) params.set('browserId', browserIdRef.current)
        const res = await fetch(`/api/chatbot?${params}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json() as { messages?: ChatMessage[]; session?: { status: string } }
        if (!Array.isArray(data.messages) || data.messages.length === 0) return

        const incoming = data.messages.filter((m) => m.content !== ADMIN_TAKEOVER_SENTINEL)
        setMessages(incoming)

        if (data.session?.status === 'CLOSED') setSessionClosed(true)
      } catch { /* ignore */ }
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [chatSessionId, isOpen])

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
