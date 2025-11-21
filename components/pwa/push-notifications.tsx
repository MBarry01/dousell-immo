"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkSupport = () => {
        setIsSupported(
          "Notification" in window &&
            "serviceWorker" in navigator &&
            "PushManager" in window
        );
        setPermission(Notification.permission);
      };
      checkSupport();
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées sur ce navigateur");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        toast.success("Notifications activées !");
        // Register for push notifications
        await registerPushNotifications();
      } else if (permission === "denied") {
        toast.error("Notifications refusées. Activez-les dans les paramètres du navigateur.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Erreur lors de l'activation des notifications");
    }
  };

  const registerPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
          : undefined,
      });

      // TODO: Send subscription to server when endpoint is ready
      // const subscription = await registration.pushManager.subscribe({...});
      // await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription),
      // });
      toast.success("Abonnement aux notifications activé");
    } catch (error) {
      console.error("Error registering push notifications:", error);
      toast.error("Erreur lors de l'abonnement");
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return null;
  }

  if (permission === "granted") {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full border border-white/10 bg-white/5 text-white"
        disabled
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
      onClick={requestPermission}
    >
      <BellOff className="mr-2 h-4 w-4" />
      Activer les notifications
    </Button>
  );
}

