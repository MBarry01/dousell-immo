"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type UserRole = "admin" | "moderateur" | "agent" | "superadmin";

/**
 * Hook pour gérer les rôles utilisateur avec Supabase Realtime
 */
export function useUserRoles(userId: string | null) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!userId) {
      setRoles([]);
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
        console.warn("User not authenticated, skipping roles fetch");
        setRoles([]);
        setLoading(false);
        return;
      }

      // Récupérer les rôles de l'utilisateur
      // Essayer d'abord la fonction RPC (bypass RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_roles", {
        target_user_id: userId,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        // Si la fonction RPC existe et retourne des données (même si vide)
        const userRoles = rpcData as UserRole[];
        setRoles(userRoles);
        setError(null);
        setLoading(false);
        return;
      }

      // Si la fonction RPC n'existe pas, logger un avertissement
      if (rpcError && (rpcError.code === "42883" || rpcError.message?.includes("does not exist") || rpcError.message?.includes("function"))) {
        console.warn("⚠️ useUserRoles - Fonction RPC get_user_roles n'existe pas. Utilisation du fallback pour:", userId);
      } else if (rpcError) {
        console.warn("⚠️ useUserRoles - Erreur RPC get_user_roles:", rpcError);
      }

      // Fallback: Requête directe
      const { data, error: fetchError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (fetchError) {
        // Si la table n'existe pas encore, on ignore silencieusement
        if (
          fetchError.code === "PGRST116" || 
          fetchError.code === "42P01" ||
          fetchError.code === "PGRST301" ||
          fetchError.message?.includes("does not exist") ||
          fetchError.message?.includes("relation") ||
          fetchError.message?.includes("permission denied") ||
          fetchError.message?.includes("row-level security") ||
          Object.keys(fetchError).length === 0 // Erreur vide (probablement RLS)
        ) {
          // Si l'erreur est vide ou indique que la table n'existe pas, retourner un tableau vide
          console.warn("⚠️ user_roles table may not exist or RLS is blocking access. Error:", {
            code: fetchError.code,
            message: fetchError.message,
            keys: Object.keys(fetchError),
          });
          setRoles([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Pour les autres erreurs, logger mais ne pas bloquer
        console.warn("⚠️ Erreur lors de la récupération des rôles:", {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
        });
        setRoles([]);
        setError(null);
        setLoading(false);
        return;
      }

      const userRoles = (data?.map((r) => r.role as UserRole) || []) as UserRole[];
      setRoles(userRoles);
      setError(null);
    } catch (err) {
      console.error("Error fetching user roles:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Récupération initiale
    fetchRoles();

    // Configurer Supabase Realtime pour écouter les changements de rôles
    let channel: RealtimeChannel | null = null;
    let subscribed = false; // Utiliser une variable dans la portée du useEffect

    const setupRealtime = () => {
      try {
        const supabase = createClient();
        
        // S'abonner aux changements sur la table user_roles pour cet utilisateur
        channel = supabase
          .channel(`user_roles:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*", // INSERT, UPDATE, DELETE
              schema: "public",
              table: "user_roles",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              // Rafraîchir les rôles quand un changement est détecté
              fetchRoles();
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              subscribed = true;
              // Abonnement réussi - pas besoin de logger
            } else if (status === "CHANNEL_ERROR" && !subscribed) {
              // Ne logger l'erreur que si on n'a jamais réussi à s'abonner
              // (évite les faux positifs lors des états transitoires)
              console.warn("⚠️ Impossible de s'abonner aux changements de rôles. Realtime peut ne pas être activé pour la table user_roles.");
            }
          });
      } catch (err) {
        console.warn("Erreur lors de la configuration Realtime pour les rôles:", err);
        // Ne pas bloquer l'application si Realtime n'est pas disponible
      }
    };

    setupRealtime();

    // Nettoyer l'abonnement au démontage
    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles };
}

