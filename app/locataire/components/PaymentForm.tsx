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
        <div className="w-full mx-auto space-y-8 pb-32">
            {/* ═══════════════════════════════════════════════════════════
                 BENTO GRID LAYOUT
                ═══════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* SOLDE & PAIEMENT (Main Card) - Span 8 */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-xl transition-all hover:shadow-2xl active-press p-6 md:p-8">
                        {/* Status bar top */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isUpToDate ? 'bg-slate-200' : 'bg-[#F4C430]'}`} />

                        <div className="relative flex flex-col md:flex-row md:items-stretch justify-between gap-6 md:gap-8">
                            <div className="flex-1">
                                <header className="flex items-center gap-3 mb-6 pt-2">
                                    <div className="w-12 h-12 rounded-xl bg-[#0F172A] flex items-center justify-center font-black text-white text-lg shadow-lg ring-2 ring-slate-50 transition-transform group-hover:scale-105">
                                        {tenantName?.[0]?.toUpperCase() || 'L'}
                                    </div>
                                    <div className="space-y-0">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Espace Locataire</p>
                                        <h1 className="text-xl font-black text-[#0F172A] tracking-tighter leading-none">Bonjour, {tenantName?.split(' ')[0] || 'Locataire'}</h1>
                                    </div>
                                </header>

                                {/* Terminal Screen Display */}
                                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-inner relative group/screen">
                                    <div className="absolute top-4 right-4 w-6 h-6 opacity-10 group-hover/screen:opacity-30 transition-opacity">
                                        <div className="w-full h-1 bg-[#0F172A] rounded-full mb-1"></div>
                                        <div className="w-2/3 h-1 bg-[#0F172A] rounded-full"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                            {isUpToDate ? 'Solde actuel' : 'Montant à régler'}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black text-[#0F172A] tracking-tighter">
                                                {formatCurrency(currentBalance)}
                                            </span>
                                            <span className="text-slate-400 text-lg font-black italic">FCFA</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        {isUpToDate ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-900 rounded-lg border border-slate-200">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[#F4C430]" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Compte à jour</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/50 text-amber-700 rounded-lg border border-amber-100">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">{pendingPayments.length} Échéance{pendingPayments.length > 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse"></div>
                                            <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse delay-75"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-64 flex flex-col gap-3 self-end">
                                {!isUpToDate ? (
                                    <Button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full h-14 bg-[#0F172A] hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 text-sm group uppercase tracking-widest"
                                    >
                                        Payer maintenant
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Éprochaine échéance</span>
                                        </div>
                                        <p className="text-[#0F172A] font-black text-sm tracking-tight leading-none">{getNextRentInfo().split('-')[0]}</p>
                                        <p className="text-slate-400 text-[10px] font-bold">{getNextRentInfo().split('-')[1]}</p>
                                    </div>
                                )}

                                {!isUpToDate && (
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Échéance</span>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
                                        </div>
                                        <p className="text-[#0F172A] font-black text-sm tracking-tight leading-none">{getNextRentInfo().split('-')[0]}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-center pt-1 opacity-40 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0 cursor-pointer">
                                    <img
                                        src="/images/bouton-senegal.png"
                                        alt="Paiement sécurisé"
                                        className="h-5 w-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TRANSACTIONS HISTORIQUE - Span 8 internal */}
                    {recentPayments.length > 0 && (
                        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <h2 className="font-black text-[#0F172A] tracking-tight">Activité récente</h2>
                                </div>
                                {recentPayments.length > 5 && (
                                    <Link href="/locataire/paiements" className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] hover:opacity-70 transition-opacity">
                                        Voir tout
                                    </Link>
                                )}
                            </div>

                            <div className="divide-y divide-slate-50">
                                {recentPayments.slice(0, 5).map((payment) => {
                                    const isPaid = payment.status === 'paid';
                                    const period = formatPeriod(payment.period_month, payment.period_year);
                                    const paidDate = formatPaidDate(payment.paid_at);

                                    return (
                                        <button
                                            key={payment.id}
                                            onClick={() => isPaid ? router.push(`/locataire/paiements/${payment.id}`) : undefined}
                                            className={`w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-all text-left group ${isPaid ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${isPaid
                                                    ? 'bg-slate-50 text-[#0F172A] group-hover:bg-[#0F172A] group-hover:text-white'
                                                    : 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                                                    }`}>
                                                    {isPaid
                                                        ? <CheckCircle2 className="w-5 h-5 transition-transform group-hover:rotate-12 text-[#F4C430] group-hover:text-white" />
                                                        : <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse group-hover:bg-white" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#0F172A] text-sm tracking-tight group-hover:translate-x-1 transition-transform">
                                                        {payment.period_month === 0 ? period : `Loyer ${period}`}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mt-0.5 group-hover:translate-x-1 transition-transform delay-75">
                                                        {isPaid && paidDate
                                                            ? `Validé le ${paidDate}`
                                                            : 'Échéance enregistrée'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-right">
                                                <div>
                                                    <p className={`font-black tabular-nums text-lg ${isPaid ? 'text-[#0F172A]' : 'text-amber-600'}`}>
                                                        {formatCurrency(payment.amount_paid || payment.amount_due)}
                                                        <span className="text-[10px] font-black text-slate-400 ml-1">FCFA</span>
                                                    </p>
                                                    <div className="flex items-center gap-1.5 justify-end mt-1">
                                                        {isPaid && payment.payment_method && (
                                                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tight">
                                                                {payment.payment_method}
                                                            </span>
                                                        )}
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${isPaid
                                                            ? 'bg-slate-100 text-[#0F172A]'
                                                            : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                            {isPaid ? 'Payé' : 'À payer'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isPaid && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0F172A] group-hover:translate-x-1 transition-all" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR BENTO - Span 4 */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ACTIONS RAPIDES */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/locataire/documents" className="h-full">
                            <div className="group flex flex-col items-center justify-center gap-4 p-7 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:border-[#0F172A] hover:bg-slate-50/50 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 active-press h-full">
                                <div className="w-16 h-16 rounded-[22px] bg-slate-100 flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300 shadow-inner group-hover:rotate-12">
                                    <FileText className="w-7 h-7 text-[#0F172A] group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-[#0F172A] text-base tracking-tight mb-1">Documents</p>
                                    <p className="text-[10px] font-black text-[#000] uppercase tracking-[0.2em] group-hover:text-[#0F172A] transition-colors">Quittances</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/locataire/maintenance" className="h-full">
                            <div className="group flex flex-col items-center justify-center gap-4 p-7 rounded-[2.5rem] bg-slate-50 border border-slate-200 shadow-sm hover:border-[#F4C430] hover:bg-white hover:scale-[1.02] hover:shadow-xl hover:shadow-[#F4C430]/10 transition-all duration-300 active-press h-full">
                                <div className="w-16 h-16 rounded-[22px] bg-white flex items-center justify-center group-hover:bg-[#F4C430] group-hover:text-[#0F172A] transition-all duration-300 shadow-sm group-hover:-rotate-12">
                                    <Wrench className="w-7 h-7 text-[#F4C430] group-hover:text-[#0F172A] transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-[#0F172A] text-base tracking-tight mb-1">Signaler</p>
                                    <p className="text-[10px] font-black text-[#000] uppercase tracking-[0.2em] group-hover:text-[#0F172A] transition-colors">Une panne</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* INFOS LOGEMENT */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A]">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <h2 className="font-black text-[#0F172A] tracking-tight">Votre logement</h2>
                            </div>
                            <span className="px-3 py-1 bg-[#F4C430]/10 border border-[#F4C430]/20 rounded-full text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Actif</span>
                        </div>

                        <div className="space-y-6">
                            <div className="relative pl-6 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-[#F4C430] before:rounded-full">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Localisation</p>
                                <p className="font-black text-[#0F172A] text-sm leading-tight max-w-[200px]">
                                    {propertyAddress || 'Adresse non renseignée'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type de bail</p>
                                    <p className="font-black text-[#0F172A] text-sm">{leaseType || 'Standard'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Loyer total</p>
                                    <p className="font-black text-[#0F172A] text-sm">{formatCurrency(monthlyAmount)} F</p>
                                </div>
                            </div>

                            {(leaseStartDate || ownerName) && (
                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    {leaseStartDate && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Début du bail</span>
                                            <span className="text-[#0F172A] font-black">{formatDate(leaseStartDate)}</span>
                                        </div>
                                    )}
                                    {ownerName && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Propriétaire</span>
                                            <span className="text-[#0F172A] font-black">{ownerName}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONTACT RAPIDE */}
                    <Link href="/locataire/messages" className="block">
                        <div className="group flex items-center justify-between p-5 rounded-[2.5rem] bg-[#F4C430] text-[#0F172A] shadow-xl shadow-[#F4C430]/10 hover:shadow-2xl hover:scale-[1.02] transition-all active-press">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#0F172A]/10 flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-[#F4C430] group-hover:rotate-12 shadow-sm transition-all duration-300 text-[#0F172A]">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-base tracking-tight">Message</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#000] group-hover:text-[#0F172A] transition-colors">Réponse rapide</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* CTA STICKY MOBILE (si dette > 0) */}
            {!isUpToDate && (
                <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-10">
                    <div className="bg-zinc-900/95 backdrop-blur-xl px-5 py-4 flex items-center justify-between rounded-3xl shadow-2xl border border-white/10 ring-1 ring-black/5">
                        <div>
                            <p className="text-white font-black text-lg tracking-tight">{formatCurrency(currentBalance)} <span className="text-[10px] font-bold opacity-50">FCFA</span></p>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{pendingPayments.length} ÉCHÉANCE{pendingPayments.length > 1 ? 'S' : ''}</p>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white hover:bg-zinc-100 text-zinc-900 font-black rounded-2xl px-6 h-12 text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                        >
                            Régler
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

