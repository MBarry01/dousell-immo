'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, CheckCircle, AlertCircle, FileText, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { RentPaymentModal } from './RentPaymentModal';
import { useTheme } from '@/components/workspace/providers/theme-provider';

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
    const { isDark } = useTheme();

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
        <div className="space-y-4 w-full max-w-2xl mx-auto px-4 lg:px-0">
            {/* HERO : Solde & CTA */}
            <div className={`rounded-2xl p-5 sm:p-6 border transition-colors ${
                isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-gray-200 shadow-sm'
            }`}>
                {/* Header Nom */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#F4C430] flex items-center justify-center">
                        <span className="text-black font-bold text-lg">{tenantName?.[0] || 'L'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Bienvenue,</p>
                        <h1 className="text-lg font-semibold text-foreground truncate">{tenantName || 'Locataire'}</h1>
                    </div>
                </div>

                {/* KPI Solde */}
                <div className="text-center mb-5">
                    <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {isUpToDate ? 'Solde' : 'Montant dû'}
                    </p>
                    <div className={`text-4xl sm:text-5xl font-bold ${isUpToDate ? 'text-[#F4C430]' : 'text-foreground'}`}>
                        {formatCurrency(isUpToDate ? 0 : currentBalance)}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>FCFA</p>

                    {isUpToDate ? (
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-[#F4C430]" />
                            <span className="text-xs font-medium text-[#F4C430]">À jour</span>
                        </div>
                    ) : (
                        <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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

                <p className={`text-[10px] text-center mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    Paiement sécurisé • Wave, Orange Money, Carte
                </p>
            </div>

            {/* ACTIONS RAPIDES */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/locataire/documents" className="block">
                    <div className={`rounded-xl p-5 h-full border transition-all duration-200 hover:scale-[1.02] ${
                        isDark
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                            isDark ? 'bg-slate-800' : 'bg-gray-100'
                        }`}>
                            <FileText className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Documents</h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Contrats & quittances</p>
                    </div>
                </Link>

                <Link href="/locataire/maintenance" className="block">
                    <div className={`rounded-xl p-5 h-full border transition-all duration-200 hover:scale-[1.02] ${
                        isDark
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                            isDark ? 'bg-slate-800' : 'bg-gray-100'
                        }`}>
                            <Wrench className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Signaler</h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Incident ou panne</p>
                    </div>
                </Link>
            </div>

            {/* HISTORIQUE */}
            {recentPayments.length > 0 && (
                <div className={`rounded-xl p-5 border ${
                    isDark
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-gray-200 shadow-sm'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-foreground">Historique</h3>
                        <Calendar className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>

                    <div className="space-y-3">
                        {visiblePayments.map((payment) => {
                            const isPaid = payment.status === 'paid';
                            const date = new Date(payment.period_start);
                            const monthYear = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

                            return (
                                <div
                                    key={payment.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border ${
                                        isDark
                                            ? 'bg-slate-800/50 border-slate-700/50'
                                            : 'bg-gray-50 border-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPaid
                                            ? 'bg-[#F4C430]/10 text-[#F4C430]'
                                            : isDark
                                                ? 'bg-slate-700 text-slate-400'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {isPaid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground capitalize">{monthYear}</p>
                                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {isPaid ? 'Payé' : 'En attente'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-foreground tabular-nums">
                                        {formatCurrency(payment.amount_paid || payment.amount_due)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {recentPayments.length > 3 && (
                        <button
                            onClick={() => setShowAllPayments(!showAllPayments)}
                            className={`w-full mt-3 py-2 text-xs flex items-center justify-center gap-1 transition-colors ${
                                isDark
                                    ? 'text-slate-400 hover:text-white'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
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
            <div className={`rounded-xl p-5 border ${
                isDark
                    ? 'bg-slate-900/50 border-slate-800/50'
                    : 'bg-gray-50 border-gray-200'
            }`}>
                <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Adresse</p>
                <p className="text-sm text-foreground">{propertyAddress || 'Non renseignée'}</p>

                <div className={`grid grid-cols-3 gap-4 mt-4 pt-4 border-t ${isDark ? 'border-slate-800/50' : 'border-gray-200'}`}>
                    <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Début</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{formatDate(leaseStartDate)}</p>
                    </div>
                    <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Fin</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{formatDate(leaseEndDate)}</p>
                    </div>
                    <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Type</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{leaseType || 'N/A'}</p>
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
