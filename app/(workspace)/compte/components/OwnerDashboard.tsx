"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDashboardStats } from "../actions";
import {
    Heart,
    Building2,
    Plus,
    Bell,
    User,
    ShieldCheck,
    LogOut,
    ArrowRight,
    Lock,
    LayoutDashboard,
    MessageSquare,
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
import { GestionLocativeWidget } from "./GestionLocativeWidget";
import { LegalAssistantWidget } from "./LegalAssistantWidget";
import { Skeleton } from "@/components/ui/skeleton";


interface OwnerDashboardProps {
    isTenant?: boolean;
    isOwner?: boolean;
    gestionLocativeEnabled?: boolean;
    gestionLocativeStatus?: string;
}

export function OwnerDashboard({ isTenant, isOwner, gestionLocativeEnabled, gestionLocativeStatus }: OwnerDashboardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { favorites } = useFavoritesStore();
    const { roles: userRoles, loading: rolesLoading } = useUserRoles(user?.id || null);
    const [stats, setStats] = useState({ activeLeases: 0, pendingPayments: 0, maintenanceRequests: 0 });

    useEffect(() => {
        async function loadStats() {
            if (user?.id) {
                const data = await getDashboardStats();
                setStats(data);
            }
        }
        loadStats();
    }, [user?.id]);

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
            <div className="space-y-8 py-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full border border-border" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton className="h-48 w-full rounded-xl border border-border" />
                    <Skeleton className="h-48 w-full rounded-xl border border-border" />
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Let middleware handle redirect
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
        <div className="px-4 py-4">
            <FadeIn className="space-y-6">
                {/* Header Utilisateur */}
                <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 shrink-0 border border-border">
                        <AvatarImage src={user.user_metadata?.avatar_url as string} alt={displayName} />
                        <AvatarFallback className="bg-muted text-foreground text-lg font-semibold border border-border">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        {/* Ligne du nom + bouton déconnexion */}
                        <div className="flex items-center justify-between gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
                                Bonjour, {firstName}
                            </h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
                                onClick={handleSignOut}
                                title="Déconnexion"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Badges des rôles */}
                        {!rolesLoading && userRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {userRoles.map((role) => {
                                    return (
                                        <Badge
                                            key={role}
                                            className={`text-xs shrink-0 ${ROLE_COLORS[role] || "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80"}`}
                                        >
                                            {ROLE_LABELS[role] || role}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* Email */}
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                            {user.email}
                        </p>
                    </div>
                </div>


                {/* Widgets Premium (Propriétaires OU Gestion Locative activée) */}
                {(isOwner || gestionLocativeEnabled) && (
                    <div className="grid grid-cols-1 gap-5 md:gap-4 md:grid-cols-2">
                        <GestionLocativeWidget {...stats} />
                        <LegalAssistantWidget />
                    </div>
                )}

                {/* Bento Grid */}
                <div className="grid grid-cols-1 gap-5 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Card 0: Espace Locataire (Si Dual Role) */}
                    {isTenant && (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="col-span-full md:col-span-2 lg:col-span-1 border-2 border-primary/20 rounded-xl overflow-hidden"
                        >
                            <Link href="/portal">
                                <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-full bg-primary/20">
                                                <User className="h-6 w-6 shrink-0 text-primary stroke-[2]" />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-foreground">
                                                Espace Locataire
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            Accédez à votre bail, vos quittances et payez votre loyer.
                                        </CardDescription>
                                        <div className="mt-4 flex items-center text-sm font-medium text-primary">
                                            Accéder au portail
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    )}

                    {/* Card: Activer Gestion Locative (Pour non-propriétaires non activés) */}
                    {!isOwner && !gestionLocativeEnabled && (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`col-span-full md:col-span-2 lg:col-span-1 border-2 rounded-xl overflow-hidden ${gestionLocativeStatus === 'pending'
                                ? 'border-amber-500/30'
                                : 'border-amber-500/20'
                                }`}
                        >
                            <Link href="/compte/activer-gestion">
                                <Card className={`h-full cursor-pointer border-border transition-all ${gestionLocativeStatus === 'pending'
                                    ? 'bg-amber-500/5'
                                    : 'bg-card hover:bg-amber-500/5'
                                    }`}>
                                    <CardHeader className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`p-2 rounded-full ${gestionLocativeStatus === 'pending'
                                                ? 'bg-amber-500/10'
                                                : 'bg-amber-500/20'
                                                }`}>
                                                <Building2 className={`h-6 w-6 shrink-0 stroke-[2] ${gestionLocativeStatus === 'pending'
                                                    ? 'text-amber-500/70'
                                                    : 'text-amber-500'
                                                    }`} />
                                            </div>
                                            <CardTitle className="text-lg font-bold text-foreground">
                                                {gestionLocativeStatus === 'pending'
                                                    ? 'Demande en cours...'
                                                    : 'Activer Gestion Locative'}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            {gestionLocativeStatus === 'pending'
                                                ? 'Votre demande est en cours de vérification par notre équipe.'
                                                : 'Gérez vos biens en location sans publier d\'annonce.'}
                                        </CardDescription>
                                        {gestionLocativeStatus !== 'pending' && (
                                            <div className="mt-4 flex items-center text-sm font-medium text-amber-500">
                                                Commencer
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </div>
                                        )}
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    )}


                    {/* Card 1: Mes Favoris */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <Link href="/favoris">
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Heart className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                            <CardTitle className="text-lg font-semibold text-foreground">
                                                Mes Favoris
                                            </CardTitle>
                                        </div>
                                        {favorites.length > 0 && (
                                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-2 text-xs font-medium text-accent-foreground">
                                                {favorites.length > 9 ? "9+" : favorites.length}
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
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
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Building2 className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Gérer mes biens
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Suivez vos annonces en ligne et leurs stats.
                                    </CardDescription>
                                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
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
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Plus className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Louer ou Vendre
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
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
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Bell className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Mes Alertes
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Soyez notifié des nouveaux biens.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </motion.div>

                    {/* Card 5: Mes Documents (Digital Safe) */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <Link href="/compte/mes-documents">
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Lock className="h-6 w-6 shrink-0 text-primary stroke-[1.5]" />
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Mes Documents
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Coffre-fort numérique ultra-sécurisé (AES-256).
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </motion.div>

                    {/* Card 6: Profil & Sécurité */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <Link href="/compte/parametres">
                            <Card className="h-full cursor-pointer bg-card border-border transition-all hover:bg-accent/50 hover:border-primary/50">
                                <CardHeader className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <User className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                        <CardTitle className="text-lg font-semibold text-foreground">
                                            Profil & Sécurité
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground">
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
                                <Card className="cursor-pointer border border-border bg-card transition-all hover:border-primary/50 hover:bg-accent/50">
                                    <CardHeader className="p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                <ShieldCheck className="h-6 w-6 shrink-0 text-foreground stroke-[1.5]" />
                                                <div className="min-w-0">
                                                    <CardTitle className="text-lg font-semibold text-foreground">
                                                        Espace Administration
                                                    </CardTitle>
                                                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                                                        {userRoles.length > 0
                                                            ? `Accédez au panel admin avec vos rôles: ${userRoles.map((r) => ROLE_LABELS[r] || r).join(", ")}`
                                                            : "Modération, Utilisateurs, Statistiques."}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0 border-border bg-background text-foreground hover:bg-accent w-full sm:w-auto"
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
