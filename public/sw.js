// Killer Service Worker : Nettoyage radical de l'ancien cache PWA
self.addEventListener('install', (event) => {
    // Forcer l'installation immédiate
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[SW Killer] Suppression du cache :', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Prendre le contrôle immédiat, mais ne PAS forcer de reload (évite les boucles infinies avec DevTools)
            return self.clients.claim();
        })
    );
});

// On charge OneSignal pour ne pas briser les notifications
try {
    importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
    console.log('[SW Killer] OneSignal introuvable ou erreur réseau');
}
