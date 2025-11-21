"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { resetPassword } from "@/app/auth/actions";
import { FadeIn } from "@/components/ui/motion-wrapper";
import Link from "next/link";
import { PushNotifications } from "@/components/pwa/push-notifications";

export default function ParametresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }
    try {
      const result = await resetPassword(resetEmail);
      if (result?.error) {
        toast.error("Erreur lors de l'envoi de l'email", {
          description: result.error,
        });
      } else {
        toast.success("Email de réinitialisation envoyé");
        setIsResettingPassword(false);
        setResetEmail("");
      }
    } catch {
      toast.error("Erreur lors de l'envoi de l'email");
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
            <h1 className="text-2xl font-bold text-white">Profil & Sécurité</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>

        {/* Informations du compte */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Informations du compte</CardTitle>
            <CardDescription className="text-zinc-400">
              Vos informations de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-500" />
                <Input
                  value={user.email || ""}
                  disabled
                  className="bg-zinc-900 border-zinc-800 text-zinc-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Nom complet</Label>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-zinc-500" />
                <Input
                  value={(user.user_metadata?.full_name as string) || ""}
                  disabled
                  className="bg-zinc-900 border-zinc-800 text-zinc-400"
                  placeholder="Non renseigné"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mot de passe */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Sécurité</CardTitle>
            <CardDescription className="text-zinc-400">
              Gérez votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isResettingPassword ? (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-zinc-500" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">Mot de passe</p>
                    <p className="text-xs text-zinc-500">
                      Dernière modification : Non disponible
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-700"
                  onClick={() => setIsResettingPassword(true)}
                >
                  Changer le mot de passe
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email de réinitialisation</Label>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={user.email || "votre@email.com"}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-800 bg-transparent text-white hover:bg-zinc-900 hover:border-zinc-700"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setResetEmail("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-white text-black hover:bg-zinc-100"
                    onClick={handleResetPassword}
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Notifications</CardTitle>
            <CardDescription className="text-zinc-400">
              Gérez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotifications />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

