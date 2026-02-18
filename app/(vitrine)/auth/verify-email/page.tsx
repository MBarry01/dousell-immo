"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
        token ? "idle" : "error"
    );
    const [errorMessage, setErrorMessage] = useState<string>(
        token ? "" : "Lien de vérification invalide. Le token est manquant."
    );

    const handleVerify = async () => {
        if (!token) return;

        setStatus("loading");

        try {
            const response = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setStatus("error");
                setErrorMessage(data.error || "Erreur lors de la vérification");
                return;
            }

            setStatus("success");
        } catch (error) {
            console.error("Erreur:", error);
            setStatus("error");
            setErrorMessage("Erreur de connexion. Veuillez réessayer.");
        }
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
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:bg-white/10">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-full ${status === "success"
                                ? "bg-green-500/20"
                                : status === "error"
                                    ? "bg-red-500/20"
                                    : "bg-amber-500/20"
                            }`}>
                            {status === "success" ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                >
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </motion.div>
                            ) : status === "error" ? (
                                <XCircle className="h-10 w-10 text-red-500" />
                            ) : status === "loading" ? (
                                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                            ) : (
                                <Mail className="h-10 w-10 text-amber-500" />
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-white">
                            {status === "success"
                                ? "✅ Email vérifié !"
                                : status === "error"
                                    ? "❌ Erreur de vérification"
                                    : status === "loading"
                                        ? "⏳ Vérification en cours..."
                                        : "📧 Vérification de votre email"}
                        </h1>

                        <p className="text-white/70">
                            {status === "success" ? (
                                "Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter."
                            ) : status === "error" ? (
                                errorMessage
                            ) : status === "loading" ? (
                                "Veuillez patienter pendant que nous vérifions votre compte..."
                            ) : (
                                "Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte."
                            )}
                        </p>

                        {/* Action Button */}
                        <div className="pt-4">
                            {status === "idle" && token && (
                                <Button
                                    onClick={handleVerify}
                                    className="w-full h-12 rounded-xl bg-primary text-black hover:bg-primary/90"
                                >
                                    ✅ Vérifier mon email
                                </Button>
                            )}

                            {status === "success" && (
                                <Button
                                    onClick={() => router.push("/login")}
                                    className="w-full h-12 rounded-xl bg-green-500 text-white hover:bg-green-600"
                                >
                                    🚀 Se connecter
                                </Button>
                            )}

                            {status === "error" && (
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push("/register")}
                                        className="w-full h-12 rounded-xl bg-primary text-black hover:bg-primary/90"
                                    >
                                        Créer un nouveau compte
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/login")}
                                        className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10"
                                    >
                                        Se connecter
                                    </Button>
                                </div>
                            )}

                            {status === "loading" && (
                                <Button
                                    disabled
                                    className="w-full h-12 rounded-xl bg-gray-600 text-gray-400"
                                >
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Vérification...
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-black px-4 py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                    <p className="text-white/70">Chargement...</p>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
