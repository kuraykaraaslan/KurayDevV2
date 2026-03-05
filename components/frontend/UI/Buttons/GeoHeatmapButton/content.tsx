'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import WorldMap from 'react-svg-worldmap'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCity, faUsers, faFlag } from '@fortawesome/free-solid-svg-icons'

interface GeoPoint {
  id: string
  country: string
  countryCode: string
  city: string
  lat: number
  lon: number
  count: number
}

interface CountrySummary {
  countryCode: string
  country: string
  count: number
}

interface TooltipState {
  name: string
  count: number
  x: number
  y: number
}

export default function GeoHeatmap() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState<GeoPoint[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapWidth, setMapWidth] = useState(600)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [mounted, setMounted] = useState(false)
  // Ref to always have latest summaries inside DOM event callbacks (avoids stale closure)
  const summariesRef = useRef<CountrySummary[]>([])
  const mousePosRef = useRef({ x: 0, y: 0 })

  useEffect(() => { setMounted(true) }, [])

  // Responsive width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width) - 48
        if (w > 0) setMapWidth(w)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    axiosInstance
      .get('/api/analytics/geo')
      .then((res) => { setPoints(res.data.data ?? []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Aggregate city-level data by ISO country code
  const countryMap = new Map<string, CountrySummary>()
  for (const point of points) {
    const code = (point.countryCode || '').toLowerCase()
    if (!code || code.length !== 2) continue
    const existing = countryMap.get(code)
    if (existing) {
      existing.count += point.count
    } else {
      countryMap.set(code, { countryCode: code, country: point.country, count: point.count })
    }
  }

  const countrySummaries = Array.from(countryMap.values()).sort((a, b) => b.count - a.count)
  summariesRef.current = countrySummaries

  const mapData = countrySummaries.map((c) => ({ country: c.countryCode, value: c.count }))
  const totalVisitors = points.reduce((sum, p) => sum + p.count, 0)
  const totalCountries = countrySummaries.length
  const totalCities = points.length

  // Attach mouseenter/mouseleave directly to SVG paths after WorldMap renders.
  // react-svg-worldmap does not reliably expose country identity via React props,
  // so we read it from the path element's available attributes after mount.
  useEffect(() => {
    if (loading) return
    const container = containerRef.current
    if (!container) return

    const handlers: Array<{ el: Element; enter: EventListener; leave: EventListener }> = []

    const attachEvents = () => {
      const paths = Array.from(container.querySelectorAll<Element>('svg path'))

      paths.forEach((path) => {
        const enter: EventListener = () => {
          // react-svg-worldmap sets the ISO-3166-1 alpha-2 code (uppercase) as the
          // path's id in some versions, or as part of the class string.
          const rawId = (path.id || path.getAttribute('class') || '').toLowerCase()
          // Also try <title> child element (present in some library versions)
          const titleText = path.querySelector?.('title')?.textContent?.trim() ?? ''

          const summaries = summariesRef.current
          let summary: CountrySummary | undefined

          // Match by ISO code from id/class
          if (rawId.length === 2) {
            summary = summaries.find((c) => c.countryCode === rawId)
          }
          // Match by country name from <title>
          if (!summary && titleText) {
            summary = summaries.find(
              (c) => c.country.toLowerCase() === titleText.toLowerCase()
            )
          }

          const name = summary?.country ?? titleText ?? rawId
          if (!name) return

          setTooltip({
            name,
            count: summary?.count ?? 0,
            x: mousePosRef.current.x,
            y: mousePosRef.current.y,
          })
        }

        const leave: EventListener = () => setTooltip(null)

        path.addEventListener('mouseenter', enter)
        path.addEventListener('mouseleave', leave)
        handlers.push({ el: path, enter, leave })
      })
    }

    // Short delay to ensure WorldMap's SVG is in the DOM
    const tid = setTimeout(attachEvents, 80)

    return () => {
      clearTimeout(tid)
      handlers.forEach(({ el, enter, leave }) => {
        el.removeEventListener('mouseenter', enter)
        el.removeEventListener('mouseleave', leave)
      })
    }
  }, [loading, mapWidth])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full p-4 animate-pulse">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-box bg-base-200" />
          ))}
        </div>
        <div className="h-64 rounded-box bg-base-200" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<FontAwesomeIcon icon={faUsers} />}
          label={t('shared.geomap.total_visitors')}
          value={totalVisitors.toLocaleString()}
        />
        <StatCard
          icon={<FontAwesomeIcon icon={faFlag} />}
          label={t('shared.geomap.total_countries')}
          value={totalCountries.toLocaleString()}
        />
        <StatCard
          icon={<FontAwesomeIcon icon={faCity} />}
          label={t('shared.geomap.total_cities')}
          value={totalCities.toLocaleString()}
        />
      </div>

      {/* World map — onMouseMove keeps tooltip position up to date */}
      <div
        ref={containerRef}
        className="w-full rounded-box bg-base-200 px-6 py-4 flex justify-center"
        onMouseMove={(e) => {
          mousePosRef.current = { x: e.clientX, y: e.clientY }
          setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <WorldMap
          color="#6366f1"
          backgroundColor="transparent"
          borderColor="#6366f1"
          strokeOpacity={0.8}
          size={mapWidth}
          data={mapData}
          frame={false}
        />
      </div>

      {/* Top countries */}
      {countrySummaries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
            {t('shared.geomap.top_countries')}
          </p>
          <div className="flex flex-col gap-1">
            {countrySummaries.slice(0, 8).map((c) => {
              const pct = totalVisitors > 0 ? Math.round((c.count / totalVisitors) * 100) : 0
              return (
                <div key={c.countryCode} className="flex items-center gap-2">
                  <span className="text-sm w-32 truncate text-base-content/80">{c.country}</span>
                  <div className="flex-1 h-2 rounded-full bg-base-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-base-content/50 w-10 text-right">
                    {c.count.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Portal tooltip — fixed position above all overflow contexts */}
      {mounted &&
        tooltip &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: tooltip.y + 14,
              left: tooltip.x + 14,
              zIndex: 99999,
              pointerEvents: 'none',
            }}
            className="bg-base-100 border border-base-300 shadow-xl rounded-lg px-3 py-2 text-sm"
          >
            <p className="font-semibold text-base-content">{tooltip.name}</p>
            <p className="text-base-content/60">
              {tooltip.count.toLocaleString()} {t('shared.geomap.visitors_suffix')}
            </p>
          </div>,
          document.body
        )}
    </div>
  )
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-box bg-base-200 p-3 text-center">
      <span className="text-primary text-lg">{icon}</span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-base-content/50">{label}</span>
    </div>
  )
}
