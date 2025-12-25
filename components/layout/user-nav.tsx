"use client";

import { useRouter } from "next/navigation";
import { User, Home, Heart, LogOut, Calculator, Shield, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useState, useEffect } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function UserNav() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { roles: userRoles, loading: loadingRoles } = useUserRoles(user?.id || null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch avatar from profiles table and subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Fetch initial avatar
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchAvatar();

    // Subscribe to realtime updates for avatar changes
    const channel = supabase
      .channel(`profile-avatar-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "avatar_url" in payload.new) {
            setAvatarUrl((payload.new as { avatar_url: string | null }).avatar_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast.success("Déconnexion réussie");

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  // Si non connecté, afficher un bouton "Se connecter"
  if (!loading && !user) {
    return (
      <Button
        size="sm"
        className="rounded-2xl px-4 transition-all hover:scale-105 active:scale-95"
        onClick={() => router.push("/login")}
      >
        Se connecter
      </Button>
    );
  }

  // Si chargement, afficher un placeholder
  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
    );
  }

  // Si connecté, afficher le menu dropdown
  if (!user) return null;

  // Récupérer le nom d'affichage
  const displayName = 
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Utilisateur";
  
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Vérifier si l'utilisateur a un rôle (admin, moderateur, agent, superadmin)
  const isMainAdmin = user.email?.toLowerCase() === "barrymohamadou98@gmail.com".toLowerCase();
  const hasRole = (!loadingRoles && userRoles.length > 0) || isMainAdmin;
  
  // Déterminer le label selon le rôle le plus élevé
  const getAdminLabel = () => {
    if (userRoles.includes("superadmin")) return "Panel Admin (Super Admin)";
    if (userRoles.includes("admin")) return "Panel Admin";
    if (userRoles.includes("moderateur")) return "Panel Admin (Modérateur)";
    if (userRoles.includes("agent")) return "Panel Admin (Agent)";
    if (isMainAdmin) return "Panel Admin";
    return "Panel Admin";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 transition-all hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#05080c] text-white shadow-xl z-[100] md:z-[100]"
        align="end"
        sideOffset={8}
        side="bottom"
      >
        {/* Header avec animation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 30,
            delay: 0.05 
          }}
        >
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
        </motion.div>

        <DropdownMenuSeparator />

        {/* Items avec animation stagger */}
        <motion.div
          initial="closed"
          animate="open"
          variants={{
            open: {
              transition: { staggerChildren: 0.04, delayChildren: 0.1 }
            },
            closed: {
              transition: { staggerChildren: 0.02, staggerDirection: -1 }
            }
          }}
        >
          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/compte")}
            >
              <User className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Mon Profil
            </DropdownMenuItem>
          </motion.div>

          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/compte/mes-biens")}
            >
              <Home className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Mes Annonces
            </DropdownMenuItem>
          </motion.div>

          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/favoris")}
            >
              <Heart className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Favoris
            </DropdownMenuItem>
          </motion.div>

          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/a-propos")}
            >
              <Info className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              À propos
            </DropdownMenuItem>
          </motion.div>

          <DropdownMenuSeparator />

          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/estimation")}
            >
              <Calculator className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Estimation
            </DropdownMenuItem>
          </motion.div>

          {hasRole && (
            <motion.div
              variants={{
                open: { opacity: 1, x: 0 },
                closed: { opacity: 0, x: -8 }
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              <Shield className="mr-2 h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">{getAdminLabel()}</span>
            </DropdownMenuItem>
            </motion.div>
          )}

          <DropdownMenuSeparator />

          <motion.div
            variants={{
              open: { opacity: 1, x: 0 },
              closed: { opacity: 0, x: -8 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">Déconnexion</span>
            </DropdownMenuItem>
          </motion.div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

