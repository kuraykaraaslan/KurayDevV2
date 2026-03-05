'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faTimes,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'
import axiosInstance from '@/libs/axios'
import { ChatMessageList, ChatInput } from '@/components/common/UI/Chat'
import type { ChatMessage, ChatSource } from '@/types/features/ChatbotTypes'

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
  const abortRef = useRef<AbortController | null>(null)

  // Poll for new messages
  useEffect(() => {
    if (!chatSessionId) return
    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/api/chatbot?chatSessionId=${chatSessionId}`)
        const serverMessages: ChatMessage[] = (res.data.messages ?? []).filter(
          (m: ChatMessage) => m.content !== '__ADMIN_TAKEOVER__'
        )
        // Detect closed session
        if (res.data.session?.status === 'CLOSED' && !sessionClosed) {
          setSessionClosed(true)
          const closedMsg: ChatMessage = {
            role: 'assistant',
            content: t('shared.chatbot.session_closed'),
          }
          setMessages([...serverMessages, closedMsg])
          if (!isOpen) setHasUnread(true)
          return
        }
        // Notify unread if new messages arrived while chat is closed
        if (serverMessages.length > messages.length && !isOpen) {
          setHasUnread(true)
        }
        setMessages(serverMessages)
      } catch {
        // silently ignore polling errors
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [chatSessionId, isOpen, messages.length, setHasUnread])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSources([])

    // Create a placeholder assistant message for streaming
    const streamingMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, streamingMsg])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chatbot/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, chatSessionId }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const apiMessage = (errBody as { message?: string }).message

        let content = t('shared.chatbot.error_message')
        if (apiMessage === 'USER_BANNED' || res.status === 403) {
          content = t('shared.chatbot.user_banned')
        } else if (apiMessage === 'RATE_LIMIT_EXCEEDED' || res.status === 429) {
          content = t('shared.chatbot.rate_limit_exceeded')
        }

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content }
          return updated
        })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No readable stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw) as {
              type: string
              content?: string
              chatSessionId?: string
              sources?: ChatSource[]
              error?: string
            }

            switch (event.type) {
              case 'meta':
                if (event.chatSessionId && !chatSessionId) {
                  setChatSessionId(event.chatSessionId)
                }
                break

              case 'chunk':
                if (event.content && event.content !== '__ADMIN_TAKEOVER__') {
                  accumulated += event.content
                  setMessages((prev) => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: accumulated }
                    return updated
                  })
                }
                break

              case 'sources':
                if (event.sources) {
                  setSources(event.sources)
                }
                break

              case 'error': {
                let content = t('shared.chatbot.error_message')
                if (event.error === 'USER_BANNED') {
                  content = t('shared.chatbot.user_banned')
                } else if (event.error === 'RATE_LIMIT_EXCEEDED') {
                  content = t('shared.chatbot.rate_limit_exceeded')
                }
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content }
                  return updated
                })
                break
              }

              case 'done':
                break
            }
          } catch { /* skip malformed SSE data */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return

      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: t('shared.chatbot.error_message'),
        }
        return updated
      })
    } finally {
      abortRef.current = null
      setIsLoading(false)
    }
  }, [input, isLoading, chatSessionId, t])

  const handleClear = () => {
    abortRef.current?.abort()
    setMessages([])
    setSources([])
    setChatSessionId(undefined)
    setSessionClosed(false)
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
              disabled={isLoading || sessionClosed}
              placeholder={sessionClosed ? t('shared.chatbot.session_closed') : t('shared.chatbot.placeholder')}
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
