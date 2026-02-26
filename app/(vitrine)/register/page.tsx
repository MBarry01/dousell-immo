"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import * as RPNInput from "react-phone-number-input";
import { parsePhoneNumber } from "libphonenumber-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Captcha } from "@/components/ui/captcha";
import { signup, determinePostLoginRedirect } from "@/app/(vitrine)/auth/actions";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState<RPNInput.Value | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Lire le paramètre redirect explicite de l'URL
  const explicitRedirect = searchParams.get("redirect");

  // Redirection automatique si déjà connecté
  useEffect(() => {
    const checkUser = async () => {
      const supabase = (await import("@/utils/supabase/client")).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(explicitRedirect || "/gestion");
      }
    };
    checkUser();
  }, [router, explicitRedirect]);

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
        {/* Background Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl space-y-8 my-auto">
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-8 relative"
          >

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
                Créer un compte
              </h1>
              <p className="mt-3 text-sm text-white/50">
                Rejoignez la plateforme immobilière de référence au Sénégal.
              </p>
            </div>

            {/* Social and Form */}
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
                  Inscription avec Google
                </Button>
              </form>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-4 text-white/30 backdrop-blur-3xl">ou avec vos coordonnées</span>
                </div>
              </div>

              {/* Registration Form */}
              <form
                action={async (formData: FormData) => {
                  setError(null);
                  setValidationErrors({});
                  if (!captchaToken) {
                    toast.error("Veuillez compléter la vérification anti-robot");
                    return;
                  }
                  formData.append("turnstileToken", captchaToken);
                  formData.append("plan", plan);

                  const fullName = formData.get("fullName") as string;
                  const email = formData.get("email") as string;
                  const phone = formData.get("phone") as string;
                  const password = formData.get("password") as string;
                  const confirmPassword = formData.get("confirmPassword") as string;

                  const errors: typeof validationErrors = {};
                  if (!fullName || fullName.trim().length < 2) errors.fullName = "Nom complet requis";
                  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide";
                  if (!phone) errors.phone = "Téléphone requis";
                  if (!password || password.length < 6) errors.password = "Min 6 caractères";
                  if (password !== confirmPassword) errors.confirmPassword = "Divergence de mot de passe";

                  if (Object.keys(errors).length > 0) {
                    setValidationErrors(errors);
                    toast.error("Formulaire incomplet ou invalide");
                    return;
                  }

                  startTransition(async () => {
                    const result = await signup(formData);
                    if (result?.error) {
                      setError(result.error);
                      toast.error(result.error);
                    } else if (result?.success) {
                      if (result.autoConfirmed) {
                        toast.success("Bienvenue ! Redirection...");
                        if (explicitRedirect) {
                          window.location.href = explicitRedirect;
                        } else {
                          const { redirectPath } = await determinePostLoginRedirect();
                          window.location.href = redirectPath;
                        }
                      } else if (result.emailSent) {
                        toast.success("Email envoyé !");
                        setTimeout(() => router.push(`/auth/check-email?email=${encodeURIComponent(email)}`), 1500);
                      } else {
                        toast.success("Compte créé !");
                        setTimeout(() => router.push("/login"), 1500);
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

                {/* Grid for Name and Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-white/70">Nom complet</Label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Oumar Diallo"
                        required
                        className={`h-12 rounded-xl border-white/5 bg-white/[0.03] pl-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none ${validationErrors.fullName ? "border-red-500/50" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/70">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="votre@email.com"
                        required
                        className={`h-12 rounded-xl border-white/5 bg-white/[0.03] pl-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none ${validationErrors.email ? "border-red-500/50" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-white/70">Téléphone</Label>
                  <PhoneInput
                    id="phone"
                    value={phoneValue}
                    onChange={setPhoneValue}
                    defaultCountry="SN"
                    international
                    className={`${validationErrors.phone ? "border-red-500/50" : ""}`}
                    required
                  />
                  <input type="hidden" name="phone" value={phoneValue || ""} />
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white/70">Mot de passe</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="h-12 rounded-xl border-white/5 bg-white/[0.03] pl-11 pr-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/70">Confirmation</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="h-12 rounded-xl border-white/5 bg-white/[0.03] pl-11 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <Captcha
                  onVerify={setCaptchaToken}
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
                      Inscription...
                    </div>
                  ) : (
                    "S&apos;inscrire gratuitement"
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="pt-6 text-center border-t border-white/5">
                <p className="text-sm text-white/40">
                  Vous avez déjà un compte ?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Côté Droit : Panel Branding (Fixed Asset) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 h-full overflow-hidden bg-[#0A0F16]">
        {/* Background Image - Faded Deco */}
        <div className="absolute inset-0 z-0 opacity-[0.14] pointer-events-none overflow-hidden">
          <Image
            src="/images/asset-signup.png"
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
            Accédez aux <span className="text-primary">meilleures</span> <br />
            opportunités <span className="italic font-serif text-accent">du moment.</span>
          </h2>

          <p className="text-xl text-white/50 max-w-lg mb-16 leading-relaxed">
            Rejoignez plus de 500 utilisateurs satisfaits et commencez votre voyage immobilier dès aujourd&apos;hui.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
              <div className="text-4xl font-bold text-primary mb-2">0 FCFA</div>
              <div className="text-sm text-white/40 uppercase tracking-widest font-semibold font-semibold">Frais</div>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
              <div className="text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-sm text-white/40 uppercase tracking-widest font-semibold font-semibold">Support</div>
            </div>
          </div>
        </div>

        {/* Overlay décoratif */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#05080c] text-white">Chargement...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
