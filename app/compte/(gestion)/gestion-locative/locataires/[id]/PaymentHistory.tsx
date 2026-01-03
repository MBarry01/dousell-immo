'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { createPaymentHistoryDocument } from '@/components/pdf/PaymentHistoryPDF';

interface PaymentHistoryProps {
    transactions: any[];
    lease: any;
    tenant: any;
    user: any;
    profile: any;
}

export function PaymentHistory({ transactions, lease, tenant, user, profile }: PaymentHistoryProps) {

    // Helper for currency
    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    // Prepare data for PDF
    const pdfData = {
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        tenantPhone: tenant.phone,
        propertyAddress: lease.property_address || 'Adresse non renseignée',
        ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
        ownerAddress: profile?.company_address || '',
        ownerNinea: profile?.company_ninea || profile?.ninea || undefined,
        ownerLogo: profile?.logo_url || undefined,
        transactions: transactions.map((t: any) => ({
            id: t.id,
            period: `${monthNames[t.period_month - 1]} ${t.period_year}`,
            amount: t.amount_due || 0,
            amountPaid: t.amount_paid || t.amount_due || 0, // Fallback logic same as display
            status: t.status,
            paidAt: t.paid_at
        }))
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-lg">Historique complet</h3>

                <PDFDownloadLink
                    document={createPaymentHistoryDocument(pdfData)}
                    fileName={`Historique_Paiements_${tenant.name.replace(/\s+/g, '_')}.pdf`}
                    className="no-underline"
                >
                    {({ loading }) => (
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="animate-pulse">Génération...</span>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Exporter PDF
                                </>
                            )}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
                        <tr>
                            <th className="p-4">Période</th>
                            <th className="p-4">Date limite</th>
                            <th className="p-4">Montant</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {transactions.map((t: any) => (
                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-medium capitalize">
                                    {new Date(t.period_year, t.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="p-4 text-slate-400">
                                    05/{String(t.period_month).padStart(2, '0')}
                                </td>
                                <td className="p-4 font-mono">
                                    {formatMoney(t.amount_due)}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${t.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            t.status === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {t.status === 'paid' ? 'Payé' : t.status === 'overdue' ? 'En retard' : 'En attente'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {t.status === 'paid' && (
                                        <Button variant="ghost" size="sm" className="h-8 text-blue-400 hover:text-blue-300">
                                            <Download className="w-3 h-3 mr-1" /> Quittance
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
