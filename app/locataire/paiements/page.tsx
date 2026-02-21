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
    ChevronRight,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RentPaymentModal } from '../components/RentPaymentModal';
import { getTenantPayments } from './actions';
import { PageHeaderSkeleton, ListSkeleton } from '../components/TenantSkeletons';
import { Skeleton } from '@/components/ui/skeleton';

type Payment = {
    id: string;
    amount_due: number;
    amount_paid?: number | null;
    status: string;
    period_month: number;
    period_year: number;
    paid_at?: string | null;
    payment_method?: string | null;
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
            <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <PageHeaderSkeleton />
                <Skeleton className="w-full h-32 rounded-[2.5rem]" variant="luxury" />
                <div className="flex gap-3 mb-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="w-20 h-10 rounded-2xl" variant="default" />)}
                </div>
                <ListSkeleton count={4} />
            </div>
        );
    }

    if (!data || data.payments.length === 0) {
        return (
            <div className="w-full max-w-lg mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 py-20 px-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Clock className="w-10 h-10 text-[#0F172A]/20" />
                    </div>
                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Aucun paiement</h3>
                    <p className="max-w-xs mx-auto mt-2 text-sm font-black text-slate-500 uppercase tracking-widest opacity-60">
                        Votre historique de paiements apparaîtra ici dès le premier mois
                    </p>
                </div>
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
        <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase">Mes Paiements</h1>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-70">Historique et suivi de vos loyers</p>
            </div>

            {/* Balance Card - Premium Design */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0F172A] p-8 text-white shadow-2xl shadow-slate-900/20 group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#F4C430]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F4C430]/20 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-800/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[#F4C430] text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                {isUpToDate ? 'Solde actuel' : 'Montant total dû'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter tabular-nums">
                                    {formatCurrency(currentBalance)}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FCFA</span>
                            </div>
                        </div>
                        {isUpToDate && (
                            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-white animate-in zoom-in duration-500">
                                <CheckCircle2 className="w-4 h-4 text-[#F4C430]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[9px]">À jour</span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full h-14 bg-white hover:bg-slate-100 text-[#0F172A] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-black/20 group active-press transition-all"
                    >
                        {isUpToDate ? 'Paiement Anticipé' : `Régler ${formatCurrency(currentBalance)} F`}
                        <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>

            {/* Filters - Pill Style */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { key: 'all', label: 'Tous' },
                    { key: 'paid', label: 'Payés' },
                    { key: 'pending', label: 'En attente' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as typeof filter)}
                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === key
                            ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-900/10'
                            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Payments List */}
            <div className="space-y-8">
                {(() => {
                    const byYear = filteredPayments.reduce<Record<number, Payment[]>>((acc, p) => {
                        const year = p.period_year;
                        if (!acc[year]) acc[year] = [];
                        acc[year].push(p);
                        return acc;
                    }, {});

                    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

                    if (years.length === 0) {
                        return (
                            <div className="bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 py-16 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucun paiement trouvé</p>
                            </div>
                        );
                    }

                    return years.map(year => (
                        <div key={year} className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-px flex-1 bg-slate-100" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{year}</h3>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            <div className="grid gap-3">
                                {byYear[year].map((payment) => {
                                    const isPaid = payment.status === 'paid';
                                    const isOverdue = payment.status === 'overdue';
                                    const period = formatPeriod(payment.period_month, payment.period_year);
                                    const paidDate = formatPaidDate(payment.paid_at);
                                    const methodLabel = payment.payment_method === 'stripe' ? 'STRIPE' :
                                        payment.payment_method === 'kkiapay' ? 'MOBILE' :
                                            payment.payment_method?.toUpperCase() || null;

                                    return (
                                        <div key={payment.id} className="group relative">
                                            <button
                                                onClick={() => isPaid ? router.push(`/locataire/paiements/${payment.id}`) : undefined}
                                                className={`w-full bg-white rounded-[2rem] border border-slate-200 p-5 flex items-center justify-between text-left transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 ${isPaid ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isPaid
                                                        ? 'bg-slate-50 text-[#0F172A]'
                                                        : isOverdue
                                                            ? 'bg-red-50 text-red-600'
                                                            : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {isPaid
                                                            ? <CheckCircle2 className="w-6 h-6 text-[#F4C430]" />
                                                            : isOverdue
                                                                ? <AlertTriangle className="w-6 h-6" />
                                                                : <Clock className="w-6 h-6" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#0F172A] tracking-tighter uppercase mb-1">
                                                            {period}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">
                                                                {isPaid && paidDate
                                                                    ? `Payé le ${paidDate}`
                                                                    : isOverdue
                                                                        ? 'Paiement en retard'
                                                                        : 'Attente règlement'
                                                                }
                                                            </p>
                                                            {isPaid && methodLabel && (
                                                                <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tight">
                                                                    {methodLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 justify-end mb-1">
                                                            <span className={`text-[12px] font-black tracking-tight tabular-nums ${isPaid ? 'text-[#0F172A]' : isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                                                                {formatCurrency(payment.amount_paid || payment.amount_due)}
                                                            </span>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase">F</span>
                                                        </div>
                                                        <span className={`inline-flex text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isPaid
                                                            ? 'bg-slate-100 text-[#0F172A]'
                                                            : isOverdue
                                                                ? 'bg-red-50 text-red-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                            {isPaid ? 'VALIDE' : isOverdue ? 'RETARD' : 'ATTENTE'}
                                                        </span>
                                                    </div>
                                                    {isPaid && (
                                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0F172A] transition-colors" />
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
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
