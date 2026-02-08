'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Wrench,
    ChevronRight,
    Building2,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { RentPaymentModal } from './RentPaymentModal';

interface PaymentFormProps {
    leaseId: string;
    monthlyAmount: number;
    tenantName?: string;
    tenantEmail?: string;
    propertyAddress?: string;
    leaseStartDate?: string;
    leaseEndDate?: string;
    leaseType?: string;
    recentPayments?: Array<{
        id: string;
        amount_due: number;
        amount_paid?: number | null;
        status: string;
        period_month: number;
        period_year: number;
        paid_at?: string | null;
    }>;
}

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function PaymentForm({
    leaseId,
    monthlyAmount,
    tenantName,
    tenantEmail,
    propertyAddress,
    leaseStartDate,
    leaseEndDate,
    leaseType,
    recentPayments = []
}: PaymentFormProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculs
    const pendingPayments = recentPayments.filter(p => p.status !== 'paid');
    const paidPayments = recentPayments.filter(p => p.status === 'paid');
    const currentBalance = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);
    const isUpToDate = currentBalance === 0;

    // Get the oldest pending period (sort by year then month)
    const oldestPending = [...pendingPayments].sort((a, b) => {
        if (a.period_year !== b.period_year) return a.period_year - b.period_year;
        return a.period_month - b.period_month;
    })[0];

    // Determine period to pay: oldest pending or current month if up to date
    const now = new Date();
    // Use nullish coalescing (??) instead of || to handle period_month = 0 (guarantee)
    const targetPeriodMonth = oldestPending?.period_month ?? (now.getMonth() + 1);
    const targetPeriodYear = oldestPending?.period_year ?? now.getFullYear();
    const targetAmount = oldestPending?.amount_due ?? monthlyAmount;

    // DEBUG: Log payment target
    console.log('🎯 [PaymentForm] Target payment:', {
        targetPeriodMonth,
        targetPeriodYear,
        targetAmount,
        oldestPending: oldestPending ? { month: oldestPending.period_month, year: oldestPending.period_year, amount: oldestPending.amount_due } : null,
        pendingCount: pendingPayments.length
    });

    const getCurrentMonth = () => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    const formatCurrency = (amount?: number | null) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('fr-FR').format(amount);
    };

    const formatPeriod = (month: number, year: number) => {
        if (month === 0) return 'Garantie';
        return `${MONTH_NAMES[(month || 1) - 1]} ${year}`;
    };

    const formatPaidDate = (dateString?: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">

            {/* ═══════════════════════════════════════════════════════════
                CARTE PRINCIPALE - Style Banking App
            ═══════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white shadow-2xl">
                {/* Pattern subtil */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-zinc-400 text-sm">Bonjour,</p>
                            <h1 className="text-xl font-semibold text-white">{tenantName || 'Locataire'}</h1>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-bold text-black">
                            {tenantName?.[0]?.toUpperCase() || 'L'}
                        </div>
                    </div>

                    {/* Solde */}
                    <div className="mb-6">
                        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">
                            {isUpToDate ? 'Solde actuel' : 'Montant à payer'}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tight text-white">
                                {formatCurrency(currentBalance)}
                            </span>
                            <span className="text-zinc-400 text-lg">FCFA</span>
                        </div>

                        {isUpToDate ? (
                            <div className="inline-flex items-center gap-1.5 mt-3 text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Paiements à jour</span>
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm mt-2">
                                {pendingPayments.length} échéance{pendingPayments.length > 1 ? 's' : ''} en attente
                            </p>
                        )}
                    </div>

                    {/* CTA */}
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 hover:text-zinc-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
                    >
                        {isUpToDate ? 'Effectuer un paiement' : `Payer ${formatCurrency(currentBalance)} FCFA`}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 mt-3 text-zinc-500">
                        <Shield className="w-3 h-3" />
                        <span className="text-[11px]">Paiement sécurisé · Wave, Orange Money, Carte</span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                ACTIONS RAPIDES
            ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/locataire/documents">
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                            <FileText className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 text-sm">Documents</p>
                            <p className="text-xs text-zinc-500 truncate">Contrats & quittances</p>
                        </div>
                    </div>
                </Link>

                <Link href="/locataire/maintenance">
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                            <Wrench className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 text-sm">Signaler</p>
                            <p className="text-xs text-zinc-500 truncate">Incident ou panne</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                HISTORIQUE DES TRANSACTIONS
            ═══════════════════════════════════════════════════════════ */}
            {recentPayments.length > 0 && (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-100">
                        <h2 className="font-semibold text-zinc-900">Historique</h2>
                    </div>

                    <div className="divide-y divide-zinc-100">
                        {recentPayments.slice(0, 5).map((payment) => {
                            const isPaid = payment.status === 'paid';
                            const period = formatPeriod(payment.period_month, payment.period_year);
                            const paidDate = formatPaidDate(payment.paid_at);

                            return (
                                <button
                                    key={payment.id}
                                    onClick={() => isPaid ? router.push(`/locataire/paiements/${payment.id}`) : undefined}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 transition-colors text-left ${isPaid ? 'cursor-pointer' : 'cursor-default'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPaid
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {isPaid
                                                ? <CheckCircle2 className="w-4 h-4" />
                                                : <Clock className="w-4 h-4" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 text-sm">
                                                {payment.period_month === 0 ? period : `Loyer ${period}`}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {isPaid && paidDate
                                                    ? `Payé le ${paidDate}`
                                                    : 'En attente de paiement'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`font-semibold tabular-nums ${isPaid ? 'text-zinc-900' : 'text-amber-600'
                                            }`}>
                                            {formatCurrency(payment.amount_paid || payment.amount_due)}
                                            <span className="text-xs font-normal text-zinc-400 ml-1">F</span>
                                        </p>
                                        <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded ${isPaid
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {isPaid ? 'Payé' : 'En attente'}
                                        </span>
                                    </div>
                                    {isPaid && (
                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {recentPayments.length > 5 && (
                        <Link href="/locataire/paiements" className="block">
                            <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
                                Voir tout l'historique
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                INFOS LOGEMENT
            ═══════════════════════════════════════════════════════════ */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Votre logement</p>
                        <p className="font-medium text-zinc-900 text-sm truncate">
                            {propertyAddress || 'Adresse non renseignée'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                            <span>{leaseType || 'Logement'}</span>
                            <span>•</span>
                            <span>{formatCurrency(monthlyAmount)} F/mois</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <RentPaymentModal
                leaseId={leaseId}
                defaultAmount={targetAmount}
                month={getCurrentMonth()}
                propertyAddress={propertyAddress}
                tenantName={tenantName}
                tenantEmail={tenantEmail}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                targetPeriodMonth={targetPeriodMonth}
                targetPeriodYear={targetPeriodYear}
            />
        </div>
    );
}
