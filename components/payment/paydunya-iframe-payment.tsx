"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PayDunyaIframePaymentProps {
    serviceType: string;
    description: string;
    amount: number;
    propertyId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    buttonText?: string;
    className?: string;
}

export default function PayDunyaIframePayment({
    serviceType,
    description,
    amount,
    propertyId,
    onSuccess,
    onCancel,
    buttonText = "Payer maintenant",
    className = "",
}: PayDunyaIframePaymentProps) {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [invoiceToken, setInvoiceToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Vérifier le statut du paiement périodiquement
    useEffect(() => {
        if (!showModal || !invoiceToken || paymentComplete) return;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/paydunya/check-status?token=${invoiceToken}`);
                const data = await response.json();

                if (data.status === "completed") {
                    setPaymentComplete(true);
                    onSuccess?.();
                }
            } catch (err) {
                console.error("Erreur vérification statut:", err);
            }
        };

        // Vérifier toutes les 3 secondes
        const interval = setInterval(checkStatus, 3000);

        return () => clearInterval(interval);
    }, [showModal, invoiceToken, paymentComplete, onSuccess]);

    const handleStartPayment = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/paydunya/create-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType,
                    description,
                    amount,
                    propertyId,
                    returnUrl: window.location.href,
                    cancelUrl: window.location.href,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Erreur lors de la création");
            }

            setCheckoutUrl(data.checkout_url);
            setInvoiceToken(data.token);
            setShowModal(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setCheckoutUrl(null);
        if (!paymentComplete) {
            onCancel?.();
        }
    };

    // Affichage succès
    if (paymentComplete) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Paiement Réussi !</h3>
                <p className="text-gray-600">
                    Votre transaction a été validée avec succès.
                </p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                    Continuer
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Affichage du montant */}
                <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <span>Montant à payer :</span>
                    <span className="font-bold text-lg text-primary">
                        {amount.toLocaleString()} FCFA
                    </span>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                        {error}
                    </div>
                )}

                <Button
                    className={`w-full ${className}`}
                    onClick={handleStartPayment}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Préparation...
                        </>
                    ) : (
                        buttonText
                    )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                    Paiement sécurisé via PayDunya (Wave, Orange Money, Free Money)
                </p>
            </div>

            {/* Modal avec Iframe PayDunya */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-lg h-[85vh] p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <DialogTitle>Paiement Sécurisé</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={handleClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>

                    {checkoutUrl && (
                        <div className="flex-1 relative" style={{ height: "calc(85vh - 60px)" }}>
                            <iframe
                                src={checkoutUrl}
                                className="w-full h-full border-0"
                                title="Paiement PayDunya"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
