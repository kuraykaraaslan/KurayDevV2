'use client'
import { useRef, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons'
import { usePushNotifications } from './Hooks/usePushNotifications'
import { useNotifications } from './Hooks/useNotifications'
import { NotificationDropdown } from './Partials/NotificationDropdown'

const NotificationBell = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const {
    pushSupported,
    pushSubscription,
    pushLoading,
    pushPermission,
    subscribePush,
    unsubscribePush,
  } = usePushNotifications()

  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteOne,
    markAllAsRead,
    clearAll,
    handleNavigate,
  } = useNotifications()

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

  const showPushWarning = pushSupported && !pushSubscription
  const pushDenied = pushPermission === 'denied'

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
        {showPushWarning && unreadCount === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-warning border-2 border-base-100" />
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          showPushWarning={showPushWarning}
          pushDenied={pushDenied}
          pushLoading={pushLoading}
          pushSupported={pushSupported}
          pushSubscription={pushSubscription}
          onSubscribe={subscribePush}
          onUnsubscribe={unsubscribePush}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteOne}
          onClearAll={clearAll}
          onNavigate={(n) => handleNavigate(n, () => setOpen(false))}
        />
      )}
    </div>
  )
}

export default NotificationBell
