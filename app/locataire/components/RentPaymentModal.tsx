'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, CreditCard, Smartphone, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { PayDunyaRentButton } from '@/components/payment/PayDunyaRentButton';
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
            <DialogContent className="sm:max-w-md bg-white border-zinc-200 shadow-2xl rounded-[32px] p-0 overflow-hidden">
                <div className="p-8">
                    <DialogHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-[#0F172A] rounded-[24px] flex items-center justify-center mb-4 shadow-xl shadow-slate-900/10">
                            <Shield className="w-8 h-8 text-[#F4C430]" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tighter">
                            Paiement sécurisé
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium">
                            {periodLabel}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Amount Summary */}
                    <div className="bg-slate-50 rounded-[24px] p-6 my-6 border border-slate-100">
                        <div className="flex justify-between items-center text-left">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant du loyer</p>
                                {propertyAddress && (
                                    <p className="text-xs text-slate-500 mt-1 font-medium truncate max-w-[180px]">
                                        {propertyAddress}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-[#0F172A] tracking-tighter">
                                    {formatAmount(amount)}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase">FCFA</p>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        PAYMENT METHOD SELECTION
                    ═══════════════════════════════════════════════════════ */}
                    {paymentMethod === 'select' && (
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                Mode de règlement
                            </p>

                            {/* Stripe - Card Payment */}
                            <button
                                onClick={() => setPaymentMethod('stripe')}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-[#0F172A] hover:bg-slate-50 transition-all group active-press"
                            >
                                <div className="w-12 h-12 bg-[#0F172A] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6 text-[#F4C430]" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-[#0F172A] leading-none text-sm uppercase tracking-tight">Carte Bancaire</p>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Visa, Mastercard</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0F172A] transition-colors" />
                            </button>

                            {/* Mobile Money - KKiaPay */}
                            <button
                                onClick={() => setPaymentMethod('mobile')}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-200 hover:border-[#0F172A] hover:bg-slate-50 transition-all group active-press"
                            >
                                <div className="w-12 h-12 bg-[#F4C430] rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-[#F4C430]/20">
                                    <Smartphone className="w-6 h-6 text-[#0F172A]" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-black text-[#0F172A] leading-none text-sm uppercase tracking-tight">Mobile Money</p>
                                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Wave, Orange</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0F172A] transition-colors" />
                            </button>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        STRIPE PAYMENT
                    ═══════════════════════════════════════════════════════ */}
                    {paymentMethod === 'stripe' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setPaymentMethod('select')}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-widest transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Retour
                            </button>

                            <div className="bg-[#0F172A] rounded-3xl p-8 text-white shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#F4C430]">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <span className="font-black text-lg tracking-tight">Carte Bancaire</span>
                                </div>
                                <p className="text-sm text-slate-400 mb-8 font-medium">
                                    Transactions sécurisées et instantanées avec Stripe.
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

                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                Chiffrement SSL 256-bit
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        MOBILE MONEY PAYMENT
                    ═══════════════════════════════════════════════════════ */}
                    {paymentMethod === 'mobile' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setPaymentMethod('select')}
                                className="text-xs font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 uppercase tracking-widest transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Retour
                            </button>

                            <div className="bg-[#F4C430] rounded-3xl p-8 text-[#0F172A] shadow-xl shadow-[#F4C430]/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-[#0F172A]/10 rounded-xl flex items-center justify-center">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <span className="font-black text-lg tracking-tight">Mobile Money</span>
                                </div>
                                <p className="text-sm text-[#0F172A]/70 mb-8 font-medium">
                                    Payez simplement avec Wave ou Orange Money via PayDunya.
                                </p>
                                <PayDunyaRentButton
                                    amount={amount}
                                    leaseId={leaseId}
                                    tenantName={tenantName}
                                    tenantEmail={tenantEmail}
                                    periodMonth={periodMonth}
                                    periodYear={periodYear}
                                    onSuccess={() => {
                                        toast.success("Redirection vers PayDunya...");
                                    }}
                                    onError={(error) => {
                                        toast.error(error);
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <Shield className="w-3 h-3 text-emerald-500" />
                                Paiement local sécurisé
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

