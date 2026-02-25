'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker once on mount.
 * Renders nothing — safe to place in the root layout.
 */
let swRegistered = false

function canUseServiceWorker() {
  if (!('serviceWorker' in navigator)) return false

  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

  if (!window.isSecureContext && !isLocalhost) {
    console.info(
      '[PWA] Skipping service worker registration because the origin is not secure:',
      window.location.origin
    )
    return false
  }

  return true
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (swRegistered) return
    if (!canUseServiceWorker()) return

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
