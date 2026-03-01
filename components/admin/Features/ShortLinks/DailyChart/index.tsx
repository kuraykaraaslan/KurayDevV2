import { ClickOverTime } from '@/dtos/ShortLinkDTO'

interface DailyChartProps {
  data: ClickOverTime[]
  title?: string
  maxDays?: number
}

export default function DailyChart({ data, title = 'Clicks over time', maxDays = 30 }: DailyChartProps) {
  if (!data.length) return null
  const slice = data.slice(-maxDays)
  const maxVal = Math.max(...slice.map((d) => d.count), 1)

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-sm text-base-content/70 uppercase tracking-wide">{title}</h3>
      <div className="flex items-end gap-1 h-28">
        {slice.map((d) => {
          const h = Math.round((d.count / maxVal) * 100)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center group">
              <div
                className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors cursor-default"
                style={{ height: `${h}%` }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-base-content/40">
        <span>{slice[0]?.date}</span>
        <span>{slice[slice.length - 1]?.date}</span>
      </div>
    </div>
  )
}
