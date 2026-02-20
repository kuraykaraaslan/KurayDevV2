import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { GeoLocation } from '@/dtos/AnalyticsDTO'

export default function GeoStatsItem({ location }: { location: GeoLocation }) {
  const locationName = [location.city, location.country].filter(Boolean).join(', ') || 'Unknown'

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="p-2 rounded-full bg-info/10">
        <FontAwesomeIcon icon={faGlobe} className="w-3 h-3 text-info" />
      </div>
      <span className="text-sm text-base-content/80 truncate flex-1">{locationName}</span>
      <span className="text-xs px-2 py-0.5 rounded bg-base-content/5 text-base-content/50">
        {location.visitCount ?? 1} visits
      </span>
    </div>
  )
}
