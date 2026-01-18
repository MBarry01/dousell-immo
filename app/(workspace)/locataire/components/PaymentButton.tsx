'use client';

import { useState } from 'react';
import { processRentalPayment } from '../payments/actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentButton({ leaseId }: { leaseId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const result = await processRentalPayment(leaseId);

            // Gestion des différents formats de retour
            if ('error' in result && result.error) {
                toast.error(result.error);
                setIsLoading(false);
            } else if ('success' in result && result.success && result.data?.url) {
                // Redirection vers PayDunya
                window.location.href = result.data.url;
            } else if ('success' in result && !result.success && 'error' in result) {
                toast.error(result.error || "Erreur lors du paiement");
                setIsLoading(false);
            } else {
                toast.error("Erreur technique");
                setIsLoading(false);
            }
        } catch {
            toast.error("Erreur technique lors du paiement.");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-white text-red-600 font-bold py-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? 'Redirection...' : 'Payer maintenant'}
        </button>
    );
}
