'use client'
import { useEffect, useState } from 'react'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { GeoLocation } from '@/dtos/AnalyticsDTO'
import { Stat, StatFrequency, ChatbotStat } from '@/types/common/StatTypes'
import {
  STAT_CARDS,
  STAT_FREQUENCIES,
  TrafficDataPoint,
  aggregateGeoByCountry,
  generateTrafficData,
} from '@/types/common/DashboardTypes'
import PageHeader from '@/components/admin/UI/PageHeader'
import DashboardWidget, { StatsGrid } from '@/components/admin/Features/Dashboard'
import StatCardItem from '@/components/admin/Features/Dashboard/StatCardItem'
import GeoStatsItem from '@/components/admin/Features/Dashboard/GeoStatsItem'
import TrafficOverviewChart from '@/components/admin/Features/Dashboard/TrafficOverviewChart'
import ChatbotStatsWidget from '@/components/admin/Features/Dashboard/ChatbotStatsWidget'

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stat | null>(null)
  const [chatbotStats, setChatbotStats] = useState<ChatbotStat | null>(null)
  const [geoData, setGeoData] = useState<GeoLocation[]>([])
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([])
  const [geoLoading, setGeoLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [frequency, setFrequency] = useState<StatFrequency>('all-time')

  useEffect(() => {
    const fetchGeo = async () => {
      setGeoLoading(true)
      try {
        const res = await axiosInstance.get('/api/analytics/geo')
        const locations: GeoLocation[] = res.data.data ?? []

        setGeoData(aggregateGeoByCountry(locations))
        setTrafficData(generateTrafficData(locations))
      } catch (err) {
        console.error('Analytics geo fetch error:', err)
      } finally {
        setGeoLoading(false)
      }
    }
    fetchGeo()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const res = await axiosInstance.post('/api/stats', { frequency })
        setStats(res.data.values)
        setChatbotStats(res.data.chatbot ?? null)
      } catch (err) {
        console.error('Analytics stats fetch error:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [frequency])

  const totalVisits = geoData.reduce((sum, loc) => sum + (loc.visitCount ?? 1), 0)
  const uniqueCountries = geoData.length

  return (
    <div className="w-full">
      <PageHeader title={t('admin.analytics.title')} description={t('admin.analytics.description')} />

      {/* Frequency selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STAT_FREQUENCIES.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${frequency === f.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFrequency(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <StatsGrid>
        {STAT_CARDS.map(({ key, label, icon, href }) => (
          <StatCardItem
            key={key}
            label={label}
            value={stats ? stats[key as keyof Stat] : null}
            icon={icon}
            href={href}
            loading={statsLoading}
          />
        ))}
      </StatsGrid>

      {/* Traffic + summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <DashboardWidget title={t('admin.analytics.traffic_overview')} loading={false} isEmpty={false} emptyMessage="">
          <TrafficOverviewChart data={trafficData} loading={geoLoading} />
        </DashboardWidget>

        <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-base-300">
            <h2 className="text-sm font-semibold text-base-content">{t('admin.analytics.visit_summary')}</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-base-300/50">
              <div className="text-3xl font-bold text-base-content">
                {geoLoading ? '—' : totalVisits.toLocaleString()}
              </div>
              <div className="text-xs text-base-content/50 mt-1">{t('admin.analytics.total_visits')}</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-base-300/50">
              <div className="text-3xl font-bold text-base-content">
                {geoLoading ? '—' : uniqueCountries}
              </div>
              <div className="text-xs text-base-content/50 mt-1">{t('admin.analytics.unique_countries')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot analytics */}
      <div className="mb-6">
        <ChatbotStatsWidget stats={chatbotStats} loading={statsLoading} />
      </div>

      {/* Full geo list */}
      <DashboardWidget
        title={`${t('admin.analytics.geo_data')}${!geoLoading ? ` — ${uniqueCountries} ${t('admin.analytics.countries')}` : ''}`}
        loading={geoLoading}
        isEmpty={geoData.length === 0}
        emptyMessage={t('admin.dashboard.no_geo_data')}
      >
        <div className="grid md:grid-cols-2">
          {geoData.map((loc, idx) => (
            <GeoStatsItem key={loc.id || idx} location={loc} />
          ))}
        </div>
      </DashboardWidget>
    </div>
  )
}
