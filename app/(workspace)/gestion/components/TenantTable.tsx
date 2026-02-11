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

    const statusConfig = {
        paid: {
            label: 'Payé',
            bg: 'bg-muted',
            text: 'text-muted-foreground',
            dot: 'bg-green-500'
        },
        pending: {
            label: 'Attente',
            bg: 'bg-muted',
            text: 'text-muted-foreground',
            dot: 'bg-yellow-500'
        },
        overdue: {
            label: 'Retard',
            bg: 'bg-muted',
            text: 'text-muted-foreground',
            dot: 'bg-red-500'
        }
    };

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
            return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
        }
        return sortOrder === 'asc'
            ? <ArrowUp className="w-3 h-3 text-muted-foreground" />
            : <ArrowDown className="w-3 h-3 text-muted-foreground" />;
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

            <div className="border border-border rounded-lg overflow-hidden w-full transition-colors bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-max sm:min-w-0">
                        <thead className="border-b border-border bg-muted/30 sticky top-0">
                            <tr>
                                {/* Locataire - Always visible */}
                                <th className="py-3 px-2 sm:px-4">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Locataire
                                        <SortIcon field="name" />
                                    </button>
                                </th>

                                {/* Bien - Hidden on tablet and below */}
                                <th className="py-3 px-4 hidden xl:table-cell">
                                    <button
                                        onClick={() => handleSort('property')}
                                        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Bien
                                        <SortIcon field="property" />
                                    </button>
                                </th>

                                {/* Période - Hidden on small devices */}
                                <th className="py-3 px-4 hidden md:table-cell">
                                    <button
                                        onClick={() => handleSort('period')}
                                        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Période
                                        <SortIcon field="period" />
                                    </button>
                                </th>

                                {/* Statut - Always visible */}
                                <th className="py-3 px-2 sm:px-4">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Statut
                                        <SortIcon field="status" />
                                    </button>
                                </th>

                                {/* Montant - Always visible */}
                                <th className="py-3 px-2 sm:px-4 text-right">
                                    <button
                                        onClick={() => handleSort('rentAmount')}
                                        className="flex items-center gap-1.5 ml-auto text-xs font-medium uppercase tracking-wider transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Montant
                                        <SortIcon field="rentAmount" />
                                    </button>
                                </th>

                                {/* Actions */}
                                <th className="py-3 px-2 sm:px-4 text-right w-10 sm:w-12">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredTenants.map((tenant) => {
                                const periodLabel = tenant.period_month && tenant.period_year
                                    ? `${monthNames[tenant.period_month - 1]} ${tenant.period_year}`
                                    : '-';

                                return (
                                    <tr key={tenant.last_transaction_id || tenant.id} className="transition-colors hover:bg-muted/50">
                                        {/* Locataire */}
                                        <td className="py-3 px-2 sm:px-4">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 bg-muted text-muted-foreground border border-border">
                                                    {getInitials(tenant.name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <Link href={`/gestion/locataires/${tenant.id}`} className="block group/link">
                                                        <div className="font-medium text-xs sm:text-sm truncate transition-colors text-foreground group-hover/link:text-primary">
                                                            {tenant.name}
                                                        </div>
                                                    </Link>
                                                    <div className="text-xs truncate text-muted-foreground hidden sm:block">{tenant.email || 'Email manquant'}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Bien - Hidden on devices below xl */}
                                        <td className="py-3 px-4 hidden xl:table-cell">
                                            <div className="text-sm truncate max-w-[150px] text-muted-foreground">{tenant.property}</div>
                                        </td>

                                        {/* Période - Hidden on small devices */}
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <div className="text-xs sm:text-sm text-muted-foreground">{periodLabel}</div>
                                        </td>

                                        {/* Statut */}
                                        <td className="py-3 px-2 sm:px-4">
                                            <div className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${statusConfig[tenant.status].bg} ${statusConfig[tenant.status].text}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[tenant.status].dot}`} />
                                                <span className="hidden sm:inline">{statusConfig[tenant.status].label}</span>
                                                <span className="sm:hidden">{statusConfig[tenant.status].label.slice(0, 3)}</span>
                                            </div>
                                        </td>

                                        {/* Montant */}
                                        <td className="py-3 px-2 sm:px-4 text-right">
                                            <div className="font-mono font-medium text-xs sm:text-sm text-foreground">{formatAmount(tenant.rentAmount)}</div>
                                            <div className="text-xs text-muted-foreground/60 hidden sm:block">FCFA</div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-2 sm:px-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted">
                                                        <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    {tenant.status === 'paid' && onViewReceipt && (
                                                        <DropdownMenuItem onClick={() => onViewReceipt(tenant)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Voir quittance
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(tenant.status === 'pending' || tenant.status === 'overdue') && onConfirmPayment && (
                                                        <DropdownMenuItem onClick={() => onConfirmPayment(tenant.id, tenant.last_transaction_id)}>
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Marquer payé
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit?.(tenant)}
                                                    >
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>

                                                    {onInvite && tenant.email && (
                                                        <DropdownMenuItem
                                                            onClick={() => onInvite(tenant.id)}
                                                        >
                                                            <Send className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            Inviter au portail
                                                        </DropdownMenuItem>
                                                    )}

                                                    <DropdownMenuSeparator />
                                                    {isViewingTerminated && onReactivate ? (
                                                        <DropdownMenuItem onClick={() => onReactivate(tenant.id, tenant.name)}>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            Réactiver
                                                        </DropdownMenuItem>
                                                    ) : onTerminate && (
                                                        <DropdownMenuItem onClick={() => onTerminate(tenant.id, tenant.name)} className="text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors">
                                                            <Trash2 className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-destructive" />
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
                </div>
            </div> {
                filteredTenants.length === 0 && (
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
                                                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full sm:w-auto transition-all shadow-md">
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
                                <div className="text-muted-foreground text-sm">
                                    Aucun résultat pour cette recherche
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

        </>
    );
}
