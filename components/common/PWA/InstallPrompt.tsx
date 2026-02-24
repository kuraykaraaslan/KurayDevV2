'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Shows an "Install App" prompt on supported browsers.
 * On iOS it displays share-sheet instructions instead.
 * Hidden when the app is already installed (standalone mode).
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Restore dismiss state
    if (localStorage.getItem('pwa-install-dismissed') === '1') {
      setDismissed(true)
    }

    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream
    )

    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true
    )

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || dismissed) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
  }

  // nothing to show for non-iOS browsers until the browser fires the event
  if (!deferredPrompt && !isIOS) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="alert shadow-lg bg-base-100 border border-base-300">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Install App</span>
            <button
              onClick={handleDismiss}
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          {isIOS ? (
            <p className="text-xs opacity-70">
              Tap the share button{' '}
              <span role="img" aria-label="share icon">
                ⎋
              </span>{' '}
              and then &quot;Add to Home Screen&quot;{' '}
              <span role="img" aria-label="plus icon">
                ➕
              </span>
            </p>
          ) : (
            <button
              onClick={handleInstall}
              className="btn btn-primary btn-sm w-full"
            >
              Add to Home Screen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
