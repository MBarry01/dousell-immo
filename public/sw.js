importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Service Worker for Dousell Immo PWA

const CACHE_NAME = "dousell-immo-v10";
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

// Allow the app to trigger skipWaiting on update (helps PWA update reliability)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // skipWaiting is triggered by the client via SKIP_WAITING message
  // to avoid breaking active tabs with stale cache
});

// Activate event - clean old caches
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





// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip chrome extensions, Next.js static files, API routes, image optimization, and tenant portal
  // /locataire is a separate auth context (cookie-based magic link) and must
  // never be intercepted by the PWA service worker
  // /_next/image is Next.js image optimization endpoint - let browser handle it
  if (
    event.request.url.startsWith("chrome-extension://") ||
    event.request.url.includes("_next/static") ||
    event.request.url.includes("_next/image") ||
    event.request.url.includes("api/") ||
    url.pathname.startsWith("/locataire")
  ) {
    return;
  }

  // Liste des domaines externes à ne JAMAIS cacher (let browser handle them directly)
  // Cela évite les violations CSP et réduit la taille du cache
  const externalDomains = [
    "images.pexels.com",
    "images.unsplash.com",
    "plus.unsplash.com",
    "googleusercontent.com",    // Couvrira lh3.googleusercontent.com, etc.
    "googletagmanager.com",     // Google Tag Manager / Analytics
    "google-analytics.com",     // Google Analytics
    "basemaps.cartocdn.com",    // Tuiles de carte
    "openstreetmap.org",        // Tuiles de carte
    "supabase.co",              // Backend Supabase
    "supabase.in",              // Backend Supabase
    "cloudflare.com",           // Cloudflare Turnstile
    "vercel-scripts.com",       // Scripts Vercel Analytics
    "gstatic.com",              // Google Translate styles/fonts
    "translate.google.com",     // Google Translate API
    "translate.googleapis.com", // Google Translate API
    "clarity.ms",               // Microsoft Clarity
    "bing.com",                 // Bing/Clarity
    "fonts.googleapis.com",     // Google Fonts
    "kkiapay.me",               // Kkiapay payment
    "rokt.com",                 // Rokt (extension ads)
    "coinafrique.com",          // Images externes CoinAfrique
  ];

  // Vérifie si l'URL contient un des domaines externes
  const isExternalResource = externalDomains.some((domain) =>
    url.hostname.includes(domain)
  );

  // Pour les ressources externes, laisser le navigateur gérer directement
  // Ne PAS intercepter avec le service worker
  if (isExternalResource) {
    return; // Le navigateur gère la requête normalement
  }

  // Pour les ressources internes uniquement : stratégie network-first avec cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Seulement cacher les réponses réussies
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Échec réseau, essayer le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si pas de cache, retourner la page offline pour les requêtes de navigation
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
      })
  );
});
