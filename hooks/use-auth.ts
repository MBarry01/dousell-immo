"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const handleAuth = (session: any) => {
      if (!mounted) return;
      const newUser = session?.user ?? null;

      setUser(prev => {
        // Identity check to avoid redundant re-renders
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });

      setLoading(false);
    };

    // 1. Initial State Check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        const isMissing = error.message?.includes("session") || error.name === "AuthSessionMissingError";
        if (!isMissing) console.error("Session check error:", error);
        handleAuth(null);
      } else {
        handleAuth(session);
      }
    }).catch(() => handleAuth(null));

    // 2. Continuous Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

