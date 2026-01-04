'use client';

import { ReceiptModal } from './ReceiptModal';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Edit2, CheckCircle, Trash2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerateContractButton } from '@/components/contracts/GenerateContractButton';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTenantButton } from './AddTenantButton';
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
    lease_pdf_url?: string | null;
    tenant_name?: string; // Often redundant with name but useful if explicit
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

export interface TenantTableProps {
    tenants?: Tenant[];
    profile?: ProfileData | null;
    userEmail?: string;
    isViewingTerminated?: boolean;
    searchQuery?: string;
    onEdit?: (tenant: Tenant) => void;
    onDelete?: (transactionId: string) => void;
    onDeleteLease?: (leaseId: string) => void;
    ownerId?: string;
    onConfirmPayment?: (leaseId: string, transactionId?: string) => void;
    onViewReceipt?: (tenant: Tenant) => void;
    onTerminate?: (leaseId: string, tenantName: string) => void;
    onReactivate?: (leaseId: string, tenantName: string) => void;
    onInvite?: (leaseId: string) => void;
}

const statusConfig = {
    paid: { label: 'Payé', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
    pending: { label: 'Attente', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    overdue: { label: 'Retard', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' }
};

type SortField = 'name' | 'property' | 'rentAmount' | 'status' | 'period';
type SortOrder = 'asc' | 'desc';

export function TenantTable({
    tenants = [],
    profile,
    userEmail,
    ownerId,
    isViewingTerminated = false,
    searchQuery = '',
    onEdit,
    onDelete,
    onDeleteLease,
    onConfirmPayment,
    onViewReceipt,
    onTerminate,
    onReactivate,
    onInvite
}: TenantTableProps) {
    const router = useRouter();
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

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
        <>

            <div className="bg-black border border-slate-800 rounded-lg overflow-x-auto max-w-[100vw] w-full">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-800">
                        <tr>
                            {/* Locataire - Always visible */}
                            <th className="py-3 px-2 sm:px-4">
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
                                <tr key={tenant.last_transaction_id || tenant.id} className="hover:bg-slate-900/50 transition-colors">
                                    {/* Locataire */}
                                    <td className="py-3 px-2 sm:px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                {getInitials(tenant.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <Link href={`/compte/gestion-locative/locataires/${tenant.id}`} className="block group/link">
                                                    <div className="font-medium text-white text-sm truncate group-hover/link:text-blue-400 transition-colors">
                                                        {tenant.name}
                                                    </div>
                                                </Link>
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
                                                {tenant.status === 'paid' && onViewReceipt && (
                                                    <DropdownMenuItem onClick={() => onViewReceipt(tenant)} className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Voir quittance
                                                    </DropdownMenuItem>
                                                )}
                                                {(tenant.status === 'pending' || tenant.status === 'overdue') && onConfirmPayment && (
                                                    <DropdownMenuItem onClick={() => onConfirmPayment(tenant.id, tenant.last_transaction_id)} className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marquer payé
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(tenant)}
                                                    className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800"
                                                >
                                                    Modifier
                                                </DropdownMenuItem>

                                                {onInvite && tenant.email && (
                                                    <DropdownMenuItem
                                                        onClick={() => onInvite(tenant.id)}
                                                        className="text-slate-300 hover:bg-slate-800 focus:bg-slate-800"
                                                    >
                                                        <Send className="mr-2 h-4 w-4 text-purple-400" />
                                                        Inviter au portail
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator className="bg-slate-800" />
                                                {isViewingTerminated && onReactivate ? (
                                                    <DropdownMenuItem onClick={() => onReactivate(tenant.id, tenant.name)} className="text-green-400 hover:bg-slate-800 focus:bg-slate-800">
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Réactiver
                                                    </DropdownMenuItem>
                                                ) : onTerminate && (
                                                    <DropdownMenuItem onClick={() => onTerminate(tenant.id, tenant.name)} className="text-brand hover:bg-slate-800 focus:bg-slate-800">
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
            </div>    {filteredTenants.length === 0 && (
                <div className="py-8 px-4">
                    {!searchQuery ? (
                        <EmptyState
                            title="Votre gestion commence ici"
                            description="Créez un bail pour générer automatiquement vos contrats et quittances."
                            actionComponent={
                                ownerId ? (
                                    <AddTenantButton
                                        ownerId={ownerId}
                                        trigger={
                                            <Button size="lg" className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 font-semibold w-full sm:w-auto">
                                                Créer un Bail
                                            </Button>
                                        }
                                    />
                                ) : null
                            }
                            secondaryActionComponent={
                                ownerId ? (
                                    <AddTenantButton
                                        ownerId={ownerId}
                                        initialData={{
                                            name: "Moussa Diop",
                                            phone: "+221 77 123 45 67",
                                            email: "moussa.diop@example.com",
                                            address: "Appartement F4, Sacré-Cœur 3, Dakar",
                                            amount: 250000,
                                            day: 5,
                                            startDate: new Date().toISOString().split('T')[0],
                                            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                                        }}
                                        trigger={
                                            <Button variant="ghost" className="mt-2 sm:mt-0 sm:ml-2">
                                                Voir un exemple de bail
                                            </Button>
                                        }
                                    />
                                ) : null
                            }
                        />
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-slate-500 text-sm">
                                Aucun résultat pour cette recherche
                            </div>
                        </div>
                    )}
                </div>
            )}

        </>
    );
}
