'use client'

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react'
import { useParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import PageHeader from '@/components/admin/UI/PageHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faUser,
  faUserShield,
  faPaperPlane,
  faPlay,
  faLock,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import type { ChatMessage, ChatSession } from '@/types/features/ChatbotTypes'

const roleConfig = {
  user: { label: 'User', icon: faUser, bg: 'bg-primary text-primary-content', align: 'justify-end' },
  assistant: { label: 'AI', icon: faRobot, bg: 'bg-base-200 text-base-content', align: 'justify-start' },
  admin: { label: 'Admin', icon: faUserShield, bg: 'bg-warning/20 text-warning-content border border-warning/30', align: 'justify-start' },
}

const ChatDetailPage = () => {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId

  const [session, setSession] = useState<ChatSession | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await axiosInstance.get(`/api/chatbot/admin/${sessionId}`)
      setSession(res.data.session)
      setMessages(res.data.messages ?? [])
    } catch (err) {
      console.error('Failed to fetch session', err)
      toast.error('Failed to load chat session')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-refresh every 5 seconds to see new messages
  useEffect(() => {
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleAction = async (action: 'takeover' | 'release' | 'close') => {
    if (!sessionId) return
    setActionLoading(true)
    try {
      await axiosInstance.patch(`/api/chatbot/admin/${sessionId}`, { action })
      toast.success(
        action === 'takeover'
          ? 'Session taken over'
          : action === 'release'
            ? 'Session released to AI'
            : 'Session closed'
      )
      await fetchData()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !sessionId || sending) return
    setSending(true)
    try {
      await axiosInstance.post(`/api/chatbot/admin/${sessionId}`, {
        message: replyText.trim(),
      })
      setReplyText('')
      await fetchData()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader title="Session Not Found" backHref="/admin/chatbot" />
        <p className="text-base-content/50 mt-4">This chat session does not exist or has expired.</p>
      </div>
    )
  }

  const isTakenOver = session.status === 'TAKEN_OVER'
  const isClosed = session.status === 'CLOSED'
  const canReply = isTakenOver && !isClosed

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title={session.title || 'Chat Session'}
        description={`${session.userEmail ?? session.userId} · Started ${formatDate(session.createdAt)}`}
        backHref="/admin/chatbot"
        onRefresh={fetchData}
        refreshing={loading}
        actions={[
          // Takeover / Release toggle
          ...(!isClosed
            ? [
                isTakenOver
                  ? {
                      label: 'Release to AI',
                      onClick: () => handleAction('release'),
                      className: 'btn-info',
                      icon: faPlay,
                      loading: actionLoading,
                    }
                  : {
                      label: 'Take Over',
                      onClick: () => handleAction('takeover'),
                      className: 'btn-warning',
                      icon: faUserShield,
                      loading: actionLoading,
                    },
              ]
            : []),
          // Close
          ...(!isClosed
            ? [
                {
                  label: 'Close Session',
                  onClick: () => handleAction('close'),
                  className: 'btn-error',
                  icon: faLock,
                  loading: actionLoading,
                },
              ]
            : []),
        ]}
      />

      {/* Status Bar */}
      <div className="mt-4 mb-2 flex items-center gap-2">
        <span
          className={`badge badge-sm ${
            session.status === 'ACTIVE'
              ? 'badge-success'
              : session.status === 'TAKEN_OVER'
                ? 'badge-warning'
                : 'badge-error'
          }`}
        >
          {session.status === 'ACTIVE'
            ? 'AI Responding'
            : session.status === 'TAKEN_OVER'
              ? 'Admin Responding'
              : 'Closed'}
        </span>
        {session.takenOverBy && (
          <span className="text-xs text-base-content/50">
            by {session.takenOverBy.slice(0, 12)}...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="bg-base-100 rounded-xl border border-base-300 p-4 min-h-[400px] max-h-[600px] overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center text-base-content/40 py-12">
            <FontAwesomeIcon icon={faRobot} className="w-10 h-10 mb-2 opacity-30" />
            <p>No messages yet</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.content === '__ADMIN_TAKEOVER__') return null
          const cfg = roleConfig[msg.role]
          return (
            <div key={msg.id} className={`flex ${cfg.align}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${cfg.bg}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <FontAwesomeIcon icon={cfg.icon} className="w-3 h-3 opacity-60" />
                  <span className="text-[10px] font-semibold opacity-60">{cfg.label}</span>
                  <span className="text-[10px] opacity-40">{msg.createdAt ? formatTime(msg.createdAt) : ''}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
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

      {/* Admin Reply Input */}
      {!isClosed && (
        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              canReply
                ? 'Type your reply as admin...'
                : 'Take over the session first to reply'
            }
            disabled={!canReply || sending}
            className="textarea textarea-bordered flex-1 resize-none min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSendReply}
            disabled={!canReply || !replyText.trim() || sending}
            className="btn btn-primary"
          >
            {sending ? (
              <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      )}

      {isClosed && (
        <div className="mt-3 text-center text-base-content/50 bg-base-200 rounded-lg py-3">
          <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
          This session is closed
        </div>
      )}
    </div>
  )
}

export default ChatDetailPage
