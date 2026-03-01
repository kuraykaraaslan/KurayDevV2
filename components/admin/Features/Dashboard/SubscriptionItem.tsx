import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { Subscription } from '@/types/common/SubscriptionTypes'
import { formatShortDate } from '@/helpers/TimeHelper'

export default function SubscriptionItem({ subscription }: { subscription: Subscription }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="p-2 rounded-full bg-success/10">
        <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-success" />
      </div>
      <span className="text-sm text-base-content/80 truncate flex-1">{subscription.email}</span>
      <span className="text-xs text-base-content/40">{formatShortDate(subscription.createdAt)}</span>
    </div>
  )
}
