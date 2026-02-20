import { ReactNode } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons'

export interface DashboardWidgetProps {
  title: string
  viewAllHref?: string
  loading: boolean
  isEmpty: boolean
  emptyMessage: string
  children: ReactNode
}

export default function DashboardWidget({
  title,
  viewAllHref,
  loading,
  isEmpty,
  emptyMessage,
  children,
}: DashboardWidgetProps) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
        <h2 className="text-sm font-semibold text-base-content">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs flex items-center gap-1 text-primary transition-colors"
          >
            View all
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-base-300">
        {loading ? (
          <div className="px-5 py-8 flex justify-center">
            <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : isEmpty ? (
          <p className="px-5 py-6 text-sm text-base-content/40">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function StatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">{children}</div>
  )
}
