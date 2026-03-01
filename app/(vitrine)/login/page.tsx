"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha } from "@/components/ui/captcha";
import { login, determinePostLoginRedirect } from "@/app/(vitrine)/auth/actions";

function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Lire le paramètre redirect explicite de l'URL
  const explicitRedirect = searchParams.get("redirect");

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (!loading && user) {
      toast.success("Vous êtes déjà connecté");
      router.push(explicitRedirect || "/gestion");
    }
  }, [user, loading, router, explicitRedirect]);

  const handleGoogleSignIn = () => {
    // Utiliser une route API pour Google OAuth avec le redirect explicite si présent
    const googleUrl = explicitRedirect
      ? `/auth/google?next=${encodeURIComponent(explicitRedirect)}`
      : "/auth/google";
    window.location.href = googleUrl;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#05080c] text-white">
      {/* Côté Gauche : Formulaire (Scrollable) */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col items-center justify-start py-12 px-4 lg:px-12 xl:px-24">
        {/* Decorative elements (limited to form side) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-8 my-auto">
          {/* Back Button */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/5"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>

          {/* Card */}
          <div className="w-full space-y-8 relative group">

            {/* Header */}
            <div className="mb-10 text-center">
              <Link href="/" className="inline-block mb-6 lg:hidden">
                <Image
                  src="/Logo.svg"
                  alt="Dousel"
                  width={160}
                  height={48}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Connexion
              </h1>
              <p className="mt-3 text-sm text-white/50">
                Heureux de vous revoir ! Accédez à votre espace.
              </p>
            </div>

            {/* Form and Social */}
            <div className="space-y-6">
              {/* Google Login */}
              <form action={handleGoogleSignIn}>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isPending}
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all duration-300 shadow-sm"
                >
                  <svg
                    className="mr-3 h-5 w-5"
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
                  Continuer avec Google
                </Button>
              </form>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0b1018] px-4 text-white/30">ou par email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form
                action={async (formData: FormData) => {
                  setError(null);
                  if (!captchaToken) {
                    toast.error("Veuillez compléter la vérification anti-robot");
                    return;
                  }
                  formData.append("turnstileToken", captchaToken);
                  startTransition(async () => {
                    const result = await login(formData);
                    if (result?.error) {
                      setError(result.error);
                      toast.error(result.error);
                    } else if (result?.success) {
                      toast.success("Connexion réussie !");
                      if (explicitRedirect) {
                        window.location.href = explicitRedirect;
                      } else {
                        const { redirectPath } = await determinePostLoginRedirect(explicitRedirect || undefined);
                        window.location.href = redirectPath;
                      }
                    }
                  });
                }}
                className="space-y-4"
              >
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/70">
                    Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                      className="h-12 w-full rounded-xl border-white/5 bg-white/[0.03] pl-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-white/70">
                      Mot de passe
                    </Label>
                    <Link
                      href={explicitRedirect ? `/reset-password?redirect=${encodeURIComponent(explicitRedirect)}` : "/reset-password"}
                      className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
                    >
                      Oublié ?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-12 w-full rounded-xl border-white/5 bg-white/[0.03] pl-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <Captcha
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />

                <Button
                  type="submit"
                  disabled={isPending || !captchaToken}
                  className="h-12 w-full rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 mt-4"
                >
                  {isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="pt-6 text-center border-t border-white/5">
                <p className="text-sm text-white/40">
                  Pas encore de compte ?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                  >
                    S'inscrire
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Côté Droit : Panel Branding (Fixed Asset) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 h-full overflow-hidden bg-[#0A0F16]">
        {/* Background Image - Faded Deco */}
        <div className="absolute inset-0 z-0 opacity-[0.14] pointer-events-none overflow-hidden">
          <Image
            src="/images/assetSignup.png"
            alt="bg"
            fill
            className="object-cover opacity-20"
            priority
          />
          {/* Blend Gradients */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0A0F16] to-transparent" />
          <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#0A0F16] to-transparent" />
        </div>

        {/* Background Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[150px]" />
          <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <div className="mb-12 p-5 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-700">
            <Image
              src="/Logo.svg"
              alt="Dousel"
              width={240}
              height={72}
              className="h-20 w-auto"
              priority
            />
          </div>

          <h2 className="text-5xl font-extrabold tracking-tight text-white mb-8 leading-tight">
            Réalisez vos <span className="text-primary">projets</span> <br />
            immobiliers <span className="italic font-serif text-accent">en toute sérénité.</span>
          </h2>

          <p className="text-xl text-white/50 max-w-lg mb-16 leading-relaxed">
            De la recherche à la gestion, nous simplifions chaque étape pour vous offrir la meilleure expérience du marché sénégalais.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-white/40 uppercase tracking-widest font-semibold">Biens</div>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
              <div className="text-4xl font-bold text-accent mb-2">100%</div>
              <div className="text-sm text-white/40 uppercase tracking-widest font-semibold">Sécurisé</div>
            </div>
          </div>
        </div>

        {/* Overlay décoratif */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05080c]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
