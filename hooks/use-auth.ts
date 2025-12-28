"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const supabase = createClient();

        // Get initial session (getSession() est plus silencieux que getUser() pour les utilisateurs non connectés)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (mounted) {
          if (sessionError) {
            // Log seulement les vraies erreurs (pas les sessions manquantes)
            const isSessionMissing = sessionError.message?.includes("session") || 
                                     sessionError.name === "AuthSessionMissingError";
            if (!isSessionMissing) {
              console.error("Error getting session:", sessionError);
            }
            setUser(null);
          } else {
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }

        // Listen for auth changes
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });

        subscription = authSubscription;
      } catch (error) {
        // Ignorer silencieusement les erreurs de session manquante
        const isSessionMissing = (error as Error)?.message?.includes("session") ||
                                 (error as { name?: string })?.name === "AuthSessionMissingError";
        
        if (!isSessionMissing) {
          // Log seulement les vraies erreurs (problème de configuration, réseau, etc.)
          console.error("Error initializing auth:", error);
        }
        
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return { user, loading };
}

