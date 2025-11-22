"use client";

import { useRouter } from "next/navigation";
import { User, Home, Heart, LogOut, Calculator, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

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

  // Vérifier si l'utilisateur est admin
  const isAdmin = user.email?.toLowerCase() === "barrymohamadou98@gmail.com".toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 transition-all hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url as string} alt={displayName} />
            <AvatarFallback className="bg-amber-500/20 text-amber-400 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-xl border border-white/10 bg-[#05080c] text-white shadow-xl z-[100] md:z-[100]"
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
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
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

          {isAdmin && (
            <motion.div
              variants={{
                open: { opacity: 1, x: 0 },
                closed: { opacity: 0, x: -8 }
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/admin/dashboard")}
              >
                <Shield className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Administration
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
              <LogOut className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              Déconnexion
            </DropdownMenuItem>
          </motion.div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

