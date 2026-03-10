import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { useLanguageStore } from '@/libs/zustand'
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
    let abortController: AbortController | null = null
    let retryTimeout: ReturnType<typeof setTimeout>
    let stopped = false

    async function connect() {
      abortController = new AbortController()
      try {
        const lang = useLanguageStore.getState().lang
        const res = await fetch('/api/notifications/stream', {
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
            'Accept-Language': lang,
          },
          signal: abortController.signal,
        })

        // Auth failure — do not retry
        if (res.status === 401 || res.status === 403) return

        if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const notification: Notification = JSON.parse(line.slice(6))
              setNotifications((prev) => [notification, ...prev])
              playDing()
            } catch {
              // malformed message — ignore
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      }

      if (!stopped) retryTimeout = setTimeout(connect, 5_000)
    }

    connect()

    return () => {
      stopped = true
      abortController?.abort()
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
