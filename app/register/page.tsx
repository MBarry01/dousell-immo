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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { signup } from "@/app/auth/actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState<RPNInput.Value | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<RPNInput.Country>("SN");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
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

  // Polling pour vérifier si l'email a été confirmé
  useEffect(() => {
    if (!showEmailConfirmModal || !registeredUserId || isEmailVerified) {
      return;
    }

    const checkVerification = async () => {
      try {
        setIsCheckingVerification(true);
        const response = await fetch(`/api/auth/check-verification?userId=${registeredUserId}`);
        const data = await response.json();

        if (data.verified) {
          setIsEmailVerified(true);
          setIsCheckingVerification(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification:", error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    // Vérifier immédiatement et ensuite toutes les 3 secondes
    checkVerification();
    const interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, [showEmailConfirmModal, registeredUserId, isEmailVerified]);

  const handleGoogleSignIn = () => {
    // Utiliser une route API pour Google OAuth (meilleure gestion des cookies PKCE)
    window.location.href = "/auth/google";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-black px-4 py-12">
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
                className="w-full rounded-xl border border-gray-200 bg-background text-foreground hover:bg-gray-50"
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
              setSuccessMessage(null);
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
              const confirmPassword = formData.get("confirmPassword") as string;

              const errors: typeof validationErrors = {};

              if (!fullName || fullName.trim().length < 2) {
                errors.fullName = "Le nom complet doit contenir au moins 2 caractères";
              }

              if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.email = "Adresse email invalide";
              }

              // Validation du téléphone (format international E.164)
              if (!phone || phone.trim().length < 8) {
                errors.phone = "Numéro de téléphone invalide";
              } else {
                // Extraire uniquement les chiffres (sans espaces ni symboles)
                const phoneDigitsOnly = phone.replace(/\D/g, "");
                // Accepter les numéros internationaux (8 à 15 chiffres selon E.164)
                if (phoneDigitsOnly.length < 8 || phoneDigitsOnly.length > 15) {
                  errors.phone = "Numéro de téléphone invalide (8 à 15 chiffres requis)";
                }
              }

              if (!password || password.length < 6) {
                errors.password = "Le mot de passe doit contenir au moins 6 caractères";
              }

              if (!confirmPassword) {
                errors.confirmPassword = "Veuillez confirmer votre mot de passe";
              } else if (password !== confirmPassword) {
                errors.confirmPassword = "Les mots de passe ne correspondent pas";
              }

              if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                toast.error("Veuillez corriger les erreurs dans le formulaire");
                return;
              }

              // La vérification HIBP est effectuée côté serveur pour éviter les problèmes CORS
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
                    // Afficher le modal de confirmation d'email
                    setError(null);
                    setSuccessMessage(null);
                    setRegisteredEmail(formData.get("email") as string);
                    setRegisteredUserId(result.userId || null);
                    setIsEmailVerified(false);
                    setShowEmailConfirmModal(true);
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

            {successMessage && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
                {successMessage}
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
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${validationErrors.fullName ? "border-red-500/50" : ""
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
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${validationErrors.email ? "border-red-500/50" : ""
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
                className={`${validationErrors.phone ? "border-red-500/50" : ""
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
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${validationErrors.password ? "border-red-500/50" : ""
                    }`}
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/70">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus:border-amber-500 focus:ring-amber-500 ${validationErrors.confirmPassword ? "border-red-500/50" : ""
                    }`}
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-400">{validationErrors.confirmPassword}</p>
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
              disabled={isPending || !captchaToken}
              className="mt-6 h-12 w-full rounded-xl bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
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

      {/* Modal de confirmation d'email */}
      <Dialog open={showEmailConfirmModal} onOpenChange={(open) => {
        // Empêcher la fermeture si non vérifié
        if (!open && !isEmailVerified) return;
        setShowEmailConfirmModal(open);
      }}>
        <DialogContent className="sm:max-w-md border-white/20 bg-gradient-to-b from-gray-900 to-black [&>button]:hidden">
          <DialogHeader className="text-center space-y-4">
            {/* Icône qui change selon le statut */}
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${isEmailVerified
              ? "bg-green-500/20"
              : "bg-amber-500/20"
              }`}>
              {isEmailVerified ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              ) : (
                <Mail className="h-10 w-10 text-amber-500" />
              )}
            </div>

            <DialogTitle className="text-xl text-white">
              {isEmailVerified
                ? "✅ Email vérifié !"
                : "📧 Vérifiez votre email"}
            </DialogTitle>

            <DialogDescription className="text-base text-white/70 text-center">
              {isEmailVerified ? (
                <span className="text-green-400 font-medium">
                  Votre compte a été activé avec succès ! Cliquez sur le bouton ci-dessous pour accéder à votre espace.
                </span>
              ) : (
                <span>
                  Un email de confirmation a été envoyé à{" "}
                  <span className="font-semibold text-amber-400">{registeredEmail}</span>.
                  Veuillez cliquer sur le lien dans l'email pour activer votre compte.
                </span>
              )}
            </DialogDescription>

            {/* Animation d'attente - en dehors de DialogDescription */}
            {!isEmailVerified && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <motion.div
                      className="h-3 w-3 rounded-full bg-amber-500"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="h-3 w-3 rounded-full bg-amber-500"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="h-3 w-3 rounded-full bg-amber-500"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-white/50">
                    En attente de confirmation...
                  </span>
                </div>
                <span className="text-sm text-white/50">
                  💡 Pensez à vérifier vos spams si vous ne trouvez pas l'email.
                </span>
              </div>
            )}
          </DialogHeader>

          <DialogFooter className="mt-6">
            <Button
              onClick={async () => {
                if (isEmailVerified) {
                  setShowEmailConfirmModal(false);
                  // Rafraîchir la session et rediriger vers la homepage
                  router.push("/");
                  router.refresh();
                }
              }}
              disabled={!isEmailVerified}
              className={`w-full h-12 rounded-xl transition-all duration-300 ${isEmailVerified
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
            >
              {isEmailVerified ? (
                <>
                  🚀 Accéder à mon espace
                </>
              ) : (
                <>
                  ⏳ En attente de vérification...
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
