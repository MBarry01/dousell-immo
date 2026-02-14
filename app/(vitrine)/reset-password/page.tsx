"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha } from "@/components/ui/captcha";

function ResetPasswordRequestContent() {
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const explicitRedirect = searchParams.get("redirect");

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        if (!captchaToken) {
            toast.error("Veuillez compléter la vérification anti-robot");
            return;
        }

        const email = formData.get("email") as string;

        startTransition(async () => {
            try {
                // Initialisation côté client pour que le PKCE verifier soit bien stocké dans le navigateur
                const { createClient } = await import("@/utils/supabase/client");
                const supabase = createClient();
                const appUrl = window.location.origin;

                const nextPath = explicitRedirect
                    ? `/compte/reset-password?redirect=${encodeURIComponent(explicitRedirect)}`
                    : `/compte/reset-password`;

                const redirectTo = `${appUrl}/auth/verify-recovery?next=${encodeURIComponent(nextPath)}`;

                const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                    redirectTo,
                    captchaToken: captchaToken || undefined,
                });

                if (error) {
                    setError(error.message);
                    toast.error(error.message);
                } else {
                    setIsSent(true);
                    toast.success("Email envoyé !");
                }
            } catch (err: any) {
                setError(err.message || "Une erreur est survenue");
                toast.error("Une erreur est survenue");
            }
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#05080c] text-white">
            {/* Côté Gauche : Formulaire */}
            <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col items-center justify-start py-12 px-4 lg:px-12 xl:px-24">
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
                </div>

                <div className="relative z-10 w-full max-w-md space-y-8 my-auto">
                    <div className="flex justify-start">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-white hover:bg-white/5"
                            asChild
                        >
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la connexion
                            </Link>
                        </Button>
                    </div>

                    <div className="w-full space-y-8 relative group">
                        <div className="mb-10 text-center">
                            <Link href="/" className="inline-block mb-6 lg:hidden">
                                <Image
                                    src="/Logo.svg"
                                    alt="Dousell Immo"
                                    width={160}
                                    height={48}
                                    className="h-10 w-auto"
                                    priority
                                />
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                Mot de passe oublié
                            </h1>
                            <p className="mt-3 text-sm text-white/50">
                                Entrez votre email pour recevoir un lien de réinitialisation.
                            </p>
                        </div>

                        {isSent ? (
                            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex justify-center">
                                    <div className="rounded-full bg-green-500/10 p-3 ring-1 ring-green-500/20">
                                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">Vérifiez vos emails</h3>
                                    <p className="text-white/50 text-sm">
                                        Un lien de réinitialisation a été envoyé à votre adresse email.
                                        Il expirera dans quelques minutes.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                                    asChild
                                >
                                    <Link href="/login">Retour à la connexion</Link>
                                </Button>
                            </div>
                        ) : (
                            <form action={handleSubmit} className="space-y-6">
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

                                <Captcha
                                    onVerify={(token) => setCaptchaToken(token)}
                                    onExpire={() => setCaptchaToken(null)}
                                />

                                <Button
                                    type="submit"
                                    disabled={isPending || !captchaToken}
                                    className="h-12 w-full rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                                >
                                    {isPending ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Envoi en cours...
                                        </div>
                                    ) : (
                                        "Envoyer le lien"
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Côté Droit : Panel Branding */}
            <div className="hidden lg:relative lg:flex lg:w-1/2 h-full overflow-hidden bg-[#0A0F16]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[150px]" />
                    <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
                    <div className="mb-12 p-5 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-700">
                        <Image
                            src="/Logo.svg"
                            alt="Dousell Immo"
                            width={240}
                            height={72}
                            className="h-20 w-auto"
                            priority
                        />
                    </div>

                    <h2 className="text-5xl font-extrabold tracking-tight text-white mb-8 leading-tight">
                        Sécurisez votre <span className="text-primary">accès</span> <br />
                        en toute <span className="italic font-serif text-accent">simplicité.</span>
                    </h2>

                    <p className="text-xl text-white/50 max-w-lg mb-16 leading-relaxed">
                        La protection de vos données est notre priorité. Réinitialisez votre mot de passe en quelques secondes.
                    </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#05080c]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default function ResetPasswordRequestPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordRequestContent />
        </Suspense>
    );
}
