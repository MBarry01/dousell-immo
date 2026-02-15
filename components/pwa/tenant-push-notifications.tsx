"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import OneSignal from "react-onesignal";

import { Button } from "@/components/ui/button";

export function TenantPushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkSubscription = async () => {
        try {
          const state = await OneSignal.User.PushSubscription.optedIn;
          setIsSubscribed(!!state);
        } catch (e) {
          // OneSignal might not be ready
        }
      };

      checkSubscription();
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      await OneSignal.User.PushSubscription.optIn();
      setIsSubscribed(true);
    } catch (error) {
      console.error("OneSignal subscription error:", error);
      // Fallback
      try {
        await OneSignal.Slidedown.promptPush();
      } catch (e) {
        // ignore
      }
    }
  };

  if (isSubscribed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-500 hover:text-slate-900"
        disabled
      >
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-slate-500 hover:text-slate-900"
      onClick={handleSubscribe}
      title="Activer les notifications"
    >
      <BellOff className="h-4 w-4" />
    </Button>
  );
}
