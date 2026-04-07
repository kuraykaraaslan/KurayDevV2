'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // ChunkLoadError happens when a new deployment invalidates old chunk hashes.
    // A hard reload fetches the latest build and resolves it automatically.
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      const reloadCount = parseInt(sessionStorage.getItem('_chunkReloads') || '0')
      if (reloadCount < 3) {
        sessionStorage.setItem('_chunkReloads', String(reloadCount + 1))
        window.location.reload()
      }
    } else {
      sessionStorage.removeItem('_chunkReloads')
    }
  }, [error])

  return (
    <html>
      <body>
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', color: '#3b82f6' }}>500</h1>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</p>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>An unexpected error occurred.</p>
            <button
              onClick={reset}
              style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        </section>
      </body>
    </html>
  )
}
