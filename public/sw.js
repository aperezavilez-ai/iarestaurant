/* Legacy kill-switch: replaces old Workbox SW and unregisters itself. */
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(self.registration.unregister())
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      const clientsList = await self.clients.matchAll({ type: 'window' })
      for (const client of clientsList) {
        client.navigate(client.url)
      }
    })()
  )
})
