// 1. REGISTER LISTENERS IMMEDIATELY AT TOP LEVEL
// This is critical to avoid "Event handler must be added on the initial evaluation"
// by ensuring the browser sees handler registration in the first execution turn.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  // OneSignal will handle the heavy lifting, we just reserve the event here
  console.debug('[SW] Push event reserved.');
});

self.addEventListener('notificationclick', (event) => {
  console.debug('[SW] Notification click reserved.');
});

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate the new service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 2. Import OneSignal SW SDK (synchronous)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "dousell-immo-v19"; // Increment version
const STATIC_ASSETS = [
  "/gestion",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/offline.html",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event
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

// Fetch event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.includes("_next/static") ||
    event.request.url.includes("_next/image") ||
    event.request.url.includes("api/") ||
    url.pathname.startsWith("/locataire")
  ) {
    return;
  }

  const externalDomains = [
    "images.pexels.com",
    "images.unsplash.com",
    "plus.unsplash.com",
    "googleusercontent.com",
    "googletagmanager.com",
    "google-analytics.com",
    "basemaps.cartocdn.com",
    "openstreetmap.org",
    "supabase.co",
    "supabase.in",
    "cloudflare.com",
    "vercel-scripts.com",
    "gstatic.com",
    "translate.google.com",
    "translate.googleapis.com",
    "clarity.ms",
    "bing.com",
    "fonts.googleapis.com",
    "kkiapay.me",
    "rokt.com",
    "coinafrique.com",
    "onesignal.com",
    "cloudinary.com",
  ];

  const isExternalResource = externalDomains.some((domain) =>
    url.hostname.includes(domain)
  );

  if (isExternalResource) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
        throw new Error("Resource not found in cache");
      })
  );
});
