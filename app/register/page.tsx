"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, signInWithGoogle } from "@/app/auth/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const digits = e.target.value.replace(/\D/g, "");
    // Limit to 9 digits
    const limited = digits.slice(0, 9);
    setPhoneValue(limited);
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        toast.error("Erreur lors de la connexion Google", {
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-white/70 hover:text-white"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:bg-white/10">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-bold text-white">Dousell Immo</h1>
            </Link>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Créer un compte
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Accédez aux meilleures offres de Dakar
            </p>
          </div>

          {/* Social Login */}
          <div className="mb-6 space-y-3">
            <form action={handleGoogleSignIn}>
              <Button
                type="submit"
                variant="secondary"
                disabled={isPending}
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isPending ? "Connexion..." : "Continuer avec Google"}
              </Button>
            </form>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl border border-white/20 bg-black text-white hover:bg-gray-900"
              onClick={() =>
                toast.info("Connexion sociale à venir", {
                  description: "La connexion avec Apple sera disponible prochainement",
                })
              }
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuer avec Apple
            </Button>
          </div>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/5 px-2 text-white/50">ou</span>
            </div>
          </div>

          {/* Form */}
          <form
            action={async (formData: FormData) => {
              setError(null);
              startTransition(async () => {
                const result = await signup(formData);
                if (result?.error) {
                  setError(result.error);
                  toast.error("Erreur lors de l'inscription", {
                    description: result.error,
                  });
                } else if (result?.success) {
                  if (result.emailSent) {
                    toast.success("Compte créé !", {
                      description: "Un email de vérification a été envoyé. Vérifiez votre boîte de réception (et les spams) pour confirmer votre compte.",
                      duration: 5000,
                    });
                    // Ne pas rediriger immédiatement si l'email de confirmation est requis
                    setTimeout(() => {
                      router.push("/login");
                    }, 3000);
                  } else {
                    toast.success("Compte créé avec succès !", {
                      description: result.message,
                    });
                    setTimeout(() => {
                      router.push("/compte");
                    }, 1500);
                  }
                }
              });
            }}
            className="space-y-4"
          >
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/70">
                Nom complet
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Oumar Diallo"
                  required
                  minLength={2}
                  maxLength={100}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="oumar@example.com"
                  required
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/70">
                Téléphone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <div className="absolute left-10 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm text-white/60">
                  <span>🇸🇳</span>
                  <span>+221</span>
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="77 123 45 67"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  required
                  pattern="[0-9]{9}"
                  minLength={9}
                  maxLength={9}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-20 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <p className="text-xs text-white/50">
                Entrez 9 chiffres (ex: 771234567)
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-white/50">
                Minimum 6 caractères
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="mt-6 h-12 w-full rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Inscription en cours...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>

          {/* Footer Link */}
          <p className="mt-6 text-center text-sm text-white/70">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
