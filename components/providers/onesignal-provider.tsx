"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider({ userId }: { userId?: string }) {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const initOneSignal = async () => {
            console.log("🏁 OneSignalProvider: Initializing...");
            try {
                // Vérifier si OneSignal est déjà initialisé
                // @ts-ignore
                if (window.OneSignal && window.OneSignal.initialized) {
                    console.log("ℹ️ OneSignal already initialized");
                }

                await OneSignal.init({
                    appId: "a7fba1dc-348a-4ee5-9647-3e7253c13cb8",
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                    serviceWorkerPath: "/sw.js",
                    serviceWorkerParam: { scope: "/" },
                });

                console.log("✅ OneSignal Init Success");

                if (userId) {
                    console.log("👤 OneSignal: Attempting login for ID:", userId);
                    await OneSignal.login(userId);
                    console.log("✅ OneSignal: Login successful");
                }

                // Initial diagnostic logs
                const permission = OneSignal.Notifications.permission;
                const isPushSupported = OneSignal.Notifications.isPushSupported();
                console.log("📊 OneSignal Initial State:", { isPushSupported, permission });

                // Auto-prompt logic: trigger slidedown if not yet asked
                if (isPushSupported && !permission) {
                    console.log("👋 OneSignal: Permission not granted, showing slidedown in 3s...");
                    setTimeout(async () => {
                        try {
                            await OneSignal.Slidedown.promptPush({
                                force: true,
                            });
                            console.log("📣 OneSignal Slidedown prompted");
                        } catch (promptError) {
                            console.warn("⚠️ OneSignal Slidedown prompt failed:", promptError);
                        }
                    }, 3000);
                }

            } catch (error) {
                console.error("❌ OneSignal Detailed Error:", error);
            }
        };

        initOneSignal();
    }, [userId]);

    return null;
}
