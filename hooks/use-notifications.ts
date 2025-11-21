"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  resource_path: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * Hook pour gérer les notifications avec Supabase Realtime
 */
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Vérifier que l'utilisateur est bien authentifié
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn("User not authenticated, skipping notifications fetch");
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Récupérer les notifications (les plus récentes en premier)
      console.log("🔍 Récupération des notifications pour userId:", userId);
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        // Si la table n'existe pas encore (migration non appliquée), on ignore silencieusement
        if (fetchError.code === "PGRST116" || fetchError.message?.includes("does not exist")) {
          console.warn("⚠️ Notifications table does not exist yet. Please run the migration.");
          setNotifications([]);
          setUnreadCount(0);
          setError(null);
          return;
        }
        console.error("❌ Erreur lors de la récupération des notifications:", fetchError);
        throw fetchError;
      }

      console.log("✅ Notifications récupérées:", data?.length || 0, "notifications");
      const unread = data?.filter((n) => !n.is_read).length || 0;
      console.log("📊 Notifications non lues:", unread);
      
      setNotifications(data || []);
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      // Améliorer le message d'erreur
      let errorMessage = "Erreur lors du chargement";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String(err.message);
      } else if (err && typeof err === "object" && "code" in err) {
        errorMessage = `Erreur ${err.code}`;
      }
      setError(errorMessage);
      // En cas d'erreur, on initialise avec des valeurs vides plutôt que de bloquer
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Charger les notifications initiales
    fetchNotifications();

    // Configurer Supabase Realtime pour écouter les nouvelles notifications
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const setupRealtime = () => {
      try {
        channel = supabase
          .channel(`notifications:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              // Ajouter la nouvelle notification en haut de la liste
              setNotifications((prev) => [payload.new as Notification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              // Mettre à jour la notification modifiée
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id ? (payload.new as Notification) : n
                )
              );
              // Recalculer le nombre de non lues
              setNotifications((current) => {
                const unread = current.filter((n) => !n.is_read).length;
                setUnreadCount(unread);
                return current;
              });
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Subscribed to notifications channel");
            } else if (status === "CHANNEL_ERROR") {
              console.warn("Could not subscribe to notifications channel. Realtime may not be enabled.");
            }
          });
      } catch (err) {
        console.warn("Error setting up realtime subscription:", err);
        // Ne pas bloquer l'application si Realtime n'est pas disponible
      }
    };

    setupRealtime();

    // Nettoyer l'abonnement à la déconnexion
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
  };
}

