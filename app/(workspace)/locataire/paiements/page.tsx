'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '@/components/workspace/providers/theme-provider';
import { RentPaymentModal } from '../components/RentPaymentModal';
import { getTenantPayments } from './actions';

type Payment = {
    id: string;
    amount_due: number;
    amount_paid?: number | null;
    status: string;
    period_start: string;
    period_end?: string;
    paid_at?: string | null;
    payment_method?: string;
};

type PaymentData = {
    payments: Payment[];
    leaseId: string;
    monthlyAmount: number;
    tenantName: string;
    tenantEmail: string;
    propertyAddress: string;
};

export default function TenantPaymentsPage() {
    const [data, setData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
    const { isDark } = useTheme();

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        const result = await getTenantPayments();
        setData(result);
        setLoading(false);
    };

    const formatCurrency = (amount?: number | null) => {
        if (!amount) return '0';
        return amount.toLocaleString('fr-FR');
    };

    const getCurrentMonth = () => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    if (!data || data.payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
                    isDark
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-gray-100 border-gray-200'
                }`}>
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Aucun paiement</h3>
                <p className="max-w-xs mt-2 text-sm text-muted-foreground">
                    Votre historique de paiements apparaîtra ici.
                </p>
            </div>
        );
    }

    const pendingPayments = data.payments.filter(p => p.status !== 'paid');
    const currentBalance = pendingPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);

    const filteredPayments = data.payments.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'paid') return p.status === 'paid';
        return p.status !== 'paid';
    });

    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
        'paid': {
            label: 'Payé',
            color: 'bg-green-500/10 text-green-500',
            icon: CheckCircle
        },
        'pending': {
            label: 'En attente',
            color: isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600',
            icon: Clock
        },
        'overdue': {
            label: 'En retard',
            color: 'bg-red-500/10 text-red-500',
            icon: AlertCircle
        },
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Mes Paiements</h1>
                <p className="text-sm text-muted-foreground mt-1">Gérez vos paiements de loyer</p>
            </div>

            {/* Solde actuel */}
            <div className={`rounded-2xl p-6 border ${
                isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-gray-200 shadow-sm'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {currentBalance > 0 ? 'Montant dû' : 'Solde'}
                        </p>
                        <div className={`text-3xl font-bold mt-1 ${currentBalance > 0 ? 'text-foreground' : 'text-[#F4C430]'}`}>
                            {formatCurrency(currentBalance)} <span className="text-lg font-normal">FCFA</span>
                        </div>
                    </div>
                    {currentBalance === 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-full">
                            <CheckCircle className="w-4 h-4 text-[#F4C430]" />
                            <span className="text-sm font-medium text-[#F4C430]">À jour</span>
                        </div>
                    )}
                </div>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    size="lg"
                    className="w-full h-12 text-base font-semibold bg-[#F4C430] hover:bg-[#D4A420] text-black"
                >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {currentBalance > 0 ? `Payer ${formatCurrency(currentBalance)} FCFA` : 'Effectuer un paiement'}
                </Button>

                <p className={`text-[10px] text-center mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    Paiement sécurisé • Wave, Orange Money, Carte
                </p>
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
                {[
                    { key: 'all', label: 'Tous' },
                    { key: 'paid', label: 'Payés' },
                    { key: 'pending', label: 'En attente' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as typeof filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === key
                                ? 'bg-[#F4C430] text-black'
                                : isDark
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Liste des paiements */}
            <div className="space-y-3">
                {filteredPayments.map((payment) => {
                    const status = statusConfig[payment.status] || statusConfig['pending'];
                    const StatusIcon = status.icon;
                    const date = new Date(payment.period_start);
                    const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

                    return (
                        <div
                            key={payment.id}
                            className={`rounded-xl p-4 border ${
                                isDark
                                    ? 'bg-slate-900 border-slate-800'
                                    : 'bg-white border-gray-200 shadow-sm'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color}`}>
                                        <StatusIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground capitalize">{monthYear}</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {payment.status === 'paid' && payment.paid_at
                                                ? `Payé le ${format(new Date(payment.paid_at), 'd MMM yyyy', { locale: fr })}`
                                                : status.label
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-foreground">
                                        {formatCurrency(payment.amount_paid || payment.amount_due)} FCFA
                                    </p>
                                    {payment.payment_method && (
                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                            {payment.payment_method}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
