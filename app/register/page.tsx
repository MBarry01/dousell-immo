"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import * as RPNInput from "react-phone-number-input";
import { getCountryCallingCode } from "react-phone-number-input";
import { parsePhoneNumber } from "libphonenumber-js";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Captcha } from "@/components/ui/captcha";
import { signup } from "@/app/auth/actions";
import { checkPasswordHIBP } from "@/lib/hibp";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState<RPNInput.Value | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<RPNInput.Country>("SN");
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isCheckingHIBP, setIsCheckingHIBP] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  // Fonction pour obtenir le drapeau et l'indicatif du pays
  const getCountryInfo = (country: RPNInput.Country | undefined) => {
    if (!country) {
      return { Flag: null, callingCode: "" };
    }
    const Flag = flags[country];
    const callingCode = getCountryCallingCode(country);
    return { Flag, callingCode };
  };

  const { Flag: SelectedFlag, callingCode } = getCountryInfo(selectedCountry);

  // Synchroniser le pays sélectionné avec la valeur du téléphone
  useEffect(() => {
    if (phoneValue && typeof phoneValue === "string") {
      try {
        const phoneNumber = parsePhoneNumber(phoneValue);
        if (phoneNumber && phoneNumber.country) {
          setSelectedCountry(phoneNumber.country as RPNInput.Country);
        }
      } catch (e) {
        // Ignorer les erreurs de détection de pays (numéro invalide, etc.)
      }
    }
  }, [phoneValue]);

  const handleGoogleSignIn = () => {
    // Utiliser une route API pour Google OAuth (meilleure gestion des cookies PKCE)
    window.location.href = "/auth/google";
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
              setValidationErrors({});
              
              if (!captchaToken) {
                toast.error("Veuillez compléter la vérification anti-robot");
                return;
              }
              
              formData.append("turnstileToken", captchaToken);
              
              // Validation côté client
              const fullName = formData.get("fullName") as string;
              const email = formData.get("email") as string;
              const phone = formData.get("phone") as string;
              const password = formData.get("password") as string;
              
              const errors: typeof validationErrors = {};
              
              if (!fullName || fullName.trim().length < 2) {
                errors.fullName = "Le nom complet doit contenir au moins 2 caractères";
              }
              
              if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.email = "Adresse email invalide";
              }
              
              // Validation du téléphone (format international)
              if (!phone || phone.trim().length < 8) {
                errors.phone = "Numéro de téléphone invalide";
              } else {
                // Vérifier que c'est un numéro valide (au moins 8 caractères après l'indicatif)
                const phoneWithoutSpaces = phone.replace(/\s/g, "");
                if (phoneWithoutSpaces.length < 8) {
                  errors.phone = "Numéro de téléphone invalide";
                }
              }
              
              if (!password || password.length < 6) {
                errors.password = "Le mot de passe doit contenir au moins 6 caractères";
              }
              
              if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                toast.error("Veuillez corriger les erreurs dans le formulaire");
                return;
              }
              
              // Vérification HIBP avant l'inscription
              setIsCheckingHIBP(true);
              try {
                const hibpResult = await checkPasswordHIBP(password, true);
                
                if (!hibpResult.success) {
                  // Erreur technique (service indisponible, etc.)
                  toast.error("Vérification de sécurité", {
                    description: hibpResult.error || "Impossible de vérifier le mot de passe. Veuillez réessayer.",
                    duration: 6000,
                  });
                  setIsCheckingHIBP(false);
                  return;
                }
                
                if (hibpResult.breached) {
                  // Mot de passe compromis
                  setError(hibpResult.error || "Ce mot de passe a été compromis. Choisissez-en un autre.");
                  toast.error("Mot de passe compromis", {
                    description: hibpResult.error || "Ce mot de passe a été compromis. Choisissez-en un autre plus sécurisé.",
                    duration: 8000,
                  });
                  setIsCheckingHIBP(false);
                  return;
                }
                
                // Mot de passe OK, continuer avec l'inscription
                setIsCheckingHIBP(false);
              } catch (err) {
                console.error("HIBP check error:", err);
                toast.error("Erreur de vérification", {
                  description: "Impossible de vérifier le mot de passe. Veuillez réessayer.",
                  duration: 5000,
                });
                setIsCheckingHIBP(false);
                return;
              }
              
              startTransition(async () => {
                const result = await signup(formData);
                console.log("📋 Résultat signup:", result); // Log pour debugging
                if (result?.error) {
                  setError(result.error);
                  console.error("🔴 Erreur affichée à l'utilisateur:", result.error);
                  // Afficher un toast uniquement pour les erreurs critiques (pas de duplication avec la boîte d'erreur)
                  // Le toast est plus visible et disparaît automatiquement
                  if (result.error.includes("Trop de tentatives")) {
                    toast.error("Trop de tentatives", {
                      description: "Pour votre sécurité, veuillez attendre 5 minutes avant de réessayer.",
                      duration: 8000,
                    });
                  } else if (result.error.includes("déjà enregistré")) {
                    toast.error("Email déjà utilisé", {
                      description: result.error,
                      duration: 6000,
                    });
                  } else {
                    // Pour les autres erreurs, afficher un toast court
                    toast.error(result.error, {
                      duration: 5000,
                    });
                  }
                } else if (result?.success) {
                  // Si l'utilisateur est automatiquement confirmé et connecté
                  if (result.autoConfirmed) {
                    toast.success("Compte créé avec succès !", {
                      description: "Vous êtes maintenant connecté. Bienvenue !",
                      duration: 3000,
                    });
                    // Rediriger vers la home
                    setTimeout(() => {
                      router.push("/");
                      router.refresh();
                    }, 1500);
                  } 
                  // Si l'email de confirmation est requis
                  else if (result.emailSent) {
                    // Afficher une alerte claire sans redirection immédiate
                    setError(null);
                    toast.success("Compte créé !", {
                      description: "Un lien de confirmation a été envoyé à votre adresse email. Veuillez cliquer dessus pour activer votre compte.",
                      duration: 8000,
                    });
                    // Ne pas rediriger automatiquement, laisser l'utilisateur lire le message
                  } 
                  // Cas par défaut (compte créé mais pas encore confirmé)
                  else {
                    toast.success("Compte créé avec succès !", {
                      description: result.message || "Vous pouvez maintenant vous connecter.",
                      duration: 3000,
                    });
                    // Rediriger vers la page de connexion
                    setTimeout(() => {
                      router.push("/login");
                    }, 2000);
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
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${
                    validationErrors.fullName ? "border-red-500/50" : ""
                  }`}
                />
              </div>
              {validationErrors.fullName && (
                <p className="text-xs text-red-400">{validationErrors.fullName}</p>
              )}
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
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${
                    validationErrors.email ? "border-red-500/50" : ""
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-red-400">{validationErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/70">
                Téléphone
              </Label>
              <PhoneInput
                id="phone"
                value={phoneValue}
                onChange={(value) => {
                  setPhoneValue(value);
                }}
                defaultCountry="SN"
                international
                placeholder="Entrez votre numéro"
                className={`${
                  validationErrors.phone ? "border-red-500/50" : ""
                }`}
                required
              />
              {/* Input caché pour envoyer la valeur dans le FormData */}
              <input
                type="hidden"
                name="phone"
                value={phoneValue || ""}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-400">{validationErrors.phone}</p>
              )}
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
              {validationErrors.password && (
                <p className="text-xs text-red-400">{validationErrors.password}</p>
              )}
            </div>

            <Captcha
              onVerify={(token) => {
                setCaptchaToken(token);
              }}
              onExpire={() => {
                setCaptchaToken(null);
                // Le widget se réinitialise automatiquement
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || !captchaToken || isCheckingHIBP}
              className="mt-6 h-12 w-full rounded-xl bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isCheckingHIBP ? (
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
                  Vérification du mot de passe...
                </>
              ) : isPending ? (
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
