'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'
import PageHeader from '@/components/admin/UI/PageHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faPlay,
  faLock,
  faUserShield,
  faBan,
  faWifi,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'
import { ChatMessageList, ChatInput } from '@/components/common/UI/Chat'
import type { ChatMessage } from '@/types/features/ChatbotTypes'
import type { StoredChatSession } from '@/dtos/ChatbotDTO'

const ChatDetailPage = () => {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId

  const [session, setSession] = useState<StoredChatSession | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [userBanned, setUserBanned] = useState(false)

  // ── Initial data fetch ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await axiosInstance.get(`/api/chatbot/admin/${sessionId}`)
      setSession(res.data.session)
      setMessages(res.data.messages ?? [])
      setUserBanned(!!res.data.userBanned)
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

  // ── Polling for real-time updates ──────────────────────────────────
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isConnected = true // Always "connected" in HTTP mode

  useEffect(() => {
    if (!sessionId || loading) return

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/api/chatbot/admin/${sessionId}`)
        const newSession = res.data.session as StoredChatSession | undefined
        const newMessages = (res.data.messages ?? []) as ChatMessage[]

        if (newSession) {
          setSession(newSession)
        }
        if (newMessages.length > 0) {
          setMessages((prev) => {
            // Only update if message count changed to avoid flickering
            if (prev.length !== newMessages.length) {
              return newMessages.filter((m) => m.content !== ADMIN_TAKEOVER_SENTINEL)
            }
            return prev
          })
        }
      } catch { /* ignore polling errors */ }
    }, 3000) // Poll every 3 seconds

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [sessionId, loading])

  // ── Admin actions (HTTP — need server-side auth/validation) ───────
  const handleAction = async (action: 'takeover' | 'release' | 'close' | 'ban' | 'unban') => {
    if (!sessionId) return
    setActionLoading(true)
    try {
      await axiosInstance.patch(`/api/chatbot/admin/${sessionId}`, { action })
      if (action === 'ban') setUserBanned(true)
      if (action === 'unban') setUserBanned(false)

      toast.success(
        action === 'takeover'
          ? 'Session taken over'
          : action === 'release'
            ? 'Session released to AI'
            : action === 'ban'
              ? 'User banned for 1 hour'
              : action === 'unban'
                ? 'User unbanned'
                : 'Session closed'
      )
      // Session update will arrive via WebSocket, but also fetch for safety
      await fetchData()
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Admin reply via HTTP ───────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
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
  }, [replyText, sessionId, sending, fetchData])

  // ── Export session (Phase 13) ───────────────────────────────────
  const handleExport = useCallback((format: 'json' | 'csv' | 'txt') => {
    if (!sessionId) return
    const url = `/api/chatbot/admin/${sessionId}/export?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${sessionId}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [sessionId])

  // ── Admin typing handler ──────────────────────────────────────────
  const handleReplyChange = useCallback((value: string) => {
    setReplyText(value)
  }, [])

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
          // Ban / Unban
          ...(userBanned
            ? [
                {
                  label: 'Unban User',
                  onClick: () => handleAction('unban'),
                  className: 'btn-success',
                  icon: faBan,
                  loading: actionLoading,
                },
              ]
            : [
                {
                  label: 'Ban User (1h)',
                  onClick: () => handleAction('ban'),
                  className: 'btn-error btn-outline',
                  icon: faBan,
                  loading: actionLoading,
                },
              ]),
          // Export (Phase 13)
          {
            label: 'Export',
            onClick: () => handleExport('json'),
            className: 'btn-ghost btn-sm',
            icon: faDownload,
          },
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
        <FontAwesomeIcon
          icon={faWifi}
          className={`w-3 h-3 ml-auto transition-colors ${isConnected ? 'text-success' : 'text-error/60'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        showMeta
        showInlineSources
        className="bg-base-100 rounded-xl border border-base-300 min-h-[400px] max-h-[600px]"
        emptyContent={
          <div className="text-center text-base-content/40 py-12">
            <FontAwesomeIcon icon={faRobot} className="w-10 h-10 mb-2 opacity-30" />
            <p>No messages yet</p>
          </div>
        }
      />

      {/* Admin Reply Input */}
      {!isClosed && (
        <ChatInput
          value={replyText}
          onChange={handleReplyChange}
          onSend={handleSendReply}
          disabled={!canReply}
          sending={sending}
          placeholder={
            canReply
              ? 'Type your reply as admin...'
              : 'Take over the session first to reply'
          }
          sendLabel="Send"
          variant="full"
          className="mt-3"
        />
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
