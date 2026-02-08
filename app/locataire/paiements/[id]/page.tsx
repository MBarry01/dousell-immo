'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Loader2,
    Receipt,
    CreditCard,
    Smartphone,
    UserCheck,
    Copy,
    Check,
    Download,
    RefreshCw,
    Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTransactionDetail } from './actions';

type PaymentMeta = {
    provider?: string;
    // Stripe fields
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
    amount_eur_cents?: number;
    amount_eur?: number;
    exchange_rate?: number;
    card_brand?: string;
    card_last4?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    // KKiaPay fields
    kkiapay_transaction_id?: string;
    payment_channel?: string;
    customer_phone?: string;
    customer_name?: string;
    kkiapay_status?: string;
    kkiapay_created_at?: string;
    // Common fields
    amount_fcfa?: number;
    currency?: string;
    paid_at?: string;
    confirmed_by?: string;
    confirmed_at?: string;
};

type Transaction = {
    id: string;
    amount_due: number;
    amount_paid?: number | null;
    status: string;
    period_month: number;
    period_year: number;
    paid_at?: string | null;
    payment_method?: string;
    payment_ref?: string | null;
    meta?: PaymentMeta | null;
};

type Lease = {
    id: string;
    tenant_name: string;
    tenant_email: string;
    monthly_amount: number;
    property_address: string;
};

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [lease, setLease] = useState<Lease | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedRef, setCopiedRef] = useState(false);
    const [note, setNote] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);

    useEffect(() => {
        loadTransactionDetail();
    }, [params.id]);

    const loadTransactionDetail = async () => {
        if (!params.id || typeof params.id !== 'string') {
            setLoading(false);
            return;
        }

        const result = await getTransactionDetail(params.id);

        if (result) {
            setTransaction(result.transaction);
            setLease(result.lease);
        }
        setLoading(false);
    };

    const formatCurrency = (amount?: number | null) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('fr-FR').format(amount);
    };

    const formatPeriod = (month: number, year: number) => {
        return `${MONTH_NAMES[(month || 1) - 1]} ${year}`;
    };

    const formatDateTime = (dateString?: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }) + ' à ' + date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMethodIcon = (method?: string) => {
        switch (method) {
            case 'stripe': return <CreditCard className="w-5 h-5" />;
            case 'kkiapay': return <Smartphone className="w-5 h-5" />;
            case 'manual': return <UserCheck className="w-5 h-5" />;
            default: return <Receipt className="w-5 h-5" />;
        }
    };

    const getMethodLabel = (method?: string, meta?: PaymentMeta | null) => {
        switch (method) {
            case 'stripe':
                if (meta?.card_brand && meta?.card_last4) {
                    return `${meta.card_brand.charAt(0).toUpperCase() + meta.card_brand.slice(1)} ****${meta.card_last4}`;
                }
                return 'Carte bancaire (Stripe)';
            case 'kkiapay':
                if (meta?.payment_channel) {
                    const channel = meta.payment_channel.replace(/_/g, ' ');
                    return channel.charAt(0).toUpperCase() + channel.slice(1);
                }
                return 'Mobile Money (KKiaPay)';
            case 'manual':
                return 'Confirmation manuelle';
            case 'transfer':
                return 'Virement bancaire';
            default:
                return method || 'Non renseigné';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
    };

    const getPaymentRef = (transaction: Transaction): string | null => {
        if (transaction.payment_ref) return transaction.payment_ref;
        if (transaction.meta?.stripe_session_id) return transaction.meta.stripe_session_id;
        if (transaction.meta?.kkiapay_transaction_id) return transaction.meta.kkiapay_transaction_id;
        return null;
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'PAYÉ',
                    bgColor: 'bg-emerald-500',
                    icon: <CheckCircle2 className="w-6 h-6" />,
                };
            case 'overdue':
                return {
                    label: 'EN RETARD',
                    bgColor: 'bg-red-500',
                    icon: <AlertTriangle className="w-6 h-6" />,
                };
            default:
                return {
                    label: 'EN ATTENTE',
                    bgColor: 'bg-amber-500',
                    icon: <Clock className="w-6 h-6" />,
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    if (!transaction || !lease) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Transaction introuvable</h3>
                <p className="max-w-xs mt-2 text-sm text-zinc-500 text-center">
                    Cette transaction n&apos;existe pas ou vous n&apos;avez pas accès.
                </p>
                <Button
                    onClick={() => router.push('/locataire/paiements')}
                    className="mt-6"
                    variant="outline"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux paiements
                </Button>
            </div>
        );
    }

    const isPaid = transaction.status === 'paid';
    const ref = getPaymentRef(transaction);
    const meta = transaction.meta;
    const statusConfig = getStatusConfig(transaction.status);

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-zinc-200">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-900" />
                    </button>
                    <h1 className="text-lg font-semibold text-zinc-900">Détail de la transaction</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {/* Status Card */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    {/* Status Banner */}
                    <div className={`${statusConfig.bgColor} px-6 py-4 text-white flex items-center justify-between`}>
                        <span className="text-sm font-semibold tracking-wide">
                            {statusConfig.label}
                        </span>
                        {statusConfig.icon}
                    </div>

                    {/* Main Info */}
                    <div className="px-6 py-8 text-center">
                        <p className="text-sm text-zinc-500 mb-2">
                            {isPaid ? 'Vous avez payé' : 'À payer'}
                        </p>
                        <div className="flex items-baseline justify-center gap-2 mb-4">
                            <span className="text-4xl font-bold text-zinc-900 tracking-tight">
                                {formatCurrency(transaction.amount_paid || transaction.amount_due)}
                            </span>
                            <span className="text-xl text-zinc-400">FCFA</span>
                        </div>
                        <p className="text-sm text-zinc-600">
                            pour le loyer de <span className="font-semibold">{formatPeriod(transaction.period_month, transaction.period_year)}</span>
                        </p>
                        {lease.property_address && (
                            <p className="text-xs text-zinc-500 mt-2">
                                {lease.property_address}
                            </p>
                        )}
                    </div>

                    {/* Confirmation */}
                    {isPaid && ref && (
                        <div className="px-6 pb-6">
                            <div className="bg-zinc-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Référence de confirmation</p>
                                        <p className="font-mono text-sm text-zinc-900 break-all">{ref}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(ref)}
                                        className="ml-2 p-2 hover:bg-zinc-200 rounded-lg transition-colors flex-shrink-0"
                                        title="Copier la référence"
                                    >
                                        {copiedRef
                                            ? <Check className="w-4 h-4 text-emerald-500" />
                                            : <Copy className="w-4 h-4 text-zinc-400" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {isPaid && (
                        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    // TODO: Implement receipt download
                                    alert('Téléchargement du reçu à venir');
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Voir le reçu
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/locataire/paiements')}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Nouveau paiement
                            </Button>
                        </div>
                    )}
                </div>

                {/* Note Section */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-zinc-700">Note à soi-même</h2>
                        <button
                            onClick={() => setIsEditingNote(!isEditingNote)}
                            className="p-1 hover:bg-zinc-100 rounded transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                    {isEditingNote ? (
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ajouter une note..."
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            rows={3}
                        />
                    ) : (
                        <p className="text-sm text-zinc-500">
                            {note || 'Ajouter une note'}
                        </p>
                    )}
                </div>

                {/* Details Section */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-700 pb-2 border-b border-zinc-100">
                        Détails de la transaction
                    </h2>

                    {/* Date & Time */}
                    {transaction.paid_at && (
                        <DetailRow
                            label="Date & heure"
                            value={formatDateTime(transaction.paid_at) || '-'}
                        />
                    )}

                    {/* Payment Method */}
                    <DetailRow
                        label="Moyen de paiement"
                        value={
                            <div className="flex items-center gap-2 justify-end">
                                {getMethodIcon(transaction.payment_method)}
                                <span>{getMethodLabel(transaction.payment_method, meta)}</span>
                            </div>
                        }
                    />

                    {/* Amount Details */}
                    <div className="pt-2 border-t border-zinc-100 space-y-3">
                        <DetailRow
                            label="Montant du loyer"
                            value={`${formatCurrency(transaction.amount_due)} FCFA`}
                        />

                        {/* Stripe: Show EUR amount and exchange rate */}
                        {meta?.provider === 'stripe' && meta.amount_eur && (
                            <>
                                <DetailRow
                                    label="Frais de transfert"
                                    value={meta.amount_eur_cents
                                        ? `${((meta.amount_eur_cents - (meta.amount_eur * 100)) / 100).toFixed(2)} EUR`
                                        : '-'
                                    }
                                />
                                {meta.exchange_rate && (
                                    <DetailRow
                                        label="Taux de change"
                                        value={`1 EUR = ${formatCurrency(meta.exchange_rate)} FCFA`}
                                    />
                                )}
                                <DetailRow
                                    label="Total pour le bénéficiaire"
                                    value={`${formatCurrency(transaction.amount_paid || transaction.amount_due)} FCFA`}
                                />
                            </>
                        )}

                        {/* KKiaPay: Show customer phone */}
                        {meta?.provider === 'kkiapay' && meta.customer_phone && (
                            <DetailRow
                                label="Numéro de téléphone"
                                value={meta.customer_phone}
                            />
                        )}
                    </div>

                    {/* Total paid */}
                    <div className="pt-3 border-t border-zinc-200">
                        <DetailRow
                            label={
                                <span className="font-semibold text-zinc-900">
                                    {meta?.provider === 'stripe' ? 'Montant total débité' : 'Montant total'}
                                </span>
                            }
                            value={
                                <span className="font-bold text-zinc-900">
                                    {meta?.provider === 'stripe' && meta.amount_eur
                                        ? `${meta.amount_eur.toFixed(2)} EUR`
                                        : `${formatCurrency(transaction.amount_paid || transaction.amount_due)} FCFA`
                                    }
                                </span>
                            }
                        />
                    </div>

                    {/* Payment Method details */}
                    <div className="pt-3 border-t border-zinc-100">
                        <DetailRow
                            label="Payé avec"
                            value={
                                meta?.provider === 'stripe' && meta.card_brand && meta.card_last4
                                    ? `My ${meta.card_brand.toUpperCase()} Card ****${meta.card_last4}`
                                    : getMethodLabel(transaction.payment_method, meta)
                            }
                        />
                    </div>
                </div>

                {/* Additional info for disclaimer */}
                {meta?.provider === 'stripe' && (
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Votre bénéficiaire peut recevoir une somme inférieure en raison de frais facturés par le fournisseur de portefeuille mobile ou une banque et/ou de taxes étrangères.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-sm text-zinc-500 flex-shrink-0">
                {label}
            </span>
            <span className="text-sm font-medium text-zinc-800 text-right">
                {value}
            </span>
        </div>
    );
}
