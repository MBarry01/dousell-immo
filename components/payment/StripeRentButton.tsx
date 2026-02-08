'use client';

import { useState } from 'react';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface StripeRentButtonProps {
    amount: number;
    periodMonth: number;
    periodYear: number;
    propertyAddress?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    className?: string;
}

/**
 * Stripe Payment Button for Rent
 * Creates a Stripe Checkout session and redirects to payment
 */
export function StripeRentButton({
    amount,
    periodMonth,
    periodYear,
    propertyAddress,
    onSuccess,
    onError,
    className = '',
}: StripeRentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);

        try {
            // DEBUG: Log what we're sending to the API
            console.log('💳 [StripeRentButton] Sending to rent-checkout:', {
                amount,
                periodMonth,
                periodYear,
                propertyAddress
            });

            const response = await fetch('/api/stripe/rent-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Required to send tenant session cookie
                body: JSON.stringify({
                    amount,
                    periodMonth,
                    periodYear,
                    propertyAddress,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la création du paiement');
            }

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
                onSuccess?.();
            } else {
                throw new Error('URL de paiement non reçue');
            }

        } catch (error) {
            console.error('Payment error:', error);
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            toast.error(message);
            onError?.(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 bg-[#635BFF] hover:bg-[#5851DB] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection vers Stripe...
                </>
            ) : (
                <>
                    <CreditCard className="w-5 h-5" />
                    Payer par Carte
                    <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                </>
            )}
        </button>
    );
}
