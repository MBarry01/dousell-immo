"use client";

import { useState, useTransition, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import _Image from "next/image";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/app/(vitrine)/auth/actions";
import { useAuth } from "@/hooks/use-auth";

function ResetPasswordFinalContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const explicitRedirect = searchParams.get("redirect");

    // Si pas de session (utilisateur n'a pas utilisé le lien ou lien expiré)
    useEffect(() => {
        if (!loading && !user) {
            toast.error("Session expirée ou invalide. Veuillez recommencer la procédure.");
            router.push("/reset-password");
        }
    }, [user, loading, router]);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        startTransition(async () => {
            // On passe le redirectPath pour que l'action sache où nous renvoyer
            const finalFormData = new FormData();
            finalFormData.append("password", password);
            if (explicitRedirect) {
                finalFormData.append("redirect", explicitRedirect);
            }

            const result = await updatePassword(finalFormData);

            if (result?.error) {
                setError(result.error);
                toast.error(result.error);
            } else {
                toast.success("Mot de passe mis à jour !");
                // Redirection finale
                router.push(result.redirectPath || "/compte");
                router.refresh();
            }
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Sécurisez votre compte</h1>
                    <p className="text-muted-foreground">
                        Choisissez un nouveau mot de passe fort pour votre compte {user.email}.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                    {error && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">Nouveau mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                    >
                        {isPending ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mise à jour...
                            </div>
                        ) : (
                            "Enregistrer le nouveau mot de passe"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function ResetPasswordFinalFallback() {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default function ResetPasswordFinalPage() {
    return (
        <Suspense fallback={<ResetPasswordFinalFallback />}>
            <ResetPasswordFinalContent />
        </Suspense>
    );
}
