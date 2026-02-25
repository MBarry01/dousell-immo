// 1. REGISTER LISTENERS IMMEDIATELY (Before any imports/logic)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener('push', (event) => {
    console.debug('[OneSignalUpdater] Push event reserved.');
});

self.addEventListener('notificationclick', (event) => {
    console.debug('[OneSignalUpdater] Notification click reserved.');
});

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
