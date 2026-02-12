'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

type MetricName = 'CLS' | 'INP' | 'LCP' | 'FCP' | 'TTFB'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function sendToGA4(metric: { name: MetricName; value: number; rating: string; id: string }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    metric_id: metric.id,
    non_interaction: true,
  })
}

export default function WebVitals() {
  useEffect(() => {
    onCLS(sendToGA4)
    onINP(sendToGA4)
    onLCP(sendToGA4)
    onFCP(sendToGA4)
    onTTFB(sendToGA4)
  }, [])

  return null
}
