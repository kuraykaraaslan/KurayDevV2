import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import type { Notification } from '@/types/common/NotificationTypes'
import { playDing } from './utils'

export function useNotifications() {
  const router = useRouter()
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
        retryTimeout = setTimeout(connect, 5_000)
      }
    }

    connect()

    return () => {
      es?.close()
      clearTimeout(retryTimeout)
    }
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
    )
    try {
      await axiosInstance.patch(`/api/notifications/${notificationId}`)
    } catch {
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

  const handleNavigate = (notification: Notification, onClose: () => void) => {
    if (!notification.isRead) markAsRead(notification.notificationId)
    onClose()
    if (notification.path) router.push(notification.path)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteOne,
    markAllAsRead,
    clearAll,
    handleNavigate,
  }
}
