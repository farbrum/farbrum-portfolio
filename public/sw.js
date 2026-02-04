const CACHE_NAME = 'farbrum-v5'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.jpg',
]

// Installation — mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activation — nettoyage ancien cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch — stratégie network-first puis cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache la réponse fraîche
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Réseau indisponible — servir depuis le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // Si c'est une navigation, retourner la page index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})
