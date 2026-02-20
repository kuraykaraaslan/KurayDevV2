import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faUser, faCheckCircle, faTimesCircle, faHourglass } from '@fortawesome/free-solid-svg-icons'
import { Appointment, AppointmentStatus } from '@/types/features/CalendarTypes'

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig: Record<AppointmentStatus, { icon: typeof faClock; color: string }> = {
  PENDING: { icon: faHourglass, color: 'text-warning' },
  BOOKED: { icon: faCheckCircle, color: 'text-info' },
  COMPLETED: { icon: faCheckCircle, color: 'text-success' },
  CANCELLED: { icon: faTimesCircle, color: 'text-error' },
}

export default function AppointmentItem({ appointment }: { appointment: Appointment }) {
  const status = statusConfig[appointment.status] || statusConfig.PENDING

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <FontAwesomeIcon icon={status.icon} className={`w-3 h-3 flex-shrink-0 ${status.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-base-content/40" />
          <span className="text-sm text-base-content/80 truncate">{appointment.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-base-content/30" />
          <span className="text-xs text-base-content/50">{formatDateTime(appointment.startTime)}</span>
        </div>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded ${
          appointment.status === 'PENDING'
            ? 'bg-warning/10 text-warning'
            : appointment.status === 'BOOKED'
              ? 'bg-info/10 text-info'
              : appointment.status === 'COMPLETED'
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error'
        }`}
      >
        {appointment.status}
      </span>
    </div>
  )
}
