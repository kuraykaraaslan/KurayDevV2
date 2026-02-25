import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { Notification } from '@/types/common/NotificationTypes'

interface NotificationItemProps {
  notification: Notification
  onNavigate: (notification: Notification) => void
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({ notification: n, onNavigate, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
        n.isRead ? 'opacity-60' : 'bg-base-200/40'
      }`}
    >
      <span
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
          n.isRead ? 'bg-transparent' : 'bg-primary'
        }`}
      />

      <button
        type="button"
        className="flex-1 text-left"
        onClick={() => onNavigate(n)}
      >
        <p className="text-sm font-medium text-base-content leading-snug">{n.title}</p>
        <p className="text-xs text-base-content/60 mt-0.5 leading-snug">{n.message}</p>
        <p className="text-[10px] text-base-content/40 mt-1">
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </button>

      <div className="flex flex-col gap-1 shrink-0">
        {!n.isRead && (
          <button
            type="button"
            title="Mark as read"
            onClick={() => onMarkAsRead(n.notificationId)}
            className="p-1 rounded hover:bg-base-300 text-base-content/40 hover:text-success transition-colors"
          >
            <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(n.notificationId)}
          className="p-1 rounded hover:bg-base-300 text-base-content/40 hover:text-error transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
        </button>
      </div>
    </li>
  )
}
