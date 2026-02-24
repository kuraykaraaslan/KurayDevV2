/// <reference lib="webworker" />

// ─── Push Notification Handling ─────────────────────────────────────────────

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If a window with the target URL is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// ─── Minimal Fetch Handler (Network-first, no offline caching) ──────────────
// We deliberately do NOT cache pages to avoid interfering with SSR / ISR.
// The service worker exists solely to enable push notifications and
// installability. If you need offline support later, consider Serwist.

self.addEventListener('fetch', function (event) {
  // Let the browser handle all fetches normally (network-first, SSR-safe)
  return
})
