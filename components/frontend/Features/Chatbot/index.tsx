'use client'

import { useState, useCallback, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faTimes,
  faTrash,
  faWifi,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'
import { ChatMessageList, ChatInput } from '@/components/common/UI/Chat'
import { useChatbotWebSocket } from './useChatbotWebSocket'
import type { ChatMessage, ChatSource, ChatbotWSServerEvent } from '@/types/features/ChatbotTypes'
import type { WSSystemServerEvent } from '@/types/common/WebSocketTypes'

type ServerEvent = ChatbotWSServerEvent | WSSystemServerEvent

const Chatbot = () => {
  const { t } = useTranslation()
  const { user } = useGlobalStore()
  const { isOpen, closeChatbot, setHasUnread } = useChatbotStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<ChatSource[]>([])
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(undefined)
  const [sessionClosed, setSessionClosed] = useState(false)

  // Accumulated text for current streaming response
  const accumulatedRef = useRef('')
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen

  // ── WebSocket event handler ──────────────────────────────────────
  const handleWSEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'connected':
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
          // Only add if not already in the list (avoid duplicates from own stream)
          setMessages((prev) => {
            if (msg.id && prev.some((m) => m.id === msg.id)) return prev
            // If it's an admin message, append it
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

  const { isConnected, connect, disconnect, sendChat, status } = useChatbotWebSocket({
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

  const handleClear = () => {
    setMessages([])
    setSources([])
    setChatSessionId(undefined)
    setSessionClosed(false)
    accumulatedRef.current = ''
  }

  // Only show for logged-in users
  if (!user) return null

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-[104] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            right: '20px',
            bottom: '20px',
            width: 'min(380px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 100px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-content rounded-t-2xl">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faRobot} className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {t('shared.chatbot.title')}
              </span>
              <FontAwesomeIcon
                icon={faWifi}
                className={`w-3 h-3 transition-colors ${isConnected ? 'text-success' : 'text-error/60'}`}
                title={status}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="btn btn-ghost btn-xs btn-circle text-primary-content"
                aria-label={t('shared.chatbot.clear')}
                title={t('shared.chatbot.clear')}
              >
                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
              </button>
              <button
                onClick={closeChatbot}
                className="btn btn-ghost btn-xs btn-circle text-primary-content"
                aria-label={t('shared.chatbot.close')}
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ChatMessageList
            messages={messages}
            isLoading={isLoading}
            loadingText={t('shared.chatbot.thinking')}
            emptyContent={
              <div className="text-center text-base-content/50 mt-8 px-4">
                <FontAwesomeIcon icon={faRobot} className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('shared.chatbot.welcome_message')}</p>
              </div>
            }
          />

          {/* Sources */}
          {sources.length > 0 && (
            <div className="px-4 py-2 border-t border-base-300 bg-base-200/50">
              <p className="text-xs font-semibold text-base-content/70 mb-1">
                {t('shared.chatbot.sources')}
              </p>
              <div className="flex flex-wrap gap-1">
                {sources.map((source) => (
                  <a
                    key={source.postId}
                    href={`/en/blog/${source.categorySlug}/${source.slug}`}
                    className="text-xs text-primary hover:underline bg-base-100 px-2 py-0.5 rounded-full border border-base-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2 border-t border-base-300 bg-base-100">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading || sessionClosed || !isConnected}
              placeholder={
                sessionClosed
                  ? t('shared.chatbot.session_closed')
                  : !isConnected
                    ? t('shared.chatbot.connecting') ?? 'Connecting...'
                    : t('shared.chatbot.placeholder')
              }
              autoFocusTrigger={isOpen}
              variant="compact"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot
