'use client';

import { ReceiptModal } from './ReceiptModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit2, CheckCircle, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateLease, confirmPayment, terminateLease, reactivateLease } from '../actions';
import { toast } from 'sonner';

interface Tenant {
    id: string;
    name: string;
    property: string;
    phone?: string;
    email?: string;
    rentAmount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate?: number;
    startDate?: string;
    last_transaction_id?: string;
    period_month?: number;
    period_year?: number;
    period_start?: string | null;
    period_end?: string | null;
}

interface TenantTableProps {
    tenants?: Tenant[];
    profile?: any;
    userEmail?: string;
    isViewingTerminated?: boolean;
    searchQuery?: string;
}

const statusConfig = {
    paid: { label: 'Payé', bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500' },
    pending: { label: 'En attente', bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' },
    overdue: { label: 'Retard', bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' }
};

export function TenantTable({ tenants = [], profile, userEmail, isViewingTerminated = false, searchQuery = '' }: TenantTableProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<any>(null);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    // Filtrer par recherche
    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConfirmPayment = async (leaseId: string, transactionId?: string) => {
        const tenant = tenants.find(t => t.id === leaseId);
        if (!tenant) {
            toast.error('Locataire introuvable');
            return;
        }

        const result = await confirmPayment(leaseId, transactionId);

        if (!result.success) {
            toast.error(result.error || 'Erreur inconnue');
            return;
        }

        const shouldSendReceipt = window.confirm(
            `Le loyer est marqué comme payé. Souhaitez-vous envoyer immédiatement la quittance par email à ${tenant.name} ?`
        );

        if (shouldSendReceipt) {
            if (!tenant.email) {
                toast.error('Email manquant pour ce locataire');
                return;
            }

            const periodMonth = tenant.period_month?.toString().padStart(2, '0') || '01';
            const periodYear = tenant.period_year || new Date().getFullYear();
            const periodStartDate = tenant.period_start
                ? new Date(tenant.period_start)
                : new Date(periodYear, parseInt(periodMonth) - 1, 1);
            const periodEndDate = tenant.period_end
                ? new Date(tenant.period_end)
                : new Date(periodYear, parseInt(periodMonth), 0);

            const receiptData = {
                tenantName: tenant.name,
                tenantEmail: tenant.email,
                tenantPhone: tenant.phone || '',
                tenantAddress: tenant.property,
                amount: Number(tenant.rentAmount) || 0,
                periodMonth: `${periodMonth}/${periodYear}`,
                periodStart: periodStartDate.toLocaleDateString('fr-FR'),
                periodEnd: periodEndDate.toLocaleDateString('fr-FR'),
                receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,
                ownerName: profile?.company_name || profile?.full_name || "Propriétaire",
                ownerAddress: profile?.company_address || "Adresse non renseignée",
                ownerNinea: profile?.company_ninea || undefined,
                ownerLogo: profile?.logo_url || undefined,
                ownerSignature: profile?.signature_url || undefined,
                ownerEmail: profile?.company_email || undefined,
                ownerAccountEmail: userEmail || undefined,
                propertyAddress: tenant.property,
            };

            toast.promise(
                fetch('/api/send-receipt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptData),
                }).then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');
                    return data;
                }),
                {
                    loading: 'Envoi de la quittance...',
                    success: 'Quittance envoyée !',
                    error: (err) => `Erreur: ${err.message}`,
                }
            );
        } else {
            toast.success(result.message || "Paiement enregistré !");
        }

        router.refresh();
    };

    const handleViewReceipt = (tenant: Tenant) => {
        const periodMonth = tenant.period_month?.toString().padStart(2, '0') || '01';
        const periodYear = tenant.period_year || new Date().getFullYear();

        setCurrentReceipt({
            tenant: {
                tenant_name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                address: tenant.property
            },
            profile: {
                company_name: profile?.company_name || profile?.full_name || "Propriétaire",
                company_address: profile?.company_address || "Adresse non renseignée",
                company_email: profile?.company_email || undefined,
                company_ninea: profile?.company_ninea || undefined,
                logo_url: profile?.logo_url || undefined,
                signature_url: profile?.signature_url || undefined
            },
            userEmail: userEmail,
            amount: tenant.rentAmount,
            month: periodMonth,
            year: periodYear,
            property_address: tenant.property
        });
        setIsReceiptOpen(true);
    };

    const handleTerminateLease = async (leaseId: string, tenantName: string) => {
        const confirmed = window.confirm(
            `⚠️ Voulez-vous vraiment résilier le bail de ${tenantName} ?`
        );
        if (!confirmed) return;

        setSaving(true);
        const result = await terminateLease(leaseId);
        setSaving(false);

        if (result.success) {
            toast.success(result.message || 'Bail résilié');
            router.refresh();
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const handleReactivateLease = async (leaseId: string, tenantName: string) => {
        const confirmed = window.confirm(
            `✅ Réactiver le bail de ${tenantName} ?`
        );
        if (!confirmed) return;

        setSaving(true);
        const result = await reactivateLease(leaseId);
        setSaving(false);

        if (result.success) {
            toast.success(result.message || 'Bail réactivé');
            router.refresh();
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    return (
        <>
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                data={currentReceipt}
            />

            {/* MOBILE: Cards */}
            <div className="md:hidden space-y-2">
                {filteredTenants.map((tenant) => (
                    <div
                        key={tenant.id}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-3"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                    {getInitials(tenant.name)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-white text-sm truncate">{tenant.name}</div>
                                    <div className="text-xs text-slate-400 truncate">{tenant.email}</div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statusConfig[tenant.status].bg} ${statusConfig[tenant.status].text}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[tenant.status].dot}`} />
                                {statusConfig[tenant.status].label}
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                            <div className="font-mono font-semibold text-white">{formatAmount(tenant.rentAmount)} FCFA</div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                                    {tenant.status === 'paid' && (
                                        <DropdownMenuItem onClick={() => handleViewReceipt(tenant)} className="text-slate-300">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir quittance
                                        </DropdownMenuItem>
                                    )}
                                    {(tenant.status === 'pending' || tenant.status === 'overdue') && (
                                        <DropdownMenuItem onClick={() => handleConfirmPayment(tenant.id, tenant.last_transaction_id)} className="text-slate-300">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Marquer payé
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="text-slate-300">
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-800" />
                                    {isViewingTerminated ? (
                                        <DropdownMenuItem onClick={() => handleReactivateLease(tenant.id, tenant.name)} className="text-green-400">
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Réactiver
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={() => handleTerminateLease(tenant.id, tenant.name)} className="text-red-400">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Résilier
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {/* DESKTOP: Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-900/50 border-b border-slate-800">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[250px]">Locataire</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[200px]">Bien</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[100px]">Période</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[120px]">Statut</th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[140px]">Montant</th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider w-[90px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredTenants.map((tenant) => {
                            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                            const periodLabel = tenant.period_month && tenant.period_year
                                ? `${monthNames[tenant.period_month - 1]} ${tenant.period_year}`
                                : '-';

                            return (
                                <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                                    {/* Locataire */}
                                    <td className="py-3 px-4 w-[250px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                {getInitials(tenant.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white text-sm truncate">{tenant.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{tenant.email || 'Email manquant'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Bien */}
                                    <td className="py-3 px-4 w-[200px]">
                                        <div className="text-sm text-slate-300 truncate">{tenant.property}</div>
                                    </td>

                                    {/* Période */}
                                    <td className="py-3 px-4 w-[100px]">
                                        <div className="text-sm text-slate-300 whitespace-nowrap">{periodLabel}</div>
                                    </td>

                                    {/* Statut */}
                                    <td className="py-3 px-4 w-[120px]">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${statusConfig[tenant.status].bg} ${statusConfig[tenant.status].text}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[tenant.status].dot}`} />
                                            {statusConfig[tenant.status].label}
                                        </div>
                                    </td>

                                    {/* Montant */}
                                    <td className="py-3 px-4 text-right w-[140px]">
                                        <div className="font-mono font-semibold text-white text-sm whitespace-nowrap">{formatAmount(tenant.rentAmount)}</div>
                                        <div className="text-xs text-slate-500">FCFA</div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right w-[90px]">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                                                {tenant.status === 'paid' && (
                                                    <DropdownMenuItem onClick={() => handleViewReceipt(tenant)} className="text-slate-300 hover:bg-slate-800">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir quittance
                                                    </DropdownMenuItem>
                                                )}
                                                {(tenant.status === 'pending' || tenant.status === 'overdue') && (
                                                    <DropdownMenuItem onClick={() => handleConfirmPayment(tenant.id, tenant.last_transaction_id)} className="text-slate-300 hover:bg-slate-800">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marquer payé
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-800" />
                                                {isViewingTerminated ? (
                                                    <DropdownMenuItem onClick={() => handleReactivateLease(tenant.id, tenant.name)} className="text-green-400 hover:bg-slate-800">
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Réactiver
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleTerminateLease(tenant.id, tenant.name)} className="text-red-400 hover:bg-slate-800">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Résilier
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredTenants.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        Aucun locataire trouvé
                    </div>
                )}
            </div>
        </>
    );
}
