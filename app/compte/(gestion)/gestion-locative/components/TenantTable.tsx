'use client';

import { ReceiptModal } from './ReceiptModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit2, CheckCircle, Trash2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { confirmPayment, terminateLease, reactivateLease } from '../actions';
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

interface ProfileData {
    company_name?: string | null;
    full_name?: string | null;
    company_address?: string | null;
    company_email?: string | null;
    company_ninea?: string | null;
    signature_url?: string | null;
    logo_url?: string | null;
}

interface TenantTableProps {
    tenants?: Tenant[];
    profile?: ProfileData | null;
    userEmail?: string;
    isViewingTerminated?: boolean;
    searchQuery?: string;
    onEdit?: (tenant: Tenant) => void;
    onDelete?: (transactionId: string) => void;
    onDeleteLease?: (leaseId: string) => void;
}

const statusConfig = {
    paid: { label: 'Payé', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
    pending: { label: 'Attente', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    overdue: { label: 'Retard', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' }
};

type SortField = 'name' | 'property' | 'rentAmount' | 'status' | 'period';
type SortOrder = 'asc' | 'desc';

interface ReceiptData {
    tenant?: {
        tenant_name?: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    property_address?: string;
    amount?: number;
    period?: string;
    month?: string | number;
    year?: number;
    periodStart?: string;
    periodEnd?: string;
    receiptNumber?: string;
    userEmail?: string;
    profile?: {
        company_name?: string | null;
        full_name?: string | null;
        company_address?: string | null;
        company_email?: string | null;
        email?: string;
        logo_url?: string | null;
        signature_url?: string | null;
        ninea?: string | null;
        company_ninea?: string | null;
    };
    receiptImage?: string | null;
}

export function TenantTable({ tenants = [], profile, userEmail, isViewingTerminated = false, searchQuery = '', onEdit, onDelete, onDeleteLease }: TenantTableProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-3 h-3 text-slate-600" />;
        }
        return sortOrder === 'asc'
            ? <ArrowUp className="w-3 h-3 text-slate-400" />
            : <ArrowDown className="w-3 h-3 text-slate-400" />;
    };

    const filteredTenants = tenants
        .filter(tenant =>
            tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let compareA: string | number;
            let compareB: string | number;

            switch (sortField) {
                case 'name':
                    compareA = a.name.toLowerCase();
                    compareB = b.name.toLowerCase();
                    break;
                case 'property':
                    compareA = a.property.toLowerCase();
                    compareB = b.property.toLowerCase();
                    break;
                case 'rentAmount':
                    compareA = a.rentAmount;
                    compareB = b.rentAmount;
                    break;
                case 'status':
                    const statusOrder = { paid: 0, pending: 1, overdue: 2 };
                    compareA = statusOrder[a.status];
                    compareB = statusOrder[b.status];
                    break;
                case 'period':
                    compareA = `${a.period_year}-${String(a.period_month).padStart(2, '0')}`;
                    compareB = `${b.period_year}-${String(b.period_month).padStart(2, '0')}`;
                    break;
                default:
                    return 0;
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

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
            `Le loyer est marqué comme payé. Envoyer la quittance par email à ${tenant.name} ?`
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

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
        <>
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                data={currentReceipt}
            />

            {/* Table Dark Enterprise - Responsive */}
            <div className="bg-black border border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="border-b border-slate-800">
                        <tr>
                            {/* Locataire - Always visible */}
                            <th className="py-3 px-4">
                                <button
                                    onClick={() => handleSort('name')}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    Locataire
                                    <SortIcon field="name" />
                                </button>
                            </th>

                            {/* Bien - Hidden on mobile */}
                            <th className="py-3 px-4 hidden lg:table-cell">
                                <button
                                    onClick={() => handleSort('property')}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    Bien
                                    <SortIcon field="property" />
                                </button>
                            </th>

                            {/* Période - Hidden on mobile */}
                            <th className="py-3 px-4 hidden md:table-cell">
                                <button
                                    onClick={() => handleSort('period')}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    Période
                                    <SortIcon field="period" />
                                </button>
                            </th>

                            {/* Statut - Always visible */}
                            <th className="py-3 px-4">
                                <button
                                    onClick={() => handleSort('status')}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    Statut
                                    <SortIcon field="status" />
                                </button>
                            </th>

                            {/* Montant - Always visible */}
                            <th className="py-3 px-4 text-right">
                                <button
                                    onClick={() => handleSort('rentAmount')}
                                    className="flex items-center gap-1.5 ml-auto text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                                >
                                    Montant
                                    <SortIcon field="rentAmount" />
                                </button>
                            </th>

                            {/* Actions */}
                            <th className="py-3 px-4 text-right w-12">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredTenants.map((tenant) => {
                            const periodLabel = tenant.period_month && tenant.period_year
                                ? `${monthNames[tenant.period_month - 1]} ${tenant.period_year}`
                                : '-';

                            return (
                                <tr key={tenant.id} className="hover:bg-slate-900/50 transition-colors">
                                    {/* Locataire */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                {getInitials(tenant.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-white text-sm truncate">{tenant.name}</div>
                                                <div className="text-xs text-slate-500 truncate">{tenant.email || 'Email manquant'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Bien - Hidden on mobile */}
                                    <td className="py-3 px-4 hidden lg:table-cell">
                                        <div className="text-sm text-slate-400 truncate max-w-[200px]">{tenant.property}</div>
                                    </td>

                                    {/* Période - Hidden on mobile */}
                                    <td className="py-3 px-4 hidden md:table-cell">
                                        <div className="text-sm text-slate-400">{periodLabel}</div>
                                    </td>

                                    {/* Statut */}
                                    <td className="py-3 px-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${statusConfig[tenant.status].bg} ${statusConfig[tenant.status].text}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[tenant.status].dot}`} />
                                            {statusConfig[tenant.status].label}
                                        </div>
                                    </td>

                                    {/* Montant */}
                                    <td className="py-3 px-4 text-right">
                                        <div className="font-mono font-medium text-white text-sm">{formatAmount(tenant.rentAmount)}</div>
                                        <div className="text-xs text-slate-600">FCFA</div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-800">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44 bg-slate-900 border-slate-800">
                                                {tenant.status === 'paid' && (
                                                    <DropdownMenuItem onClick={() => handleViewReceipt(tenant)} className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir quittance
                                                    </DropdownMenuItem>
                                                )}
                                                {(tenant.status === 'pending' || tenant.status === 'overdue') && (
                                                    <DropdownMenuItem onClick={() => handleConfirmPayment(tenant.id, tenant.last_transaction_id)} className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marquer payé
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(tenant)}
                                                    className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800"
                                                >
                                                    <Edit2 className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="bg-slate-800" />
                                                {isViewingTerminated ? (
                                                    <DropdownMenuItem onClick={() => handleReactivateLease(tenant.id, tenant.name)} className="text-green-400 hover:bg-slate-800 focus:bg-slate-800">
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Réactiver
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleTerminateLease(tenant.id, tenant.name)} className="text-orange-400 hover:bg-slate-800 focus:bg-slate-800">
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
                    <div className="text-center py-16 px-4">
                        <div className="text-slate-500 text-sm">Aucune échéance pour cette période</div>
                        <div className="text-slate-600 text-xs mt-1">Les loyers sont générés automatiquement chaque mois</div>
                    </div>
                )}
            </div >
        </>
    );
}
