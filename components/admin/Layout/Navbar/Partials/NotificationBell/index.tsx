'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import type { Notification } from '@/types/common/NotificationTypes'

// ── Web Audio ding ────────────────────────────────────────────────────────────

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // Audio not supported — fail silently
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationBell = () => {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // ── Fetch all notifications on mount ──────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/notifications')
      setNotifications(res.data.notifications ?? [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── SSE stream ────────────────────────────────────────────────────────────

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/notifications/stream')

      es.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data)
          setNotifications((prev) => [notification, ...prev])
          playDing()
        } catch {
          // malformed message — ignore
        }
      }

      es.onerror = () => {
        es?.close()
        // Reconnect after 5 s
        retryTimeout = setTimeout(connect, 5_000)
      }
    }

    connect()

    return () => {
      es?.close()
      clearTimeout(retryTimeout)
    }
  }, [])

  // ── Click outside ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
    )
    try {
      await axiosInstance.patch(`/api/notifications/${notificationId}`)
    } catch {
      // rollback
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: false } : n))
      )
    }
  }

  const deleteOne = async (notificationId: string) => {
    const prev = notifications
    setNotifications((p) => p.filter((n) => n.notificationId !== notificationId))
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`)
    } catch {
      setNotifications(prev)
    }
  }

  const markAllAsRead = async () => {
    const prev = notifications
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })))
    try {
      await axiosInstance.patch('/api/notifications')
    } catch {
      setNotifications(prev)
    }
  }

  const clearAll = async () => {
    const prev = notifications
    setNotifications([])
    try {
      await axiosInstance.delete('/api/notifications')
    } catch {
      setNotifications(prev)
    }
  }

  const handleNavigate = (notification: Notification) => {
    if (!notification.isRead) markAsRead(notification.notificationId)
    setOpen(false)
    if (notification.path) router.push(notification.path)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-base-200 transition-colors"
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-base-content/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-base-300 bg-base-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-200">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </span>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-base-content/40 hover:text-success transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-base-content/40 hover:text-error transition-colors"
                  title="Clear all"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-base-content/50 text-center">All caught up!</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-base-200">
              {notifications.map((n) => (
                <li
                  key={n.notificationId}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    n.isRead ? 'opacity-60' : 'bg-base-200/40'
                  }`}
                >
                  {/* Unread dot */}
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.isRead ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />

                  {/* Content */}
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() => handleNavigate(n)}
                  >
                    <p className="text-sm font-medium text-base-content leading-snug">{n.title}</p>
                    <p className="text-xs text-base-content/60 mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-base-content/40 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </button>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        type="button"
                        title="Mark as read"
                        onClick={() => markAsRead(n.notificationId)}
                        className="p-1 rounded hover:bg-base-300 text-base-content/40 hover:text-success transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteOne(n.notificationId)}
                      className="p-1 rounded hover:bg-base-300 text-base-content/40 hover:text-error transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}


        </div>
      )}
    </div>
  )
}

export default NotificationBell
