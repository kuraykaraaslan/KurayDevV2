import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faBellSlash } from '@fortawesome/free-solid-svg-icons'
import type { Notification } from '@/types/common/NotificationTypes'
import { PushWarningBanner } from './PushWarningBanner'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  showPushWarning: boolean
  pushDenied: boolean
  pushLoading: boolean
  pushSupported: boolean
  pushSubscription: PushSubscription | null
  onSubscribe: () => void
  onUnsubscribe: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onNavigate: (notification: Notification) => void
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  showPushWarning,
  pushDenied,
  pushLoading,
  pushSupported,
  pushSubscription,
  onSubscribe,
  onUnsubscribe,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNavigate,
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-base-300 bg-base-100 z-50 overflow-hidden">
      {showPushWarning && (
        <PushWarningBanner
          pushDenied={pushDenied}
          pushLoading={pushLoading}
          onSubscribe={onSubscribe}
        />
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
                  onClick={onMarkAllAsRead}
                  className="text-xs text-base-content/40 hover:text-success transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-base-content/40 hover:text-error transition-colors"
                title="Clear all"
              >
                Clear all
              </button>
            </>
          )}
          {pushSupported && pushSubscription && (
            <button
              type="button"
              onClick={onUnsubscribe}
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
            <NotificationItem
              key={n.notificationId}
              notification={n}
              onNavigate={onNavigate}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
