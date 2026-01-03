"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PayDunyaSDKFormProps {
    serviceType: string;
    description: string;
    amount: number;
    propertyId?: string;
    onSuccess?: (receiptUrl: string) => void;
    onCancel?: () => void;
}

type PaymentStep = "PHONE_INPUT" | "OTP_VERIFICATION" | "SUCCESS" | "ERROR";

export default function PayDunyaSDKForm({
    serviceType,
    description,
    amount,
    propertyId,
    onSuccess,
    onCancel,
}: PayDunyaSDKFormProps) {
    const [step, setStep] = useState<PaymentStep>("PHONE_INPUT");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [phone, setPhone] = useState("");
    const [operator, setOperator] = useState("wave-senegal");
    const [otpCode, setOtpCode] = useState("");
    const [oprToken, setOprToken] = useState<string | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    const formatPhoneNumber = (number: string) => {
        return number.replace(/\s/g, "").replace(/^\+221/, "");
    };

    // Étape 1: Créer la demande OPR
    const handleInitializePayment = async () => {
        if (!phone) {
            setError("Veuillez saisir votre numéro de téléphone");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formattedPhone = formatPhoneNumber(phone);

            const response = await fetch("/api/paydunya/opr-sdk/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceType,
                    description,
                    amount,
                    propertyId,
                    phone: formattedPhone,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Erreur lors de l'initialisation");
            }

            setOprToken(data.oprToken);
            setStep("OTP_VERIFICATION");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
            setStep("ERROR");
        } finally {
            setLoading(false);
        }
    };

    // Étape 2: Confirmer avec le code OTP
    const handleConfirmPayment = async () => {
        if (!otpCode) {
            setError("Veuillez saisir le code reçu par SMS");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/paydunya/opr-sdk/charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oprToken,
                    code: otpCode,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Code invalide ou erreur de paiement");
            }

            setReceiptUrl(data.receipt_url);
            setStep("SUCCESS");

            if (onSuccess && data.receipt_url) {
                onSuccess(data.receipt_url);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    // État Succès
    if (step === "SUCCESS") {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-700">Paiement Réussi !</h3>
                <p className="text-gray-600">
                    Votre transaction a été validée avec succès.
                </p>

                {receiptUrl && (
                    <Button variant="outline" className="mt-4" asChild>
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                            Voir le reçu électronique
                        </a>
                    </Button>
                )}

                <Button onClick={onCancel} className="mt-2 w-full">
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex items-center space-x-2 border-b pb-4 mb-4">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Paiement Mobile (SDK Officiel)</h3>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                <span>Montant à payer :</span>
                <span className="font-bold text-lg text-primary">{amount.toLocaleString()} FCFA</span>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {(step === "PHONE_INPUT" || step === "ERROR") && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="space-y-2">
                        <Label>Opérateur</Label>
                        <Select value={operator} onValueChange={setOperator}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir un opérateur" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wave-senegal">Wave</SelectItem>
                                <SelectItem value="orange-money-senegal">Orange Money</SelectItem>
                                <SelectItem value="free-money-senegal">Free Money</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Numéro de téléphone</Label>
                        <Input
                            type="tel"
                            placeholder="Ex: 77 123 45 67"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Un code OTP sera envoyé à ce numéro.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleInitializePayment}
                        disabled={loading || !phone}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi du code...
                            </>
                        ) : (
                            "Recevoir le code OTP"
                        )}
                    </Button>
                </div>
            )}

            {step === "OTP_VERIFICATION" && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-800">
                            Un code de confirmation a été envoyé au <strong>{phone}</strong>.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label>Code de validation (OTP)</Label>
                        <Input
                            type="text"
                            placeholder="Entrez le code reçu"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Code test : <strong>123456</strong>
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleConfirmPayment}
                        disabled={loading || !otpCode}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validation en cours...
                            </>
                        ) : (
                            "Valider le paiement"
                        )}
                    </Button>

                    <Button variant="ghost" className="w-full text-xs" onClick={() => setStep("PHONE_INPUT")}>
                        Changer le numéro
                    </Button>
                </div>
            )}

            {onCancel && (
                <Button variant="outline" className="w-full mt-2" onClick={onCancel} disabled={loading}>
                    Annuler
                </Button>
            )}
        </div>
    );
}
