"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function VerifyRecoveryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const exchangeCode = async () => {
            const code = searchParams.get("code");
            const next = searchParams.get("next") || "/compte/reset-password";

            if (!code) {
                setError("Le lien de récupération est invalide ou a expiré.");
                setIsProcessing(false);
                return;
            }

            try {
                const supabase = createClient();
                console.log("📝 Client-side exchange for recovery code...");

                const { error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    console.error("❌ Exchange error:", error);
                    setError(error.message);
                    toast.error("Échec de la récupération de session");
                    setIsProcessing(false);
                    return;
                }

                console.log("✅ Session established on client!");
                toast.success("Session établie !");

                // Redirection vers la page de changement de mot de passe
                router.push(next);
                router.refresh();
            } catch (err: any) {
                console.error("❌ Unexpected error:", err);
                setError("Une erreur inattendue est survenue lors de la vérification.");
                setIsProcessing(false);
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#05080c] text-white p-4">
            <div className="max-w-md w-full bg-slate-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
                {error ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex justify-center">
                            <div className="bg-red-500/10 p-4 rounded-full ring-1 ring-red-500/20">
                                <AlertCircle className="h-10 w-10 text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Erreur de vérification</h1>
                            <p className="text-white/50 text-sm leading-relaxed">
                                {error === "PKCE code verifier not found in storage."
                                    ? "La session de sécurité a expiré. Veuillez recommencer la demande de réinitialisation depuis le même navigateur."
                                    : error}
                            </p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <Button
                                onClick={() => router.push("/reset-password")}
                                className="w-full bg-primary text-black font-bold h-11"
                            >
                                Refaire une demande
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => router.push("/login")}
                                className="w-full text-white/50 hover:text-white"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold italic">Authentification en cours...</h1>
                            <p className="text-white/40 text-sm">
                                Veuillez patienter pendant que nous sécurisons votre accès.
                            </p>
                        </div>
                        {/* Fallback auto-redirect link just in case */}
                        <div className="text-[10px] text-white/10 pt-8 italic">
                            PKCE Verification Flow (Client-Side)
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function VerifyRecoveryFallback() {
    return (
        <div className="flex h-screen items-center justify-center bg-[#05080c]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default function VerifyRecoveryPage() {
    return (
        <Suspense fallback={<VerifyRecoveryFallback />}>
            <VerifyRecoveryContent />
        </Suspense>
    );
}
