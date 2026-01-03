'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';
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
    const [customAmount, setCustomAmount] = useState<string>(monthlyAmount.toString());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        const amount = parseInt(customAmount);

        if (!amount || amount <= 0) {
            toast.error('Veuillez saisir un montant valide');
            return;
        }

        if (amount > monthlyAmount * 12) {
            toast.error('Le montant ne peut pas dépasser 12 mois de loyer');
            return;
        }

        // Ouvrir la modal de confirmation
        setIsModalOpen(true);
    };

    // Calculer le mois actuel pour l'afficher dans la modal
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

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Informations Locataire - Style Gestion Locative */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                    {tenantName && (
                        <>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">{tenantName[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">{tenantName}</h2>
                                <p className="text-xs sm:text-sm text-slate-400">Locataire</p>
                            </div>
                        </>
                    )}
                </div>

                {propertyAddress && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1 uppercase tracking-wider">Adresse du bien</p>
                        <p className="text-xs sm:text-sm text-white">{propertyAddress}</p>
                    </div>
                )}
            </div>

            {/* Section Dates de Bail - Style Gestion Locative */}
            {leaseStartDate && leaseEndDate && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3">
                        <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1.5" />
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Début</div>
                            <div className="text-sm sm:text-base font-semibold text-white">{formatDate(leaseStartDate)}</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-slate-800 border border-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1.5" />
                            <div className="text-[10px] text-slate-500 uppercase mb-1">Fin</div>
                            <div className="text-sm sm:text-base font-semibold text-white">{formatDate(leaseEndDate)}</div>
                        </div>
                    </div>
                    {leaseType && (
                        <div className="text-center pt-3 border-t border-slate-800">
                            <span className="text-xs text-slate-500">Type : </span>
                            <span className="text-xs sm:text-sm font-semibold text-white">{leaseType}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Section Pièces justificatives - Style Gestion Locative */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-0.5">Pièces justificatives</h3>
                        <p className="text-xs text-orange-400">✓ Toutes les pièces déposées</p>
                    </div>
                </div>
            </div>

            {/* Section Paiement - Style Gestion Locative */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-white">Effectuer un paiement</h2>
                        <p className="text-xs text-slate-400">
                            Mobile Money ou Carte Bancaire
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="amount" className="text-white text-sm font-medium mb-2 block">
                            Montant à régler (FCFA)
                        </Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="h-12 sm:h-14 text-lg font-semibold bg-slate-800 border-slate-700 text-white pr-16 placeholder:text-slate-500"
                                placeholder="0"
                                min={0}
                                max={monthlyAmount * 12}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                FCFA
                            </div>
                        </div>

                        {/* Boutons rapides - Style Gestion Locative */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setCustomAmount(monthlyAmount.toString())}
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-center"
                            >
                                <div className="text-[10px] text-slate-400 mb-0.5">1 mois</div>
                                <div className="text-xs font-semibold text-white truncate">{formatCurrency(monthlyAmount)}</div>
                            </button>

                            <button
                                onClick={() => setCustomAmount((monthlyAmount * 3).toString())}
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-center"
                            >
                                <div className="text-[10px] text-slate-400 mb-0.5">3 mois</div>
                                <div className="text-xs font-semibold text-white truncate">{formatCurrency(monthlyAmount * 3)}</div>
                            </button>

                            <button
                                onClick={() => setCustomAmount((monthlyAmount * 6).toString())}
                                className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-center"
                            >
                                <div className="text-[10px] text-slate-400 mb-0.5">6 mois</div>
                                <div className="text-xs font-semibold text-white truncate">{formatCurrency(monthlyAmount * 6)}</div>
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={handleOpenModal}
                        className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-orange-600 hover:bg-orange-500 text-white"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payer maintenant
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                        Paiement sécurisé via KKiaPay
                    </p>
                </div>
            </div>

            {/* Historique des Paiements - Style Gestion Locative */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Historique des paiements</h3>
                    <Calendar className="w-4 h-4 text-slate-500" />
                </div>

                {recentPayments.length > 0 ? (
                    <div className="space-y-2">
                        {recentPayments.map((payment) => {
                            const isPaid = payment.status === 'paid';
                            const date = new Date(payment.period_start);
                            const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

                            return (
                                <div
                                    key={payment.id}
                                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                isPaid
                                                    ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                                                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                            }`}>
                                                {isPaid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white capitalize truncate">
                                                    Loyer {monthYear}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {isPaid
                                                        ? `Payé le ${formatDate(payment.paid_at || undefined)}`
                                                        : 'En attente'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-white">
                                                {formatCurrency(payment.amount_paid || payment.amount_due)}
                                            </p>
                                            <p className="text-[10px] text-slate-500">FCFA</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500">Aucun historique</p>
                    </div>
                )}
            </div>

            {/* Section Mes Documents - Style Gestion Locative */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Mes documents</h3>
                            <p className="text-xs text-slate-400">Contrats, quittances</p>
                        </div>
                    </div>
                    <span className="text-slate-500 text-lg">→</span>
                </div>
            </div>

            {/* Modal de Paiement Premium */}
            <RentPaymentModal
                leaseId={leaseId}
                defaultAmount={parseInt(customAmount) || monthlyAmount}
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
