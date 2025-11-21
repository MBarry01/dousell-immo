"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Mail, Lock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signInWithGoogle } from "@/app/auth/actions";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      <div className="w-full max-w-md">
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
              <h1 className="text-2xl font-bold text-white">Doussel Immo</h1>
            </Link>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Connexion
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Accédez à votre compte pour continuer
            </p>
          </div>

          {/* Google Login */}
          <form action={handleGoogleSignIn}>
            <Button
              type="submit"
              variant="secondary"
              disabled={isPending}
              className="mb-6 w-full rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
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

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/5 px-2 text-white/50">ou</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form
            action={async (formData: FormData) => {
              setError(null);
              startTransition(async () => {
                const result = await login(formData);
                if (result?.error) {
                  setError(result.error);
                  toast.error("Connexion impossible", {
                    description: result.error,
                  });
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-6 h-12 w-full rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-white/70">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Créer un compte
              </Link>
            </p>
            <p>
              <Link
                href="/login?admin=true"
                className="text-xs text-white/50 hover:text-white/70"
              >
                Accès admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
