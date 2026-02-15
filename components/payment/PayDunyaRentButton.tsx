'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface PayDunyaRentButtonProps {
    amount: number;
    leaseId: string;
    tenantName: string;
    tenantEmail: string;
    periodMonth: number;
    periodYear: number;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function PayDunyaRentButton({
    amount,
    leaseId,
    tenantName,
    tenantEmail,
    periodMonth,
    periodYear,
    onSuccess,
    onError,
}: PayDunyaRentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/paydunya/create-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceType: 'rent_payment',
                    description: `Loyer ${periodMonth}/${periodYear}`,
                    amount,
                    propertyId: leaseId,
                    returnUrl: `${window.location.origin}/locataire/paiement-succes?provider=paydunya`,
                    cancelUrl: `${window.location.origin}/locataire?status=cancel`,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.checkout_url) {
                throw new Error(data.error || 'Impossible de créer le paiement');
            }

            onSuccess?.();
            window.location.href = data.checkout_url;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur inconnue';
            toast.error(message);
            onError?.(message);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#F4C430] to-[#D4AF37] text-black font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg
                        className="animate-spin h-5 w-5"
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
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Redirection en cours...
                </span>
            ) : (
                `Payer ${amount.toLocaleString('fr-FR')} FCFA`
            )}
        </button>
    );
}
