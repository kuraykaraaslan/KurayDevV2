'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faBellSlash, faCheck, faXmark, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import type { Notification } from '@/types/common/NotificationTypes'

// ── VAPID helper ──────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

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

// ── Get or register SW and wait until active ─────────────────────────────────

async function getActiveRegistration(): Promise<ServiceWorkerRegistration> {
  let reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg) {
    reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  }

  if (reg.active) return reg

  // SW exists but is not yet active — wait for it
  const sw = reg.installing ?? reg.waiting
  if (!sw) throw new Error('No service worker found in registration')

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Service worker activation timed out'))
    }, 10_000)

    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') {
        clearTimeout(timeout)
        resolve(reg!)
      }
    })

    // In case it already transitioned
    if (sw.state === 'activated') {
      clearTimeout(timeout)
      resolve(reg!)
    }
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationBell = () => {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // ── Push notification state ───────────────────────────────────────────────
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // ── Push notification check ───────────────────────────────────────────────

  const checkPushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushSupported(true)
    setPushPermission(Notification.permission)

    try {
      const registration = await getActiveRegistration()
      const sub = await registration.pushManager.getSubscription()
      setPushSubscription(sub)
    } catch {
      // SW not ready yet — push state stays as default (not subscribed)
    }
  }, [])

  useEffect(() => {
    checkPushSubscription()
  }, [checkPushSubscription])

  const subscribePush = async () => {
    setPushLoading(true)
    try {
      // 1) Explicitly request notification permission first
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission !== 'granted') {
        return
      }

      // 2) Get or register the service worker, then wait until it's active
      const registration = await getActiveRegistration()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
        return
      }

      // 3) Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const serialized = sub.toJSON()
      await axiosInstance.post('/api/push/subscribe', {
        endpoint: serialized.endpoint,
        keys: serialized.keys,
      })

      setPushSubscription(sub)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setPushPermission(Notification.permission)
      setPushLoading(false)
    }
  }

  const unsubscribePush = async () => {
    setPushLoading(true)
    try {
      await pushSubscription?.unsubscribe()
      await axiosInstance.delete('/api/push/subscribe')
      setPushSubscription(null)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setPushLoading(false)
    }
  }

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

  // ── Derived push state ─────────────────────────────────────────────────────

  const showPushWarning = pushSupported && !pushSubscription
  const pushDenied = pushPermission === 'denied'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-base-200 transition-colors"
        aria-label="Notifications"
      >
        <FontAwesomeIcon
          icon={pushSubscription ? faBell : faBellSlash}
          className={`w-4 h-4 ${pushSubscription ? 'text-base-content/80' : 'text-warning/70'}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-error text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Small warning dot when push not subscribed */}
        {showPushWarning && unreadCount === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-warning border-2 border-base-100" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-base-300 bg-base-100 z-50 overflow-hidden">
          {/* Push notification warning banner */}
          {showPushWarning && (
            <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
              <div className="flex items-start gap-2.5">
                <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {pushDenied ? (
                    <>
                      <p className="text-xs font-semibold text-warning">Push notifications blocked</p>
                      <p className="text-[11px] text-base-content/60 mt-0.5 leading-snug">
                        You have blocked notifications in your browser settings. Please allow notifications from site settings to receive push alerts.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-warning">Push notifications are off</p>
                      <p className="text-[11px] text-base-content/60 mt-0.5 leading-snug">
                        Enable push notifications so you never miss an update.
                      </p>
                      <button
                        type="button"
                        onClick={subscribePush}
                        disabled={pushLoading}
                        className="mt-1.5 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        {pushLoading ? 'Enabling…' : 'Enable now'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-200">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
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
                </>
              )}
              {/* Push toggle button in header */}
              {pushSupported && pushSubscription && (
                <button
                  type="button"
                  onClick={unsubscribePush}
                  disabled={pushLoading}
                  className="text-xs text-base-content/40 hover:text-warning transition-colors flex items-center gap-1 disabled:opacity-50"
                  title="Disable push notifications"
                >
                  <FontAwesomeIcon icon={faBellSlash} className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
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
