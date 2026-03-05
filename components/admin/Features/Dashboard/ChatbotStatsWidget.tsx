'use client'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot,
  faComments,
  faUsers,
  faEnvelope,
  faCircle,
  faArrowRight,
  faSpinner,
  faLock,
  faHandshake,
} from '@fortawesome/free-solid-svg-icons'
import { ChatbotStat } from '@/types/common/StatTypes'

interface ChatbotStatsWidgetProps {
  stats: ChatbotStat | null
  loading: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const STATUS_CONFIG = {
  ACTIVE: { color: 'text-success', label: 'Active', icon: faCircle },
  CLOSED: { color: 'text-base-content/40', label: 'Closed', icon: faLock },
  TAKEN_OVER: { color: 'text-warning', label: 'Taken Over', icon: faHandshake },
} as const

export default function ChatbotStatsWidget({ stats, loading }: ChatbotStatsWidgetProps) {

  if (loading) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-base-300">
          <h2 className="text-sm font-semibold text-base-content">Chatbot</h2>
        </div>
        <div className="px-5 py-8 flex justify-center">
          <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-base-300">
          <h2 className="text-sm font-semibold text-base-content">Chatbot</h2>
        </div>
        <p className="px-5 py-6 text-sm text-base-content/40">Failed to load chatbot stats.</p>
      </div>
    )
  }

  const statItems = [
    { label: 'Total Sessions', value: stats.totalSessions, icon: faRobot, color: 'text-primary' },
    { label: 'Total Messages', value: stats.totalMessages, icon: faComments, color: 'text-info' },
    { label: 'Unique Users', value: stats.uniqueUsers, icon: faUsers, color: 'text-secondary' },
    { label: 'Avg Msgs/Session', value: stats.avgMessagesPerSession, icon: faEnvelope, color: 'text-accent' },
  ]

  const sessionBreakdown = [
    { label: 'Active', value: stats.activeSessions, color: 'bg-success' },
    { label: 'Closed', value: stats.closedSessions, color: 'bg-base-content/30' },
    { label: 'Taken Over', value: stats.takenOverSessions, color: 'bg-warning' },
  ]

  const totalForBar = stats.totalSessions || 1

  return (
    <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
        <h2 className="text-sm font-semibold text-base-content flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-primary" />
          Chatbot Analytics
        </h2>
        <Link
          href="/admin/chatbot"
          className="text-xs flex items-center gap-1 text-primary transition-colors"
        >
          View all
          <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
        </Link>
      </div>

      {/* Stat numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center p-3 rounded-lg bg-base-300/50">
            <div className="flex justify-center mb-2">
              <div className={`p-2 rounded-md bg-base-content/5`}>
                <FontAwesomeIcon icon={item.icon} className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            <div className="text-xl font-bold text-base-content">{formatNumber(item.value)}</div>
            <div className="text-[10px] text-base-content/50 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Session breakdown bar */}
      <div className="px-5 pb-4">
        <div className="text-xs text-base-content/60 mb-2 font-medium">Session Breakdown</div>
        <div className="flex rounded-full overflow-hidden h-2.5 bg-base-300">
          {sessionBreakdown.map((item) => {
            const pct = (item.value / totalForBar) * 100
            if (pct === 0) return null
            return (
              <div
                key={item.label}
                className={`${item.color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${item.label}: ${item.value}`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {sessionBreakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-base-content/50">
                {item.label} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {stats.recentSessions.length > 0 && (
        <div className="border-t border-base-300">
          <div className="px-5 py-3">
            <div className="text-xs text-base-content/60 font-medium">Recent Sessions</div>
          </div>
          <div className="divide-y divide-base-300">
            {stats.recentSessions.map((session) => {
              const statusCfg = STATUS_CONFIG[session.status]
              return (
                <Link
                  key={session.chatSessionId}
                  href={`/admin/chatbot/${session.chatSessionId}`}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-base-300/30 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={statusCfg.icon}
                    className={`w-2 h-2 ${statusCfg.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-base-content truncate">
                      {session.title || 'Untitled session'}
                    </div>
                    <div className="text-[10px] text-base-content/40">
                      {session.userEmail || session.userId.slice(0, 12)}
                    </div>
                  </div>
                  <div className="text-[10px] text-base-content/40 whitespace-nowrap">
                    {timeAgo(session.updatedAt)}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
