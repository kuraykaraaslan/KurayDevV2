import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { TrafficDataPoint } from '@/types/common/DashboardTypes'

interface TrafficOverviewChartProps {
  data: TrafficDataPoint[]
  loading: boolean
}

export default function TrafficOverviewChart({ data, loading }: TrafficOverviewChartProps) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <div className="px-5 py-8 flex justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 animate-spin text-primary" />
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="px-5 py-6 text-sm text-base-content/40">{t('admin.dashboard.no_traffic_data')}</p>
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="px-5 py-4">
      <div className="flex items-end gap-1 h-24">
        {data.map((point, index) => {
          const height = (point.value / maxValue) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${point.label}: ${point.value}`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((point, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="text-[10px] text-base-content/40">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-base-content/50">
        <span>{t('admin.dashboard.traffic_total', { count: data.reduce((sum, d) => sum + d.value, 0).toLocaleString() })}</span>
        <span>{t('admin.dashboard.last_7_days')}</span>
      </div>
    </div>
  )
}
