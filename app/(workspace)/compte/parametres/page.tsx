"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, ArrowLeft, Camera, Trash2, Upload, Phone } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

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
import { resetPassword } from "@/app/(vitrine)/auth/actions";
import { updateAvatar, deleteAvatar } from "./actions";
import { FadeIn } from "@/components/ui/motion-wrapper";
import Link from "next/link";
import { PushNotifications } from "@/components/pwa/push-notifications";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_identity_verified: boolean;
};

export default function ParametresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, is_identity_verified")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  const refetchProfile = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, is_identity_verified")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format non supporté", {
        description: "Utilisez JPG, PNG ou WebP",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux", {
        description: "Taille maximale : 5MB",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Aucun fichier sélectionné");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", fileInputRef.current.files[0]);

      const result = await updateAvatar(formData);

      if (result.success) {
        toast.success("Avatar mis à jour avec succès");
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetchProfile();
      } else {
        toast.error("Erreur lors de la mise à jour", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre avatar ?")) {
      return;
    }

    setIsDeletingAvatar(true);
    try {
      const result = await deleteAvatar();

      if (result.success) {
        toast.success("Avatar supprimé avec succès");
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetchProfile();
      } else {
        toast.error("Erreur lors de la suppression", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleCancelPreview = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="px-4 py-4">
      <FadeIn className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/compte">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profil & Sécurité</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>

        {/* Avatar Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-foreground">Photo de profil</CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              Personnalisez votre avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Display */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Aperçu avatar"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar actuel"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <UserIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                  disabled={isUploadingAvatar || isDeletingAvatar}
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>

              {/* Avatar Actions */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    JPG, PNG ou WebP. Max 5MB.
                  </p>
                </div>

                {avatarPreview ? (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Button
                      onClick={handleUploadAvatar}
                      disabled={isUploadingAvatar}
                      className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingAvatar ? "Upload..." : "Enregistrer"}
                    </Button>
                    <Button
                      onClick={handleCancelPreview}
                      variant="outline"
                      disabled={isUploadingAvatar}
                      className="flex-1 sm:flex-none border-border bg-background text-foreground hover:bg-accent text-xs sm:text-sm"
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      disabled={isUploadingAvatar || isDeletingAvatar}
                      className="flex-1 sm:flex-none border-border bg-background text-foreground hover:bg-accent text-xs sm:text-sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir une photo
                    </Button>
                    {profile?.avatar_url && (
                      <Button
                        onClick={handleDeleteAvatar}
                        variant="outline"
                        disabled={isUploadingAvatar || isDeletingAvatar}
                        className="flex-1 sm:flex-none border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs sm:text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeletingAvatar ? "Suppr..." : "Supprimer"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations du compte */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informations du compte</CardTitle>
            <CardDescription className="text-muted-foreground">
              Vos informations de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={user.email || ""}
                  disabled
                  className="bg-muted/50 border-input text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Nom complet</Label>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={(user.user_metadata?.full_name as string) || ""}
                  disabled
                  className="bg-muted/50 border-input text-muted-foreground"
                  placeholder="Non renseigné"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mot de passe */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Sécurité</CardTitle>
            <CardDescription className="text-muted-foreground">
              Gérez votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isResettingPassword ? (
              <>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Mot de passe</p>
                    <p className="text-xs text-muted-foreground">
                      Dernière modification : Non disponible
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border bg-background text-foreground hover:bg-accent hover:border-accent"
                  onClick={() => setIsResettingPassword(true)}
                >
                  Changer le mot de passe
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Email de réinitialisation</Label>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={user.email || "votre@email.com"}
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-border bg-background text-foreground hover:bg-accent"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setResetEmail("");
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
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
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Notifications</CardTitle>
            <CardDescription className="text-muted-foreground">
              Gérez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotifications />
          </CardContent>
        </Card>
      </FadeIn>
    </div >
  );
}


