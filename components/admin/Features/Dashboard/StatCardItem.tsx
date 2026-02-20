import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface StatCardItemProps {
  label: string
  value: number | null
  icon: IconDefinition
  href: string | null
  loading: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function StatCardItem({ label, value, icon, href, loading }: StatCardItemProps) {
  const card = (
    <div className="rounded-lg p-5 border border-base-300 bg-base-200 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-md bg-primary/15">
          <FontAwesomeIcon icon={icon} className="w-4 h-4 text-primary" />
        </div>
        {href && (
          <FontAwesomeIcon
            icon={faArrowRight}
            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
          />
        )}
      </div>
      <div className="text-2xl font-bold text-base-content mb-0.5">
        {loading ? (
          <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin opacity-40" />
        ) : (
          formatNumber(value ?? 0)
        )}
      </div>
      <div className="text-xs text-base-content/50">{label}</div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    <>{card}</>
  )
}
