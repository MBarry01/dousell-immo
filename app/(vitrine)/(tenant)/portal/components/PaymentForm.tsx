'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, CheckCircle, AlertCircle, FileText, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
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
        period_start: string;
        paid_at?: string | null;
    }>;
}

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAllPayments, setShowAllPayments] = useState(false);

    // Calculer le solde actuel
    const pendingPayments = recentPayments.filter(p => p.status !== 'paid');
    const currentBalance = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);
    const isUpToDate = currentBalance === 0;

    const getCurrentMonth = () => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatCurrency = (amount?: number | null) => {
        if (!amount) return '0';
        return amount.toLocaleString('fr-FR');
    };

    const visiblePayments = showAllPayments ? recentPayments : recentPayments.slice(0, 3);

    return (
        <div className="space-y-4 max-w-lg mx-auto">
            {/* HERO : Solde & CTA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
                {/* Header Nom */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#F4C430] flex items-center justify-center">
                        <span className="text-black font-bold text-lg">{tenantName?.[0] || 'L'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-400">Bienvenue,</p>
                        <h1 className="text-lg font-semibold text-white truncate">{tenantName || 'Locataire'}</h1>
                    </div>
                </div>

                {/* KPI Solde */}
                <div className="text-center mb-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        {isUpToDate ? 'Solde' : 'Montant dû'}
                    </p>
                    <div className={`text-4xl sm:text-5xl font-bold ${isUpToDate ? 'text-[#F4C430]' : 'text-white'}`}>
                        {formatCurrency(isUpToDate ? 0 : currentBalance)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">FCFA</p>

                    {isUpToDate ? (
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-[#F4C430]" />
                            <span className="text-xs font-medium text-[#F4C430]">À jour</span>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2">
                            {pendingPayments.length} paiement(s) en attente
                        </p>
                    )}
                </div>

                {/* CTA */}
                <Button
                    onClick={() => setIsModalOpen(true)}
                    size="lg"
                    className="w-full h-14 text-base font-semibold bg-[#F4C430] hover:bg-[#D4A420] text-black"
                >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isUpToDate ? 'Effectuer un paiement' : `Payer ${formatCurrency(currentBalance)} FCFA`}
                </Button>

                <p className="text-[10px] text-center text-slate-500 mt-2">
                    Paiement sécurisé • Wave, Orange Money, Carte
                </p>
            </div>

            {/* ACTIONS RAPIDES */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/portal/documents" className="block">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors h-full">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Documents</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Contrats & quittances</p>
                    </div>
                </Link>

                <Link href="/portal/maintenance" className="block">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors h-full">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
                            <Wrench className="w-5 h-5 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Signaler</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Incident ou panne</p>
                    </div>
                </Link>
            </div>

            {/* HISTORIQUE */}
            {recentPayments.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Historique</h3>
                        <Calendar className="w-4 h-4 text-slate-500" />
                    </div>

                    <div className="space-y-2">
                        {visiblePayments.map((payment) => {
                            const isPaid = payment.status === 'paid';
                            const date = new Date(payment.period_start);
                            const monthYear = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPaid
                                            ? 'bg-[#F4C430]/10 text-[#F4C430]'
                                            : 'bg-slate-700 text-slate-400'
                                            }`}>
                                            {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white capitalize">{monthYear}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {isPaid ? 'Payé' : 'En attente'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                        {formatCurrency(payment.amount_paid || payment.amount_due)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {recentPayments.length > 3 && (
                        <button
                            onClick={() => setShowAllPayments(!showAllPayments)}
                            className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                        >
                            {showAllPayments ? (
                                <>Voir moins <ChevronUp className="w-3.5 h-3.5" /></>
                            ) : (
                                <>Voir tout ({recentPayments.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* DÉTAILS BAIL (Footer) */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Adresse</p>
                <p className="text-sm text-white truncate">{propertyAddress || 'Non renseignée'}</p>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/50">
                    <div>
                        <p className="text-[10px] text-slate-500">Début</p>
                        <p className="text-xs text-slate-300">{formatDate(leaseStartDate)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500">Fin</p>
                        <p className="text-xs text-slate-300">{formatDate(leaseEndDate)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500">Type</p>
                        <p className="text-xs text-slate-300">{leaseType || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <RentPaymentModal
                leaseId={leaseId}
                defaultAmount={currentBalance > 0 ? currentBalance : monthlyAmount}
                month={getCurrentMonth()}
                propertyAddress={propertyAddress}
                tenantName={tenantName}
                tenantEmail={tenantEmail}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </div>
    );
}
