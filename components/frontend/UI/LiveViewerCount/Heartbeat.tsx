'use client'

import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

interface Props {
  slug: string
  initialCount: number
}

const INTERVAL_MS = 30_000

function getOrCreateToken(): string {
  const key = 'viewer_token'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const token = crypto.randomUUID()
  sessionStorage.setItem(key, token)
  return token
}

/** Client component — sends heartbeats and keeps viewer count up to date. */
export default function ViewerHeartbeat({ slug, initialCount }: Props) {
  const { t } = useTranslation()
  const [count, setCount] = useState(initialCount)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const token = getOrCreateToken()
    const beat = () =>
      axiosInstance
        .post('/api/analytics/viewers', { slug, token })
        .then((res) => setCount(res.data.count ?? count))
        .catch(() => undefined)

    beat()
    intervalRef.current = setInterval(beat, INTERVAL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [slug])

  if (count <= 1) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs text-primary animate-pulse">
      <FontAwesomeIcon icon={faEye} className="text-[11px]" />
      <span>{t('shared.viewers.live', { count })}</span>
    </span>
  )
}
