"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    Shield,
    Sparkles,
    Building2,
    TrendingUp,
    Check,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import * as RPNInput from "react-phone-number-input";
import { parsePhoneNumberWithError } from "libphonenumber-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Captcha } from "@/components/ui/captcha";
import { signup } from "@/app/(vitrine)/auth/actions";
import { cn } from "@/lib/utils";

// Animation variants
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const slideIn: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

// Password strength calculator
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: "Faible", color: "bg-red-500" };
    if (score <= 2) return { score: 2, label: "Moyen", color: "bg-orange-500" };
    if (score <= 3) return { score: 3, label: "Bon", color: "bg-yellow-500" };
    if (score <= 4) return { score: 4, label: "Fort", color: "bg-emerald-500" };
    return { score: 5, label: "Excellent", color: "bg-emerald-400" };
};

// Feature highlights
const features = [
    { icon: Building2, text: "Accès aux biens exclusifs" },
    { icon: TrendingUp, text: "Suivi de vos investissements" },
    { icon: Shield, text: "Transactions sécurisées" },
];

export default function SignupPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [phoneValue, setPhoneValue] = useState<RPNInput.Value | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
    }>({});
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Password strength
    const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);
    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

    // Progress calculation
    const formProgress = useMemo(() => {
        let filled = 0;
        if (fullName.length >= 2) filled++;
        if (email.includes("@")) filled++;
        if (phoneValue && phoneValue.length >= 8) filled++;
        if (password.length >= 6) filled++;
        if (passwordsMatch) filled++;
        if (agreeToTerms) filled++;
        return Math.round((filled / 6) * 100);
    }, [fullName, email, phoneValue, password, passwordsMatch, agreeToTerms]);

    // Validate phone format when it changes
    useEffect(() => {
        if (phoneValue && typeof phoneValue === "string") {
            try {
                parsePhoneNumberWithError(phoneValue);
            } catch {
                // Phone number not yet valid, ignore
            }
        }
    }, [phoneValue]);

    const handleGoogleSignIn = () => {
        window.location.href = "/auth/google";
    };

    const onSubmit = async (formData: FormData) => {
        setError(null);
        setValidationErrors({});

        if (!agreeToTerms) {
            setValidationErrors((prev) => ({ ...prev, terms: "Vous devez accepter les conditions d'utilisation" }));
            return;
        }

        if (!captchaToken) {
            toast.error("Veuillez compléter la vérification anti-robot");
            return;
        }

        formData.append("turnstileToken", captchaToken);

        const errors: typeof validationErrors = {};

        if (!fullName || fullName.trim().length < 2) errors.fullName = "Nom trop court";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide";
        if (!phoneValue || phoneValue.length < 8) errors.phone = "Numéro invalide";
        if (!password || password.length < 6) errors.password = "Minimum 6 caractères";
        if (password !== confirmPassword) errors.confirmPassword = "Les mots de passe ne correspondent pas";

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            toast.error("Veuillez corriger le formulaire");
            return;
        }

        startTransition(async () => {
            const result = await signup(formData);

            if (result?.error) {
                setError(result.error);
                toast.error(result.error);
            } else if (result?.success) {
                if (result.autoConfirmed) {
                    toast.success("Compte créé avec succès !");
                    setTimeout(() => { router.push("/pro/start"); router.refresh(); }, 1500);
                } else if (result.emailSent) {
                    toast.success("Vérifiez votre email !");
                    setTimeout(() => { router.push(`/auth/check-email?email=${encodeURIComponent(email)}`); }, 1500);
                } else {
                    toast.success("Compte créé !");
                    setTimeout(() => { router.push("/login"); }, 2000);
                }
            }
        });
    };

    return (
        <div className="flex min-h-[100dvh] w-full bg-black">
            {/* Left Panel - Full Height Visual */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop"
                        alt="Luxury Interior"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Multi-layer Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

                    {/* Animated Gradient Orbs */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#F4C430]/20 blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#F4C430]/10 blur-[100px]"
                    />
                </div>

                {/* Top Section - Back Button */}
                <div className="relative z-10 p-8 lg:p-12">
                    <Link
                        href="/landing"
                        className="group inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105"
                    >
                        <ArrowLeft className="h-5 w-5 text-white transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium text-white">Retour</span>
                    </Link>
                </div>

                {/* Center - Logo & Brand */}
                <div className="relative z-10 flex flex-1 items-center justify-center px-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: [0.34, 1.56, 0.64, 1],
                            delay: 0.2
                        }}
                        className="text-center"
                    >
                        {/* Logo avec animation de glow pulsé */}
                        <motion.div
                            animate={{
                                filter: [
                                    "drop-shadow(0 0 20px rgba(244, 196, 48, 0.3))",
                                    "drop-shadow(0 0 40px rgba(244, 196, 48, 0.6))",
                                    "drop-shadow(0 0 20px rgba(244, 196, 48, 0.3))"
                                ]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            {/* Cercle lumineux derrière le logo */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="absolute inset-0 -z-10 flex items-center justify-center"
                            >
                                <div className="h-48 w-48 rounded-full bg-[#F4C430]/10 blur-3xl" />
                            </motion.div>

                            <Image
                                src="/LogoOr1.png"
                                alt="Dousell Immo"
                                width={320}
                                height={160}
                                className="mx-auto"
                                priority
                            />
                        </motion.div>

                        {/* Tagline avec animation séparée */}

                    </motion.div>
                </div>

                {/* Bottom Section - Content */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="relative z-10 p-8 lg:p-12"
                >
                    {/* Icon Badge */}


                    <motion.h2
                        variants={fadeInUp}
                        className="mb-4 text-4xl font-bold leading-tight text-white lg:text-5xl"
                    >
                        Rejoignez l&apos;élite de<br />
                        <span className="bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
                            l&apos;immobilier sénégalais
                        </span>
                    </motion.h2>

                    <motion.p
                        variants={fadeInUp}
                        className="mb-8 max-w-md text-lg text-white/70"
                    >
                        Accédez à des opportunités exclusives et gérez vos investissements sur une plateforme unique.
                    </motion.p>

                    {/* Feature List */}
                    <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-3">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={slideIn}
                                className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4C430]/20">
                                    <feature.icon className="h-6 w-6 text-[#F4C430]" />
                                </div>
                                <span className="text-sm font-medium text-white/80">{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Trust Badge */}
                    <motion.div
                        variants={fadeInUp}
                        className="mt-8 flex items-center gap-4"
                    >
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-black bg-gradient-to-br from-zinc-500 to-zinc-700" />
                            ))}
                        </div>
                        <div className="text-sm">
                            <span className="text-2xl font-bold text-white">+2,500</span>
                            <span className="ml-2 text-white/60">utilisateurs actifs</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Panel - Form (Full Width) */}
            <div className="relative flex w-full flex-col bg-zinc-900 lg:w-1/2">
                {/* Background Image Container - Faded Deco */}
                <div className="absolute inset-0 z-0 opacity-[0.14] pointer-events-none overflow-hidden">
                    <Image
                        src="/images/assetSignup.png"
                        alt="Background Decoration"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                    {/* Gradient to blend with the dark background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-zinc-900" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/40 via-transparent to-zinc-900/40" />
                </div>

                {/* Progress Bar */}
                <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-white/5">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#F4C430] to-[#FFD700]"
                        initial={{ width: 0 }}
                        animate={{ width: `${formProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Mobile Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/5 p-4 lg:hidden">
                    <Link
                        href="/landing"
                        className="inline-flex items-center justify-center rounded-full bg-white/5 p-2.5 transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Link>
                    <Image
                        src="/logoJnOr.png"
                        alt="Dousell Immo"
                        width={120}
                        height={40}
                        className="h-8 w-auto"
                    />
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">{formProgress}%</span>
                </div>

                {/* Scrollable Form Area */}
                <div className="relative z-10 flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-lg px-6 py-8 lg:px-12 lg:py-16">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            {/* Header */}
                            <motion.div variants={fadeInUp} className="mb-8 lg:mb-10">
                                <h1 className="text-3xl font-bold text-white lg:text-4xl">
                                    Créer un compte
                                </h1>
                                <p className="mt-3 text-white/60">
                                    Vous avez déjà un compte ?{" "}
                                    <Link href="/login" className="font-semibold text-[#F4C430] transition-colors hover:text-[#FFD700]">
                                        Se connecter
                                    </Link>
                                </p>
                            </motion.div>

                            {/* Google Login */}
                            <motion.div variants={fadeInUp} className="mb-6">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={isPending}
                                    type="button"
                                    className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 py-4 font-medium text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 active:scale-[0.99] disabled:opacity-50"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>Continuer avec Google</span>
                                    </div>
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                </button>
                            </motion.div>

                            {/* Divider */}
                            <motion.div variants={fadeInUp} className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-zinc-900 px-4 text-xs uppercase tracking-wider text-white/40">
                                        ou avec email
                                    </span>
                                </div>
                            </motion.div>

                            {/* Form */}
                            <form action={onSubmit}>
                                <motion.div variants={staggerContainer} className="space-y-5">
                                    {/* Error Alert */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <X className="h-5 w-5 text-red-400" />
                                                    <p className="text-sm text-red-400">{error}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Name & Phone Row */}
                                    <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-medium text-white/70" required>
                                                Nom complet
                                            </Label>
                                            <div className="relative">
                                                <User className={cn(
                                                    "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                                                    focusedField === "fullName" ? "text-[#F4C430]" : "text-white/30"
                                                )} />
                                                <Input
                                                    id="fullName"
                                                    name="fullName"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    onFocus={() => setFocusedField("fullName")}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="Mamadou Diallo"
                                                    className={cn(
                                                        "h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/30 transition-all duration-300",
                                                        "focus:border-[#F4C430] focus:bg-white/10 focus:ring-2 focus:ring-[#F4C430]/20",
                                                        validationErrors.fullName && "border-red-500/50"
                                                    )}
                                                    required
                                                />
                                                {fullName.length >= 2 && (
                                                    <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-medium text-white/70" required>
                                                Téléphone
                                            </Label>
                                            <PhoneInput
                                                id="phone"
                                                value={phoneValue}
                                                onChange={setPhoneValue}
                                                defaultCountry="SN"
                                                international
                                                placeholder="77 000 00 00"
                                                className={cn(
                                                    "h-14 rounded-2xl",
                                                    validationErrors.phone && "border-red-500/50"
                                                )}
                                                required
                                            />
                                            <input type="hidden" name="phone" value={phoneValue || ""} />
                                        </div>
                                    </motion.div>

                                    {/* Email */}
                                    <motion.div variants={fadeInUp} className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-white/70" required>
                                            Adresse email
                                        </Label>
                                        <div className="relative">
                                            <Mail className={cn(
                                                "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                                                focusedField === "email" ? "text-[#F4C430]" : "text-white/30"
                                            )} />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocusedField("email")}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="mamadou@exemple.com"
                                                className={cn(
                                                    "h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/30 transition-all duration-300",
                                                    "focus:border-[#F4C430] focus:bg-white/10 focus:ring-2 focus:ring-[#F4C430]/20",
                                                    validationErrors.email && "border-red-500/50"
                                                )}
                                                required
                                            />
                                            {email.includes("@") && email.includes(".") && (
                                                <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Password */}
                                    <motion.div variants={fadeInUp} className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-medium text-white/70" required>
                                            Mot de passe
                                        </Label>
                                        <div className="relative">
                                            <Lock className={cn(
                                                "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                                                focusedField === "password" ? "text-[#F4C430]" : "text-white/30"
                                            )} />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onFocus={() => setFocusedField("password")}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="••••••••"
                                                className={cn(
                                                    "h-14 rounded-2xl border-white/10 bg-white/5 pl-12 pr-12 text-white placeholder:text-white/30 transition-all duration-300",
                                                    "focus:border-[#F4C430] focus:bg-white/10 focus:ring-2 focus:ring-[#F4C430]/20",
                                                    validationErrors.password && "border-red-500/50"
                                                )}
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {password.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-2 pt-2"
                                            >
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={cn(
                                                                "h-1.5 flex-1 rounded-full transition-all duration-300",
                                                                level <= passwordStrength.score ? passwordStrength.color : "bg-white/10"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-white/50">
                                                    Force : <span className={cn(
                                                        "font-medium",
                                                        passwordStrength.score >= 4 ? "text-emerald-400" :
                                                            passwordStrength.score >= 3 ? "text-yellow-400" : "text-white/70"
                                                    )}>{passwordStrength.label}</span>
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>

                                    {/* Confirm Password */}
                                    <motion.div variants={fadeInUp} className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/70" required>
                                            Confirmer le mot de passe
                                        </Label>
                                        <div className="relative">
                                            <Lock className={cn(
                                                "absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                                                focusedField === "confirmPassword" ? "text-[#F4C430]" : "text-white/30"
                                            )} />
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                onFocus={() => setFocusedField("confirmPassword")}
                                                onBlur={() => setFocusedField(null)}
                                                placeholder="••••••••"
                                                className={cn(
                                                    "h-14 rounded-2xl border-white/10 bg-white/5 pl-12 pr-12 text-white placeholder:text-white/30 transition-all duration-300",
                                                    "focus:border-[#F4C430] focus:bg-white/10 focus:ring-2 focus:ring-[#F4C430]/20",
                                                    validationErrors.confirmPassword && "border-red-500/50",
                                                    passwordsMatch && "border-emerald-500/50"
                                                )}
                                                required
                                                minLength={6}
                                            />
                                            {passwordsMatch && (
                                                <Check className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Terms Checkbox */}
                                    <motion.div variants={fadeInUp} className="flex items-start gap-3 py-2">
                                        <div className="relative mt-0.5">
                                            <input
                                                type="checkbox"
                                                id="agreeToTerms"
                                                checked={agreeToTerms}
                                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                                className="peer sr-only"
                                                required
                                            />
                                            <label
                                                htmlFor="agreeToTerms"
                                                className={cn(
                                                    "flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 transition-all duration-200",
                                                    agreeToTerms
                                                        ? "border-[#F4C430] bg-[#F4C430]"
                                                        : "border-white/20 bg-white/5 hover:border-white/40"
                                                )}
                                            >
                                                {agreeToTerms && <Check className="h-3.5 w-3.5 text-black" />}
                                            </label>
                                        </div>
                                        <label htmlFor="agreeToTerms" className="cursor-pointer text-sm leading-relaxed text-white/60">
                                            J&apos;accepte les{" "}
                                            <Link href="/legal" className="font-medium text-white underline decoration-white/30 underline-offset-2 transition-colors hover:text-[#F4C430] hover:decoration-[#F4C430]">
                                                Conditions Générales
                                            </Link>
                                            {" "}et la{" "}
                                            <Link href="/legal" className="font-medium text-white underline decoration-white/30 underline-offset-2 transition-colors hover:text-[#F4C430] hover:decoration-[#F4C430]">
                                                Politique de Confidentialité
                                            </Link>
                                        </label>
                                    </motion.div>
                                    {validationErrors.terms && (
                                        <p className="text-xs text-red-400">{validationErrors.terms}</p>
                                    )}

                                    {/* Captcha */}
                                    <motion.div variants={fadeInUp} className="py-2">
                                        <Captcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />
                                    </motion.div>

                                    {/* Submit Button */}
                                    <motion.div variants={fadeInUp}>
                                        <Button
                                            type="submit"
                                            disabled={isPending || !captchaToken || !agreeToTerms}
                                            className={cn(
                                                "group relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#F4C430] to-[#FFD700] text-base font-bold text-black transition-all duration-300",
                                                "hover:shadow-lg hover:shadow-[#F4C430]/30",
                                                "disabled:from-zinc-600 disabled:to-zinc-700 disabled:text-zinc-400"
                                            )}
                                        >
                                            {isPending ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Création en cours...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Créer mon compte
                                                    <ArrowLeft className="h-5 w-5 rotate-180 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            )}
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                        </Button>
                                    </motion.div>

                                    {/* Security Note */}
                                    <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 pt-4 text-xs text-white/40">
                                        <Shield className="h-4 w-4" />
                                        <span>Vos données sont chiffrées et sécurisées</span>
                                    </motion.div>
                                </motion.div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
