"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const lastRealtimeCheck = useRef<number>(Date.now());

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
        // Log détaillé pour les erreurs RLS
        if (fetchError.code === "42501" || fetchError.message?.includes("permission denied") || fetchError.message?.includes("policy")) {
          console.error("❌ Erreur RLS lors de la récupération des notifications:", {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            userId,
          });
        } else {
          console.error("❌ Erreur lors de la récupération des notifications:", fetchError);
        }
        throw fetchError;
      }

      const unread = data?.filter((n) => !n.is_read).length || 0;
      
      console.log("📬 Notifications récupérées:", {
        userId,
        total: data?.length || 0,
        unread,
        notifications: data?.map(n => ({ id: n.id, title: n.title, is_read: n.is_read }))
      });
      
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
        // Utiliser un debounce pour éviter trop de refetch
        let refetchTimeout: NodeJS.Timeout | null = null;
        const debouncedRefetch = () => {
          if (refetchTimeout) {
            clearTimeout(refetchTimeout);
          }
          refetchTimeout = setTimeout(() => {
            fetchNotifications();
          }, 500);
        };

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
              console.log("🔔 Nouvelle notification reçue via Realtime:", payload.new);
              // Ajouter la nouvelle notification en haut de la liste
              setNotifications((prev) => [payload.new as Notification, ...prev]);
              setUnreadCount((prev) => prev + 1);
              // Marquer que Realtime fonctionne
              lastRealtimeCheck.current = Date.now();
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
              // Mettre à jour la notification modifiée et recalculer le nombre de non lues en une seule opération
              setNotifications((prev) => {
                const updated = prev.map((n) =>
                  n.id === payload.new.id ? (payload.new as Notification) : n
                );
                // Recalculer le nombre de non lues
                const unread = updated.filter((n) => !n.is_read).length;
                setUnreadCount(unread);
                return updated;
              });
              
              // Si plusieurs notifications sont mises à jour en même temps (marquer toutes comme lues),
              // refetch pour s'assurer que tout est à jour
              debouncedRefetch();
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("✅ Abonné avec succès au canal Realtime pour les notifications");
            } else if (status === "CHANNEL_ERROR") {
              console.warn("⚠️ Erreur d'abonnement au canal Realtime. Realtime peut ne pas être activé.");
              console.warn("💡 Exécutez docs/fix-notifications-rls-idempotent.sql pour activer Realtime");
            } else if (status === "TIMED_OUT") {
              console.warn("⏱️ Timeout lors de l'abonnement Realtime. Utilisation du polling de fallback.");
            } else {
              console.log("📡 Statut Realtime:", status);
            }
          });
      } catch (err) {
        console.warn("Error setting up realtime subscription:", err);
        // Ne pas bloquer l'application si Realtime n'est pas disponible
      }
    };

    setupRealtime();

    // Fallback : Polling si Realtime échoue ou n'est pas disponible
    // Vérifier périodiquement si Realtime fonctionne, sinon utiliser polling
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) return; // Déjà en cours
      
      console.log("🔄 Démarrage du polling de fallback (toutes les 30 secondes)");
      pollingInterval = setInterval(() => {
        // Vérifier si Realtime a fonctionné récemment (dans les 60 dernières secondes)
        const timeSinceLastRealtime = Date.now() - lastRealtimeCheck.current;
        if (timeSinceLastRealtime > 60000) {
          // Realtime ne semble pas fonctionner, utiliser polling
          console.log("⚠️ Realtime inactif, utilisation du polling");
          fetchNotifications();
        }
      }, 30000); // Polling toutes les 30 secondes
    };

    // Démarrer le polling après 5 secondes (donner le temps à Realtime de se connecter)
    const pollingTimeout = setTimeout(() => {
      startPolling();
    }, 5000);

    // Nettoyer l'abonnement à la déconnexion
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
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

