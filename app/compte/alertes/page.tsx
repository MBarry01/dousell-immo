"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, ArrowLeft, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { NotificationBell } from "@/components/layout/notification-bell";

export default function AlertesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-zinc-400">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-6 py-6">
      <FadeIn>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/compte">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Mes Alertes</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Gérez vos notifications et alertes
            </p>
          </div>
        </div>

        {/* Notifications */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-zinc-400">
                  Consultez vos notifications récentes
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell userId={user.id} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">
                Vos notifications apparaîtront ici
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Activez les notifications pour être alerté des nouveaux biens
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres d'alertes */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Paramètres d'alertes</CardTitle>
            <CardDescription className="text-zinc-400">
              Configurez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <p className="text-sm font-medium text-white">Nouveaux biens</p>
                <p className="text-xs text-zinc-400">
                  Recevez une notification pour chaque nouveau bien publié
                </p>
              </div>
              <Settings className="h-5 w-5 text-zinc-500" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <p className="text-sm font-medium text-white">Mises à jour de vos annonces</p>
                <p className="text-xs text-zinc-400">
                  Alertes sur l'état de vos biens déposés
                </p>
              </div>
              <Settings className="h-5 w-5 text-zinc-500" />
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

