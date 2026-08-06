/* UnieMax push service worker.
 *
 * Deliberately tiny and dependency-free: it only renders pushes and routes
 * clicks. It caches nothing and intercepts no fetches, so it can never serve
 * a stale app shell — a service worker that goes wrong there breaks the whole
 * site, and offline support is not what we registered it for.
 *
 * Payloads come from `package/push` as JSON: { title, body, url, tag }.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // A payload we can't parse still deserves a visible notification —
    // browsers penalise a push handler that shows nothing.
    payload = { title: 'UnieMax', body: 'You have a new notification.' }
  }

  const title = payload.title || 'UnieMax'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      // Same tag = the newer message replaces the older one, so a burst of
      // order updates doesn't stack five notifications on a phone.
      tag: payload.tag || 'uniemax',
      icon: '/app_logo.png',
      badge: '/app_logo.png',
      data: { url: payload.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href

  // Focus an existing tab on the same origin rather than opening a duplicate.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.url.startsWith(self.location.origin) && 'focus' in tab) {
          tab.navigate?.(target)
          return tab.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
