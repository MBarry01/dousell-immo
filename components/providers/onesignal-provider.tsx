"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

// Singleton state to track initialization across the entire application
let isOneSignalInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Programmatic OneSignal initialization
 */
export const initOneSignal = async () => {
    if (typeof window === "undefined") return;
    if (isOneSignalInitialized) return;
    if (initializationPromise) return initializationPromise;

    console.log("🏁 OneSignal: Starting Singleton Initialization...");

    initializationPromise = (async () => {
        try {
            await OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
                allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                // IMPORTANT: Explicitly point to our custom SW which imports OneSignalSDK
                // This fixes the "Event handler of 'message' event must be added on the initial evaluation" error
                serviceWorkerPath: "/sw.js",
                serviceWorkerParam: { scope: "/" },
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

            isOneSignalInitialized = true;
            console.log("✅ OneSignal: Singleton Init Success");

            // Check and log state
            const permission = OneSignal.Notifications.permission;
            const isPushEnabled = OneSignal.User.PushSubscription.optedIn;
            const nativePermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

            console.log("📊 OneSignal Init State:", { permission, nativePermission, isPushEnabled });

            // Auto-opt-in if permission is granted but subscription is lost
            if (permission && !isPushEnabled) {
                console.log("🔄 OneSignal: Re-subscribing...");
                await OneSignal.User.PushSubscription.optIn().catch(e => console.warn("OptIn error:", e));
            }

        } catch (error) {
            console.error("❌ OneSignal: Initialization Failed:", error);
            initializationPromise = null; // Allow retry on failure
        }
    })();

    return initializationPromise;
};

/**
 * Programmatic OneSignal login
 */
export const loginOneSignal = async (userId: string) => {
    if (!userId) return;

    // Ensure initialized first
    await initOneSignal();

    if (isOneSignalInitialized) {
        console.log("👤 OneSignal: Syncing login for ID:", userId);
        try {
            await OneSignal.login(userId);
            console.log("✅ OneSignal: Login successful");
        } catch (error) {
            console.error("❌ OneSignal: Login failed:", error);
        }
    }
};

export default function OneSignalProvider({ userId }: { userId?: string }) {
    const lastUserId = useRef<string | undefined>(userId);

    useEffect(() => {
        // Initial init on mount
        initOneSignal();

        // Sync login if userId changes or is present
        if (userId) {
            loginOneSignal(userId);
        }
    }, [userId]);

    return null;
}
