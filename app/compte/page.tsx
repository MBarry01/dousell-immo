"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Building2,
  Plus,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/utils/supabase/client";
import { useFavoritesStore } from "@/store/use-store";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { useUserRoles } from "@/hooks/use-user-roles";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, ROLE_LABELS } from "@/config/roles";

export default function ComptePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { favorites } = useFavoritesStore();
  const { roles: userRoles, loading: rolesLoading } = useUserRoles(user?.id || null);

  // Check if user is admin (email fallback) or has any role
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isMainAdmin = adminEmail && user?.email?.toLowerCase() === adminEmail.toLowerCase();
  const hasRole = userRoles.length > 0 || isMainAdmin;

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
      console.error("Sign out error:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-zinc-400">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-8 py-6">
        <FadeIn>
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-white">
                Espace client
              </h1>
              <p className="mt-2 text-zinc-400">
                Connectez-vous pour accéder à votre compte
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <Button
                className="w-full rounded-xl bg-white text-black hover:bg-zinc-100"
                onClick={() => router.push("/login")}
              >
                Se connecter
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-700"
                onClick={() => router.push("/register")}
              >
                Créer un compte
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  // Récupérer le prénom
  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Utilisateur";

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

  return (
    <div className="space-y-8 py-6">
      <FadeIn>
        {/* Header Utilisateur */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-zinc-800">
              <AvatarImage src={user.user_metadata?.avatar_url as string} alt={displayName} />
              <AvatarFallback className="bg-zinc-900 text-zinc-100 text-lg font-semibold border border-zinc-800">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  Bonjour, {firstName}
                </h1>
                {!rolesLoading && userRoles.length > 0 && (
                  <div className="flex gap-1.5">
                    {userRoles.map((role) => {
                      return (
                        <Badge
                          key={role}
                          className={`text-xs ${ROLE_COLORS[role] || "bg-white/10 text-white/80"}`}
                        >
                          {ROLE_LABELS[role] || role}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {user.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Mes Favoris */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link href="/favoris">
              <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-900 hover:border-zinc-700">
                <CardHeader className="p-6">
                  <div className="mb-4">
                    <Heart className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-white">
                      Mes Favoris
                    </CardTitle>
                    {favorites.length > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-800 px-2 text-xs font-medium text-zinc-300">
                        {favorites.length > 9 ? "9+" : favorites.length}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-sm text-zinc-400">
                    Retrouvez vos biens sauvegardés.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          {/* Card 2: Gérer mes biens */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link href="/compte/mes-biens">
              <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-900 hover:border-zinc-700">
                <CardHeader className="p-6">
                  <div className="mb-4">
                    <Building2 className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Gérer mes biens
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-zinc-400">
                    Suivez vos annonces en ligne et leurs stats.
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm text-zinc-300">
                    Voir tout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          {/* Card 3: Louer/Vendre */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link href="/compte/deposer">
              <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-900 hover:border-zinc-700">
                <CardHeader className="p-6">
                  <div className="mb-4">
                    <Plus className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Louer ou Vendre
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-zinc-400">
                    Créez une nouvelle annonce en 2 minutes.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          {/* Card 4: Mes Alertes */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link href="/compte/alertes">
              <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-900 hover:border-zinc-700">
                <CardHeader className="p-6">
                  <div className="mb-4">
                    <Bell className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Mes Alertes
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-zinc-400">
                    Soyez notifié des nouveaux biens.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          {/* Card 5: Profil & Sécurité */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Link href="/compte/parametres">
              <Card className="h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:bg-zinc-900 hover:border-zinc-700">
                <CardHeader className="p-6">
                  <div className="mb-4">
                    <User className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-white">
                    Profil & Sécurité
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm text-zinc-400">
                    Modifier mes infos personnelles.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Section Admin (Conditionnelle) - Afficher pour tous les utilisateurs avec un rôle */}
        {!rolesLoading && hasRole && (
          <FadeIn delay={0.2}>
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="col-span-full"
            >
              <Link href="/admin">
                <Card className="cursor-pointer border border-amber-900/30 bg-black transition-all hover:border-amber-900/50">
                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ShieldCheck className="h-6 w-6 text-zinc-100 stroke-[1.5]" />
                        <div>
                          <CardTitle className="text-lg font-semibold text-white">
                            Espace Administration
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm text-zinc-500">
                            {userRoles.length > 0
                              ? `Accédez au panel admin avec vos rôles: ${userRoles.map((r) => ROLE_LABELS[r] || r).join(", ")}`
                              : "Modération, Utilisateurs, Statistiques."}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-700"
                      >
                        Accéder
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </FadeIn>
        )}
      </FadeIn>
    </div>
  );
}
