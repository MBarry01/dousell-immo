// 1. REGISTER LISTENERS IMMEDIATELY AT TOP LEVEL (Critical for Initial Evaluation)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  console.debug('[SW] Push event reserved.');
});

self.addEventListener('notificationclick', (event) => {
  console.debug('[SW] Notification click reserved.');
});

// 2. Constants & Assets
const CACHE_NAME = "dousell-immo-v20";
const STATIC_ASSETS = [
  "/",
  "/pro",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline.html",
];

// 3. Install event (Reserve it)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 4. Import OneSignal SW SDK (synchronous)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 5. Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 6. Fetch event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Skip logic
  if (
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.includes("_next/static") ||
    event.request.url.includes("_next/image") ||
    event.request.url.includes("api/") ||
    url.hostname.includes("cloudinary.com") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("coinafrique.com") ||
    url.hostname.includes("roamcdn.net") ||
    url.hostname.includes("jijistatic.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
      });
    })
  );
});
