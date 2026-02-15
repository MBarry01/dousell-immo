"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider({ userId }: { userId?: string }) {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: "a7fba1dc-348a-4ee5-9647-3e7253c13cb8",
                    // Permet de tester en local
                    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                    // Redirige vers notre SW existant qui gère le cache ET le push
                    serviceWorkerPath: "/sw.js",
                    serviceWorkerParam: { scope: "/" },
                });

                if (userId) {
                    await OneSignal.login(userId);
                }
            } catch (error) {
                console.error("OneSignal init error:", error);
            }
        };

        initOneSignal();
    }, []);

    return null;
}
