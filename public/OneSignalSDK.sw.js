// 1. REGISTER LISTENERS IMMEDIATELY (Before any imports/logic)
self.onmessage = (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
};

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
