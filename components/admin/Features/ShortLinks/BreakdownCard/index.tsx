import { AnalyticsEntry } from '@/dtos/ShortLinkDTO'

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-sm truncate shrink-0 text-base-content/70">{label}</span>
      <div className="flex-1 bg-base-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary h-2.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-mono">{count}</span>
    </div>
  )
}

interface BreakdownCardProps {
  title: string
  items: AnalyticsEntry[]
  maxItems?: number
}

export default function BreakdownCard({ title, items, maxItems = 8 }: BreakdownCardProps) {
  if (!items.length) return null
  const max = items[0]?.count ?? 1
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide">{title}</h3>
      <div className="space-y-2.5">
        {items.slice(0, maxItems).map((item) => (
          <BarRow key={item.label} label={item.label} count={item.count} max={max} />
        ))}
      </div>
    </div>
  )
}
