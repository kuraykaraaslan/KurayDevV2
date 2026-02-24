'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker on mount.
 * Renders nothing — safe to place in the root layout.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch((err) => console.warn('SW registration failed:', err))
    }
  }, [])

  return null
}
