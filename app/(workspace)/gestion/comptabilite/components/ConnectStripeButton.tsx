"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectStripeButtonProps {
    stripeAccountStatus: string | null; // 'pending', 'active', 'restricted'
    stripeChargesEnabled: boolean | null;
    stripePayoutsEnabled: boolean | null;
}

export function ConnectStripeButton({
    stripeAccountStatus,
    stripeChargesEnabled,
    stripePayoutsEnabled
}: ConnectStripeButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const isFullyActive = stripeChargesEnabled && stripePayoutsEnabled;

    const handleConnect = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stripe/connect/onboarding', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Onboarding
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible de démarrer la connexion bancaire.",
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    if (isFullyActive) {
        return (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50/50 border-green-200">
                <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="font-medium text-green-900">Compte Bancaire Connecté</h3>
                    <p className="text-sm text-green-700">Vous êtes prêt à recevoir des loyers.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleConnect} className="ml-auto">
                    Paramètres Stripe
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-6 border rounded-lg bg-white shadow-sm">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">Recevoir des paiements en ligne</h3>
                    <p className="text-gray-500 text-sm">
                        Connectez votre compte bancaire (ou Mobile Money) pour permettre à vos locataires de payer par carte ou Wave.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                    {stripeAccountStatus === 'pending' && <Badge variant="secondary">En attente</Badge>}
                    {stripeAccountStatus === 'restricted' && <Badge variant="destructive">Action Requise</Badge>}
                </div>

                <Button onClick={handleConnect} disabled={loading} className="w-full sm:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {stripeAccountStatus === 'restricted' ? 'Mettre à jour les infos' : 'Connecter mon compte'}
                </Button>
            </div>

            {stripeAccountStatus === 'restricted' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Des informations supplémentaires sont requises par Stripe.</span>
                </div>
            )}
        </div>
    );
}
