"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider({ userId }: { userId?: string }) {
    const isInitialized = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const initOneSignal = async () => {
            if (isInitialized.current) {
                if (userId) {
                    console.log("👤 OneSignal: Syncing login for ID:", userId);
                    await OneSignal.login(userId);
                }
                return;
            }

            console.log("🏁 OneSignalProvider: Initializing...");
            try {
                await OneSignal.init({
                    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                    serviceWorkerParam: { scope: "/" },
                    serviceWorkerPath: "/OneSignalSDKWorker.js",
                    promptOptions: {
                        slidedown: {
                            prompts: [
                                {
                                    type: "push",
                                    autoPrompt: false,
                                    text: {
                                        actionMessage: "Activez les notifications pour être alerté des paiements, messages et mises à jour de vos biens. Désactivable à tout moment.",
                                        acceptButton: "Activer",
                                        cancelButton: "Plus tard",
                                    },
                                    delay: {
                                        pageViews: 1,
                                        timeDelay: 5,
                                    }
                                }
                            ]
                        }
                    }
                });

                isInitialized.current = true;
                console.log("✅ OneSignal Init Success");

                if (userId) {
                    console.log("👤 OneSignal: Attempting login for ID:", userId);
                    await OneSignal.login(userId);
                }

                // Check state
                const permission = OneSignal.Notifications.permission;
                const isPushSupported = OneSignal.Notifications.isPushSupported();
                const nativePermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

                console.log("📊 OneSignal State:", { isPushSupported, permission, nativePermission });

                if (isPushSupported && !permission) {
                    if (nativePermission === 'denied') {
                        console.warn("🚫 OneSignal: Browser permission is 'denied'. User must reset it in site settings.");
                        return;
                    }

                    setTimeout(async () => {
                        console.log("👋 OneSignal: Permission not granted, showing slidedown...");
                        try {
                            await OneSignal.Slidedown.promptPush({ force: true });
                        } catch (e) {
                            console.warn("OneSignal prompt error:", e);
                        }
                    }, 5000);
                }

            } catch (error) {
                console.error("❌ OneSignal Detailed Error:", error);
            }
        };

        initOneSignal();
    }, [userId]);

    return null;
}
