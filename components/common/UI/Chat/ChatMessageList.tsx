'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot, faUser, faUserShield } from '@fortawesome/free-solid-svg-icons'
import type { ChatMessage } from '@/types/features/ChatbotTypes'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'

// ── Role config ─────────────────────────────────────────────────────
const defaultRoleConfig: Record<
  string,
  { label: string; icon: IconDefinition; bubbleClass: string; align: string }
> = {
  user: {
    label: 'User',
    icon: faUser,
    bubbleClass: 'bg-gradient-to-br from-primary/60 to-primary/80 text-primary-content rounded-br-md',
    align: 'justify-end',
  },
  assistant: {
    label: 'AI',
    icon: faRobot,
    bubbleClass: 'border border-base-content/20 rounded-bl-md',
    align: 'justify-start',
  },
  admin: {
    label: 'Admin',
    icon: faUserShield,
    bubbleClass: 'border border-warning/60 rounded-bl-md',
    align: 'justify-start',
  },
  system: {
    label: 'System',
    icon: faRobot,
    bubbleClass: '',
    align: 'justify-center',
  },
}

// ── Props ───────────────────────────────────────────────────────────
interface ChatMessageListProps {
  messages: ChatMessage[]
  /** Show loading indicator (typing dots / spinner) */
  isLoading?: boolean
  /** Empty state content */
  emptyContent?: ReactNode
  /** Show role label + timestamp header above each bubble */
  showMeta?: boolean
  /** Show inline sources inside each message bubble */
  showInlineSources?: boolean
  /** Container className override */
  className?: string
}

// ── Helpers ─────────────────────────────────────────────────────────
const formatTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ── Component ───────────────────────────────────────────────────────
const ChatMessageList = ({
  messages,
  isLoading = false,
  emptyContent,
  showMeta = false,
  showInlineSources = false,
  className = '',
}: ChatMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${className}`}>
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        emptyContent ?? (
          <div className="text-center text-base-content/50 mt-8 px-4">
            <FontAwesomeIcon icon={faRobot} className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        )
      )}

      {/* Messages */}
      {messages.map((msg, idx) => {
        if (msg.content === ADMIN_TAKEOVER_SENTINEL) return null

        // System messages render as centered divider text
        if (msg.role === 'SYSTEM') {
          return (
            <div key={msg.id ?? idx} className="flex justify-center my-2">
              <span className="text-xs text-base-content/50 italic">
                ── {msg.content} ──
              </span>
            </div>
          )
        }

        const cfg = defaultRoleConfig[msg.role.toLowerCase()] ?? defaultRoleConfig.assistant

        return (
          <div key={msg.id ?? idx} className={`flex ${cfg.align}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${cfg.bubbleClass}`}>
              {/* Meta header */}
              {showMeta && (
                <div className="flex items-center gap-1.5 mb-1">
                  <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3 opacity-60" />
                  <span className="text-[10px] font-semibold opacity-60">{cfg.label}</span>
                  {msg.createdAt && (
                    <span className="text-[10px] opacity-40">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              )}

              {msg.content}

              {/* Inline sources */}
              {showInlineSources && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-1 border-t border-base-content/10">
                  <span className="text-[10px] font-semibold opacity-50">Sources:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {msg.sources.map((src) => (
                      <a
                        key={src.postId}
                        href={`/en/blog/${src.categorySlug}/${src.slug}`}
                        className="text-[10px] text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatMessageList
