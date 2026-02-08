'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Loader2,
    Filter,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RentPaymentModal } from '../components/RentPaymentModal';
import { getTenantPayments } from './actions';

type Payment = {
    id: string;
    amount_due: number;
    amount_paid?: number | null;
    status: string;
    period_month: number;
    period_year: number;
    paid_at?: string | null;
};

type PaymentData = {
    payments: Payment[];
    leaseId: string;
    monthlyAmount: number;
    tenantName: string;
    tenantEmail: string;
    propertyAddress: string;
};

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function TenantPaymentsPage() {
    const router = useRouter();
    const [data, setData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        const result = await getTenantPayments();
        setData(result);
        setLoading(false);
    };

    const formatCurrency = (amount?: number | null) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('fr-FR').format(amount);
    };

    const formatPeriod = (month: number, year: number) => {
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

    const getCurrentMonth = () => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    if (!data || data.payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Aucun paiement</h3>
                <p className="max-w-xs mt-2 text-sm text-zinc-500">
                    Votre historique de paiements apparaîtra ici.
                </p>
            </div>
        );
    }

    const pendingPayments = data.payments.filter(p => p.status !== 'paid');
    const currentBalance = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);
    const isUpToDate = currentBalance === 0;

    const filteredPayments = data.payments.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'paid') return p.status === 'paid';
        return p.status !== 'paid';
    });

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-zinc-900">Mes Paiements</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Historique et suivi de vos loyers</p>
            </div>

            {/* Balance Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">
                                {isUpToDate ? 'Solde actuel' : 'Montant à payer'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold tracking-tight">
                                    {formatCurrency(currentBalance)}
                                </span>
                                <span className="text-zinc-400">FCFA</span>
                            </div>
                        </div>
                        {isUpToDate && (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">À jour</span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl"
                    >
                        {isUpToDate ? 'Effectuer un paiement' : `Payer ${formatCurrency(currentBalance)} FCFA`}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                {[
                    { key: 'all', label: 'Tous' },
                    { key: 'paid', label: 'Payés' },
                    { key: 'pending', label: 'En attente' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as typeof filter)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filter === key
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="divide-y divide-zinc-100">
                    {filteredPayments.map((payment) => {
                        const isPaid = payment.status === 'paid';
                        const isOverdue = payment.status === 'overdue';
                        const period = formatPeriod(payment.period_month, payment.period_year);
                        const paidDate = formatPaidDate(payment.paid_at);

                        return (
                            <button
                                key={payment.id}
                                onClick={() => isPaid ? router.push(`/locataire/paiements/${payment.id}`) : undefined}
                                className={`w-full flex items-center justify-between px-4 py-4 hover:bg-zinc-50 transition-colors text-left ${
                                    isPaid ? 'cursor-pointer' : 'cursor-default'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isPaid
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : isOverdue
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-amber-50 text-amber-600'
                                    }`}>
                                        {isPaid
                                            ? <CheckCircle2 className="w-5 h-5" />
                                            : isOverdue
                                                ? <AlertTriangle className="w-5 h-5" />
                                                : <Clock className="w-5 h-5" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">
                                            Loyer {period}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {isPaid && paidDate
                                                ? `Payé le ${paidDate}`
                                                : isOverdue
                                                    ? 'Paiement en retard'
                                                    : 'En attente de paiement'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className={`font-semibold tabular-nums ${
                                            isPaid ? 'text-zinc-900' : isOverdue ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                            {formatCurrency(payment.amount_paid || payment.amount_due)}
                                            <span className="text-xs font-normal text-zinc-400 ml-1">F</span>
                                        </p>
                                        <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${
                                            isPaid
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : isOverdue
                                                    ? 'bg-red-50 text-red-700'
                                                    : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {isPaid ? 'Payé' : isOverdue ? 'En retard' : 'En attente'}
                                        </span>
                                    </div>
                                    {isPaid && (
                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredPayments.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-sm text-zinc-500">Aucun paiement dans cette catégorie</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <RentPaymentModal
                leaseId={data.leaseId}
                defaultAmount={currentBalance > 0 ? currentBalance : data.monthlyAmount}
                month={getCurrentMonth()}
                propertyAddress={data.propertyAddress}
                tenantName={data.tenantName}
                tenantEmail={data.tenantEmail}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </div>
    );
}
