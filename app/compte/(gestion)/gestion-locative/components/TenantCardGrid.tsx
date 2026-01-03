'use client';

import { TenantCard } from './TenantCard';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTenantButton } from './AddTenantButton';
import { Button } from '@/components/ui/button';

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

interface TenantCardGridProps {
    tenants: Tenant[];
    onConfirmPayment?: (leaseId: string, transactionId?: string) => void;
    onViewReceipt?: (tenant: Tenant) => void;
    onEdit?: (tenant: Tenant) => void;
    onTerminate?: (leaseId: string, name: string) => void;
    onReactivate?: (leaseId: string, name: string) => void;
    isViewingTerminated?: boolean;
    ownerId?: string;
    searchQuery?: string;
}

export function TenantCardGrid({
    tenants,
    onConfirmPayment,
    onViewReceipt,
    onEdit,
    onTerminate,
    onReactivate,
    isViewingTerminated = false,
    ownerId,
    searchQuery = ''
}: TenantCardGridProps) {
    if (tenants.length === 0) {
        return (
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
                    />
                ) : (
                    <div className="text-center py-16">
                        <div className="text-slate-500 text-sm">
                            Aucun résultat pour cette recherche
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
                <TenantCard
                    key={tenant.last_transaction_id || tenant.id}
                    tenant={tenant}
                    onConfirmPayment={onConfirmPayment}
                    onViewReceipt={onViewReceipt}
                    onEdit={onEdit}
                    onTerminate={onTerminate}
                    onReactivate={onReactivate}
                    isViewingTerminated={isViewingTerminated}
                />
            ))}
        </div>
    );
}
