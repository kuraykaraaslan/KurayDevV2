'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import PageHeader from '@/components/admin/UI/PageHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faPlay,
  faLock,
  faUserShield,
  faBan,
} from '@fortawesome/free-solid-svg-icons'
import { ChatMessageList, ChatInput } from '@/components/common/UI/Chat'
import type { ChatMessage, ChatSession } from '@/types/features/ChatbotTypes'

const ChatDetailPage = () => {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId

  const [session, setSession] = useState<ChatSession | undefined>(undefined)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [userBanned, setUserBanned] = useState(false)

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

  // Auto-refresh every 5 seconds to see new messages
  useEffect(() => {
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

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
          onChange={setReplyText}
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
