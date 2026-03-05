'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faPaperPlane,
  faTimes,
  faTrash,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import useGlobalStore from '@/libs/zustand'
import { useChatbotStore } from '@/libs/zustand/chatbotStore'
import axiosInstance from '@/libs/axios'
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Poll for new messages
  useEffect(() => {
    if (!chatSessionId) return
    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/api/chatbot?chatSessionId=${chatSessionId}`)
        const serverMessages: ChatMessage[] = (res.data.messages ?? []).filter(
          (m: ChatMessage) => m.content !== '__ADMIN_TAKEOVER__'
        )
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

    try {
      const response = await axiosInstance.post('/api/chatbot', {
        message: trimmed,
        chatSessionId,
      })

      const { reply, sources: newSources, chatSessionId: newSessionId } = response.data

      // Persist session ID from first message
      if (newSessionId && !chatSessionId) {
        setChatSessionId(newSessionId)
      }

      // If reply is the admin takeover marker, don't show it
      if (reply === '__ADMIN_TAKEOVER__') {
        // Admin took over — don't show marker
      } else {
        const assistantMessage: ChatMessage = { role: 'assistant', content: reply }
        setMessages((prev) => [...prev, assistantMessage])
      }

      setSources(newSources ?? [])
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: t('shared.chatbot.error_message'),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, chatSessionId, t])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
    setSources([])
    setChatSessionId(undefined)
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-base-content/50 mt-8 px-4">
                <FontAwesomeIcon icon={faRobot} className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('shared.chatbot.welcome_message')}</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              if (msg.content === '__ADMIN_TAKEOVER__') return null
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id ?? idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-primary text-primary-content rounded-br-md'
                        : 'bg-base-200 text-base-content rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-base-200 text-base-content px-3 py-2 rounded-2xl rounded-bl-md text-sm">
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  <span className="ml-2">{t('shared.chatbot.thinking')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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

          {/* Input Area */}
          <div className="px-3 py-2 border-t border-base-300 bg-base-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('shared.chatbot.placeholder')}
                className="textarea textarea-bordered textarea-sm flex-1 resize-none min-h-[40px] max-h-[100px] leading-snug"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="btn btn-primary btn-sm btn-circle"
                aria-label={t('shared.chatbot.send')}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot
