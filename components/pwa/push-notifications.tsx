"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import OneSignal from "react-onesignal";

import { Button } from "@/components/ui/button";

export function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported(true); // OneSignal handles compatibility check internally usually

      // Check initial subscription state
      // Note: OneSignal.User.PushSubscription.optedIn is available in v16+
      // But react-onesignal wrapper might vary. 
      // Safe fallback check:
      const checkSubscription = async () => {
        try {
          const state = await OneSignal.User.PushSubscription.optedIn;
          setIsSubscribed(!!state);
        } catch (e) {
          console.log("OneSignal not ready yet");
        }
      };

      checkSubscription();

      // Listen for subscription changes if possible or polling
      // OneSignal.User.PushSubscription.addEventListener("change", ...)
    }
  }, []);

  const handleTogglePush = async () => {
    try {
      if (isSubscribed) {
        await OneSignal.User.PushSubscription.optOut();
        setIsSubscribed(false);
        toast.info("Notifications désactivées");
      } else {
        await OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true);
        toast.success("Notifications activées !");
      }
    } catch (error) {
      console.error("OneSignal error:", error);
      // Fallback: show prompt
      try {
        await OneSignal.Slidedown.promptPush();
      } catch (e) {
        toast.error("Impossible de modifier les paramètres de notification");
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  if (isSubscribed) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full border border-white/10 bg-white/5 text-white"
        onClick={handleTogglePush}
      >
        <Bell className="mr-2 h-4 w-4" />
        Notifications activées
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full border border-white/10 bg-white/5 text-white"
      onClick={handleTogglePush}
    >
      <BellOff className="mr-2 h-4 w-4" />
      Activer les notifications
    </Button>
  );
}
