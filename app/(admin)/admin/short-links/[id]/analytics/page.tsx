'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { faMousePointer, faGlobe, faWindowMaximize, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { ShortLinkAnalyticsResponse } from '@/dtos/ShortLinkDTO'
import PageHeader from '@/components/admin/UI/PageHeader'
import StatCardItem from '@/components/admin/Features/Dashboard/StatCardItem'
import BreakdownCard from '@/components/admin/Features/ShortLinks/BreakdownCard'
import DailyChart from '@/components/admin/Features/ShortLinks/DailyChart'
import CopyButton from '@/components/admin/UI/CopyButton'

const APP_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || ''

export default function ShortLinkAnalyticsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ShortLinkAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get(`/api/links/${params.id}/analytics`)
      setData(res.data.analytics)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-base-content/50">Short link not found.</div>
    )
  }

  const uniqueCountries = data.byCountry.filter((c) => c.label !== 'Unknown').length

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        subtitle={
          <>
            <a
              href={`/s/${data.link.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
            >
              /s/{data.link.code}
            </a>
            <span className="ml-2">{data.link.originalUrl}</span>
          </>
        }
        onBack={() => router.push('/admin/short-links')}
        onRefresh={load}
        refreshing={loading}
      >
        <CopyButton text={`${APP_HOST}/s/${data.link.code}`} size="sm" />
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardItem label="Total Clicks" value={data.totalClicks} icon={faMousePointer} href={null} loading={false} />
        <StatCardItem label="Countries" value={uniqueCountries} icon={faGlobe} href={null} loading={false} />
        <StatCardItem label="Browsers" value={data.byBrowser.length} icon={faWindowMaximize} href={null} loading={false} />
        <StatCardItem label="Days active" value={data.clicksOverTime.length} icon={faCalendar} href={null} loading={false} />
      </div>

      {/* Daily chart */}
      <DailyChart data={data.clicksOverTime} />

      {/* Breakdowns grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <BreakdownCard title="By Country" items={data.byCountry} />
        <BreakdownCard title="By Referrer" items={data.byReferrer} />
        <BreakdownCard title="By Browser" items={data.byBrowser} />
        <BreakdownCard title="By OS" items={data.byOS} />
        <BreakdownCard title="By Device" items={data.byDevice} />
      </div>
    </div>
  )
}
