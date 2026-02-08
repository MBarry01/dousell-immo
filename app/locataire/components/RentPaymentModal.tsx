'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, CreditCard, Smartphone, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import KKiaPayWidget from '@/components/payment/KKiaPayWidget';
import { StripeRentButton } from '@/components/payment/StripeRentButton';

interface RentPaymentModalProps {
    leaseId: string;
    defaultAmount: number;
    month?: string;
    propertyAddress?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantName?: string;
    tenantEmail?: string;
    /** Period month to pay for (1-12). If not provided, uses current month */
    targetPeriodMonth?: number;
    /** Period year to pay for. If not provided, uses current year */
    targetPeriodYear?: number;
}

type PaymentMethod = 'select' | 'stripe' | 'mobile';

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const getPeriodLabel = (month: number, year: number) => {
    if (month === 0) return 'Garantie / Dépôt de caution';
    return `${MONTH_NAMES[month - 1]} ${year}`;
};

export function RentPaymentModal({
    leaseId,
    defaultAmount,
    month,
    propertyAddress,
    open,
    onOpenChange,
    tenantName = "Locataire",
    tenantEmail = "",
    targetPeriodMonth,
    targetPeriodYear,
}: RentPaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('select');
    const amount = defaultAmount;

    // Reset to selection when modal closes
    useEffect(() => {
        if (!open) {
            setPaymentMethod('select');
        }
    }, [open]);

    // Use target period if provided, otherwise default to current month
    const now = new Date();
    const periodMonth = targetPeriodMonth || (now.getMonth() + 1);
    const periodYear = targetPeriodYear || now.getFullYear();

    const formatAmount = (amt: number) => new Intl.NumberFormat('fr-FR').format(amt);
    const periodLabel = getPeriodLabel(periodMonth, periodYear);

    // DEBUG: Log modal period
    console.log('🔵 [RentPaymentModal] Period being used:', {
        periodMonth,
        periodYear,
        periodLabel,
        targetPeriodMonth,
        targetPeriodYear,
        amount: defaultAmount
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white border-zinc-200 shadow-2xl">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-3">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-zinc-900">
                        Paiement du loyer
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        {periodLabel}
                    </DialogDescription>
                </DialogHeader>

                {/* Amount Summary */}
                <div className="bg-zinc-50 rounded-xl p-4 my-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-zinc-500">Montant à payer</p>
                            {propertyAddress && (
                                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">
                                    {propertyAddress}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-zinc-900">
                                {formatAmount(amount)}
                            </p>
                            <p className="text-xs text-zinc-400">FCFA</p>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    PAYMENT METHOD SELECTION
                ═══════════════════════════════════════════════════════ */}
                {paymentMethod === 'select' && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-zinc-700 mb-2">
                            Choisissez votre mode de paiement
                        </p>

                        {/* Stripe - Card Payment */}
                        <button
                            onClick={() => setPaymentMethod('stripe')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
                        >
                            <div className="w-12 h-12 bg-[#635BFF]/10 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-[#635BFF]" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-zinc-900">Carte Bancaire</p>
                                <p className="text-xs text-zinc-500">Visa, Mastercard via Stripe</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                        </button>

                        {/* Mobile Money - KKiaPay */}
                        <button
                            onClick={() => setPaymentMethod('mobile')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
                        >
                            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-zinc-900">Mobile Money</p>
                                <p className="text-xs text-zinc-500">Wave, Orange Money</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    STRIPE PAYMENT
                ═══════════════════════════════════════════════════════ */}
                {paymentMethod === 'stripe' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setPaymentMethod('select')}
                            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Changer de méthode
                        </button>

                        <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-5 h-5 text-[#635BFF]" />
                                <span className="font-semibold text-zinc-900">Paiement par carte</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-4">
                                Vous serez redirigé vers la page de paiement sécurisée Stripe.
                            </p>
                            <StripeRentButton
                                amount={amount}
                                periodMonth={periodMonth}
                                periodYear={periodYear}
                                propertyAddress={propertyAddress}
                                onSuccess={() => {
                                    toast.success("Redirection vers Stripe...");
                                }}
                                onError={(error) => {
                                    toast.error(error);
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                            <Shield className="w-3 h-3" />
                            Paiement sécurisé par Stripe
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                    MOBILE MONEY PAYMENT
                ═══════════════════════════════════════════════════════ */}
                {paymentMethod === 'mobile' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setPaymentMethod('select')}
                            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Changer de méthode
                        </button>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Smartphone className="w-5 h-5 text-amber-600" />
                                <span className="font-semibold text-zinc-900">Mobile Money</span>
                            </div>
                            <p className="text-xs text-zinc-600 mb-4">
                                Payez avec Wave ou Orange Money directement depuis votre téléphone.
                            </p>
                            <KKiaPayWidget
                                amount={amount}
                                leaseId={leaseId}
                                tenantName={tenantName}
                                tenantEmail={tenantEmail}
                                periodMonth={periodMonth}
                                periodYear={periodYear}
                                onSuccess={() => {
                                    toast.success("Paiement confirmé !");
                                    onOpenChange(false);
                                }}
                                onError={(error) => {
                                    toast.error(error);
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                            <Shield className="w-3 h-3" />
                            Paiement sécurisé par KKiaPay
                        </div>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
