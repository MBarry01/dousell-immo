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
    MessageSquare,
    Calendar,
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
    leaseStatus?: string;
    billingDay?: number;
    ownerName?: string;
    recentPayments?: Array<{
        id: string;
        amount_due: number;
        amount_paid?: number | null;
        status: string;
        period_month: number;
        period_year: number;
        paid_at?: string | null;
        payment_method?: string | null;
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
    leaseStatus,
    billingDay = 5,
    ownerName,
    recentPayments = []
}: PaymentFormProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculs
    const pendingPayments = recentPayments.filter(p => p.status !== 'paid');
    const currentBalance = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);
    const isUpToDate = currentBalance === 0;

    // Get the oldest pending period
    const oldestPending = [...pendingPayments].sort((a, b) => {
        if (a.period_year !== b.period_year) return a.period_year - b.period_year;
        return a.period_month - b.period_month;
    })[0];

    // Determine period to pay
    const now = new Date();
    const targetPeriodMonth = oldestPending?.period_month ?? (now.getMonth() + 1);
    const targetPeriodYear = oldestPending?.period_year ?? now.getFullYear();
    const targetAmount = oldestPending?.amount_due ?? monthlyAmount;

    // Next rent calculation
    const getNextRentInfo = () => {
        const nextDate = new Date();
        // If billing day hasn't passed this month, next rent is this month
        // Otherwise, next month
        if (now.getDate() >= billingDay) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDate.setDate(billingDay);
        const monthName = MONTH_NAMES[nextDate.getMonth()];
        return `${billingDay} ${monthName.toLowerCase()} - ${formatCurrency(monthlyAmount)} FCFA`;
    };

    const getCurrentMonth = () => {
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">

            {/* ═══════════════════════════════════════════════════════════
                CARTE PRINCIPALE - Style Banking App
            ═══════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white shadow-2xl">
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isUpToDate ? 'bg-emerald-400' : 'bg-amber-400'}`} />

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
                            <span className="text-5xl font-bold tracking-tight text-white">
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

                    {/* CTA or Positive message */}
                    {isUpToDate ? (
                        <div className="w-full py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-300 font-medium text-sm">Aucun paiement dû</span>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 hover:text-zinc-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
                        >
                            {`Payer ${formatCurrency(currentBalance)} FCFA`}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}

                    {/* Prochain loyer */}
                    {isUpToDate && (
                        <div className="flex items-center gap-2 mt-3 text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">Prochain loyer : {getNextRentInfo()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Secure payment logos */}
            <div className="flex items-center justify-center">
                <img
                    src="/images/bouton-senegal.png"
                    alt="Paiement sécurisé - Wave, Orange Money, Carte"
                    className="h-10 w-auto object-contain"
                />
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

                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className={`font-semibold tabular-nums ${isPaid ? 'text-zinc-900' : 'text-amber-600'
                                                }`}>
                                                {formatCurrency(payment.amount_paid || payment.amount_due)}
                                                <span className="text-xs font-normal text-zinc-400 ml-1">F</span>
                                            </p>
                                            <div className="flex items-center gap-1 justify-end">
                                                {isPaid && payment.payment_method && (
                                                    <span className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded">
                                                        {payment.payment_method === 'stripe' ? 'Carte' :
                                                         payment.payment_method === 'kkiapay' ? 'Mobile' :
                                                         payment.payment_method === 'paydunya' ? 'Mobile' :
                                                         payment.payment_method}
                                                    </span>
                                                )}
                                                <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded ${isPaid
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {isPaid ? 'Payé' : 'En attente'}
                                                </span>
                                            </div>
                                        </div>
                                        {isPaid && (
                                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {recentPayments.length > 5 && (
                        <Link href="/locataire/paiements" className="block">
                            <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
                                Voir tout l&apos;historique
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500 flex-wrap">
                            <span>{leaseType || 'Logement'}</span>
                            <span>·</span>
                            <span>{formatCurrency(monthlyAmount)} F/mois</span>
                            {leaseStatus && (
                                <>
                                    <span>·</span>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        leaseStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
                                    }`}>
                                        {leaseStatus === 'active' ? 'Bail actif' : leaseStatus}
                                    </span>
                                </>
                            )}
                        </div>
                        {(leaseStartDate || ownerName) && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400 flex-wrap">
                                {leaseStartDate && (
                                    <span>Du {formatDate(leaseStartDate)}{leaseEndDate ? ` au ${formatDate(leaseEndDate)}` : ''}</span>
                                )}
                                {ownerName && (
                                    <>
                                        {leaseStartDate && <span>·</span>}
                                        <span>Propriétaire : {ownerName}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                CONTACT PROPRIÉTAIRE
            ═══════════════════════════════════════════════════════════ */}
            <Link href="/locataire/messages">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 text-sm">Contacter le propriétaire</p>
                        <p className="text-xs text-zinc-500">
                            {ownerName ? `Envoyer un message à ${ownerName}` : 'Envoyer un message'}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
            </Link>

            {/* ═══════════════════════════════════════════════════════════
                CTA STICKY MOBILE (si dette > 0)
            ═══════════════════════════════════════════════════════════ */}
            {!isUpToDate && (
                <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden safe-area-pb">
                    <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between rounded-t-xl shadow-2xl border-t border-zinc-700">
                        <div>
                            <p className="text-white font-semibold text-sm">{formatCurrency(currentBalance)} FCFA</p>
                            <p className="text-zinc-400 text-[10px]">{pendingPayments.length} échéance{pendingPayments.length > 1 ? 's' : ''}</p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-lg px-5 h-10 text-sm"
                        >
                            Payer maintenant
                        </Button>
                    </div>
                </div>
            )}

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
