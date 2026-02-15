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
                    appId: "a7fba1dc-348a-4ee5-9647-3e7253c13cb8",
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
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
                console.log("📊 OneSignal State:", { isPushSupported, permission });

                if (isPushSupported && !permission) {
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
