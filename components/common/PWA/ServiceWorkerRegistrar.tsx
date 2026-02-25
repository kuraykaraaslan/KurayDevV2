'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker once on mount.
 * Renders nothing — safe to place in the root layout.
 */
let swRegistered = false

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (swRegistered) return
    if (!('serviceWorker' in navigator)) return

    swRegistered = true
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => {
        swRegistered = false
        console.warn('SW registration failed:', err)
      })
  }, [])

  return null
}
