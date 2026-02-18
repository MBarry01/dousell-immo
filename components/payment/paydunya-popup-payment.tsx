"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PayDunyaPopupPaymentProps {
    serviceType: string;
    description: string;
    amount: number;
    propertyId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    buttonText?: string;
    className?: string;
}

export default function PayDunyaPopupPayment({
    serviceType,
    description,
    amount,
    propertyId,
    onSuccess,
    onCancel,
    buttonText = "Payer maintenant",
    className = "",
}: PayDunyaPopupPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [waitingForPayment, setWaitingForPayment] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invoiceToken, setInvoiceToken] = useState<string | null>(null);

    const popupRef = useRef<Window | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Nettoyer à la désinscription
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Vérifier le statut du paiement
    const checkPaymentStatus = useCallback(async (token: string) => {
        try {
            const response = await fetch(`/api/paydunya/check-status?token=${token}`);
            const data = await response.json();

            if (data.status === "completed") {
                // Paiement réussi !
                setPaymentComplete(true);
                setWaitingForPayment(false);

                // Fermer la popup
                if (popupRef.current && !popupRef.current.closed) {
                    popupRef.current.close();
                }

                // Arrêter le polling
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }

                onSuccess?.();
            } else if (data.status === "cancelled" || data.status === "failed") {
                setWaitingForPayment(false);
                setError(`Paiement ${data.status === "cancelled" ? "annulé" : "échoué"}`);

                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            }
        } catch (err) {
            console.error("Erreur vérification statut:", err);
        }
    }, [onSuccess]);

    // Surveiller si la popup est fermée
    const watchPopupClosed = useCallback(() => {
        if (popupRef.current && popupRef.current.closed) {
            setWaitingForPayment(false);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            // Faire une dernière vérification
            if (invoiceToken) {
                checkPaymentStatus(invoiceToken);
            }
        }
    }, [invoiceToken, checkPaymentStatus]);

    const handleStartPayment = async () => {
        setLoading(true);
        setError(null);

        try {
            // Créer l'invoice
            const response = await fetch("/api/paydunya/create-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType,
                    description,
                    amount,
                    propertyId,
                    returnUrl: window.location.href + "?payment=success",
                    cancelUrl: window.location.href + "?payment=cancelled",
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Erreur lors de la création");
            }

            setInvoiceToken(data.token);

            // Ouvrir la popup
            const popupWidth = 500;
            const popupHeight = 700;
            const left = (window.screen.width - popupWidth) / 2;
            const top = (window.screen.height - popupHeight) / 2;

            popupRef.current = window.open(
                data.checkout_url,
                "PayDunyaPayment",
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popupRef.current) {
                throw new Error("Popup bloquée. Veuillez autoriser les popups pour ce site.");
            }

            setWaitingForPayment(true);

            // Démarrer le polling du statut
            pollIntervalRef.current = setInterval(() => {
                checkPaymentStatus(data.token);
                watchPopupClosed();
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
        }
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        setWaitingForPayment(false);
        onCancel?.();
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
        <div className="space-y-4">
            {/* Affichage du montant */}
            <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <span>Montant à payer :</span>
                <span className="font-bold text-lg text-primary">
                    {amount.toLocaleString()} FCFA
                </span>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {waitingForPayment ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-blue-800">
                            Paiement en cours dans la fenêtre popup...
                        </span>
                    </div>
                    <p className="text-xs text-center text-gray-500">
                        Complétez votre paiement dans la fenêtre qui s&apos;est ouverte.
                        <br />
                        Cette page se mettra à jour automatiquement.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCancel}
                    >
                        Annuler
                    </Button>
                </div>
            ) : (
                <>
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
                            <>
                                {buttonText}
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Une fenêtre s&apos;ouvrira pour le paiement sécurisé via PayDunya
                    </p>
                </>
            )}
        </div>
    );
}
