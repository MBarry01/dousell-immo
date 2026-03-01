'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { TenantTable } from './TenantTable';
import { MonthSelector } from './MonthSelector';
import { EditTenantDialog } from './EditTenantDialog';

import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';
import { TenantCardGrid } from './TenantCardGrid';
import { Search, Download, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteTransaction, deleteLease, confirmPayment, terminateLease, reactivateLease, sendTenantInvitation } from '../actions';
import { processLateReminders } from '@/app/(vitrine)/actions/reminders';
import { ReceiptModal } from './ReceiptModal';
import { toast } from 'sonner';

import { calculateFinancials, LeaseInput, TransactionInput } from '@/lib/finance';
import { saveAs } from 'file-saver';

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
    endDate?: string;
    last_transaction_id?: string;
    period_month?: number;
    period_year?: number;
    period_start?: string | null;
    period_end?: string | null;
    property_id?: string;
    composition?: string | null;
}

interface Transaction {
    id: string;
    lease_id: string;
    period_month: number;
    period_year: number;
    status: string;
    amount_due?: number;
    amount_paid?: number | null;
    paid_at?: string | null;
    period_start?: string | null;
    period_end?: string | null;
}

interface Expense {
    id: string;
    amount: number;
    expense_date: string;
    description?: string | null;
    category?: string | null;
    lease_id?: string | null;
}

interface Lease {
    id: string;
    tenant_name: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount: number;
    billing_day?: number;
    start_date?: string;
    end_date?: string;
    status?: 'active' | 'terminated' | 'pending';
    created_at?: string;
    property_id?: string;
    properties?: {
        id: string;
        title: string;
        images?: string[];
        specs?: any;
    } | null;
}

interface Profile {
    company_name?: string | null;
    full_name?: string | null;
    company_address?: string | null;
    company_email?: string | null;
    company_ninea?: string | null;
    signature_url?: string | null;
    logo_url?: string | null;
}

interface ReceiptData {
    leaseId?: string;
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

interface GestionLocativeClientProps {
    leases: Lease[];
    transactions: Transaction[];
    expenses: Expense[];
    profile: Profile | null;
    userEmail?: string;
    ownerId: string;
    isViewingTerminated?: boolean;
    minDate?: string;
}

export function GestionLocativeClient({
    leases,
    transactions,
    expenses,
    profile,
    userEmail,
    ownerId,
    isViewingTerminated = false,
    minDate
}: GestionLocativeClientProps) {
    const router = useRouter();
    // État pour le mois/année sélectionné - Initialisé à aujourd'hui
    const today = useMemo(() => new Date(), []);
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    // Local state for optimistic updates
    const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

    // Sync props to local state when they change (re-fetch)
    useEffect(() => {
        setLocalTransactions(transactions);
    }, [transactions]);

    const searchParams = useSearchParams();
    const pathname = usePathname(); // Add this
    const urlQuery = searchParams?.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(urlQuery);

    // Sync state with URL when it changes
    useEffect(() => {
        setSearchQuery(urlQuery);
    }, [urlQuery]);

    // DEBUG: Mobile Crash Investigation
    useEffect(() => {

        console.log("[GestionLocativeClient] Component Mounted", {
            leasesCount: leases?.length,
            transactionsCount: transactions?.length,
            expensesCount: expenses?.length,
            hasProfile: !!profile,
            ownerId,
            timestamp: new Date().toISOString()
        });
    }, []);

    // Update URL when local search changes (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== urlQuery) {
                const params = new URLSearchParams(searchParams?.toString());
                if (searchQuery) {
                    params.set('q', searchQuery);
                } else {
                    params.delete('q');
                }
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, urlQuery, pathname, router, searchParams]);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards'); // Default to cards (Noflaye style)
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
    const [_saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
    const [loadingPaymentId, setLoadingPaymentId] = useState<string | null>(null);

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    // ========================================
    // AUTO-UPDATE MONTH DETECTION (Passage automatique au nouveau mois)
    // ========================================


    // ========================================
    // FILTRAGE STRICT PAR PÉRIODE
    // ========================================
    const currentTransactions = useMemo(() => {
        return localTransactions.filter(t =>
            t.period_month === selectedMonth &&
            t.period_year === selectedYear
        );
    }, [localTransactions, selectedMonth, selectedYear]);

    // ========================================
    // KPI CALCULATIONS (Source Unique de Vérité : lib/finance.ts)
    // ========================================
    const kpiStats = useMemo(() => {
        // Préparer les données pour le Finance Guard
        const targetDate = new Date(selectedYear, selectedMonth - 1, 1);

        const safeLeases: LeaseInput[] = leases.map(l => ({
            id: l.id,
            monthly_amount: l.monthly_amount,
            status: l.status || 'active',
            start_date: l.start_date || null,
            billing_day: l.billing_day || 5
        }));

        const safeTransactions: TransactionInput[] = currentTransactions.map(t => ({
            id: t.id,
            lease_id: t.lease_id,
            amount_due: t.amount_due || 0,
            amount_paid: t.amount_paid,
            status: t.status
        }));

        // Filtrer les dépenses pour le mois/année sélectionné
        const monthlyExpenses = (expenses || []).filter(e => {
            const d = new Date(e.expense_date);
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
        });

        const kpis = calculateFinancials(safeLeases, safeTransactions, monthlyExpenses, targetDate);

        return {
            totalExpected: kpis.totalExpected,
            totalCollected: kpis.totalCollected,
            totalExpenses: kpis.totalExpenses,
            actualNetProfit: kpis.actualNetProfit,
            projectedNetProfit: kpis.projectedNetProfit,
            hasTemporaryDebt: kpis.hasTemporaryDebt,
            totalPending: kpis.pendingAmount, // En attente stricte (hors retards)
            paidCount: kpis.paidCount,
            pendingCount: kpis.pendingCount,
            overdueCount: kpis.overdueCount,
            collectedPercent: kpis.collectionRate,
            transactionCount: currentTransactions.length
        };
    }, [leases, currentTransactions, selectedMonth, selectedYear]);

    // ========================================
    // FORMATER LES LOCATAIRES POUR LE TABLEAU
    // ========================================
    // ========================================
    // FORMATER LES LOCATAIRES POUR LE TABLEAU
    // ========================================
    const formattedTenants: Tenant[] = useMemo(() => {
        const result: Tenant[] = [];

        (leases || []).forEach(lease => {
            // Trouver TOUTES les transactions pour CE mois sélectionné
            const leaseTransactions = currentTransactions.filter(t => t.lease_id === lease.id);

            // Consolider le statut pour éviter les doublons
            const paidTx = leaseTransactions.find(t => t.status === 'paid' || t.status?.toLowerCase() === 'paid');
            const hasPayment = !!paidTx;

            // Calcul du jour actuel (pour déterminer si overdue)
            const currentDay = today.getDate();
            const currentMonthIndex = today.getMonth() + 1;
            const currentYearValue = today.getFullYear();

            const isCurrentMonth = selectedMonth === currentMonthIndex && selectedYear === currentYearValue;
            const isPastMonth = selectedYear < currentYearValue || (selectedYear === currentYearValue && selectedMonth < currentMonthIndex);

            let displayStatus: 'paid' | 'pending' | 'overdue' = 'pending';

            if (hasPayment) {
                displayStatus = 'paid';
            } else {
                const billingDay = lease.billing_day || 5;
                if (isPastMonth) {
                    displayStatus = 'overdue';
                } else if (isCurrentMonth && currentDay > billingDay) {
                    displayStatus = 'overdue';
                }
                // sinon pending (futur ou courant avant échéance)
            }

            result.push({
                id: lease.id,
                name: lease.tenant_name,
                property: lease.properties?.title || lease.property_address || 'Bien non renseigné',
                phone: lease.tenant_phone,
                email: lease.tenant_email,
                rentAmount: lease.monthly_amount,
                status: displayStatus,
                dueDate: lease.billing_day,
                startDate: lease.start_date,
                endDate: lease.end_date,
                last_transaction_id: paidTx?.id, // ID unique de la transaction payée si elle existe
                period_month: selectedMonth,
                period_year: selectedYear,
                period_start: paidTx?.period_start || null,
                period_end: paidTx?.period_end || null,
                property_id: lease.property_id,
                composition: lease.properties?.specs ? (() => {
                    const specs = lease.properties.specs;
                    const parts = [];
                    const rooms = specs.rooms || specs.pieces || specs.nb_rooms;
                    const bedrooms = specs.bedrooms || specs.chambres || specs.nb_bedrooms;
                    const surface = specs.surface || specs.area || specs.superficie;
                    if (rooms) parts.push(`${rooms} pièce${Number(rooms) > 1 ? 's' : ''}`);
                    if (bedrooms) parts.push(`${bedrooms} chambre${Number(bedrooms) > 1 ? 's' : ''}`);
                    if (surface) parts.push(`${surface} m²`);
                    return parts.length > 0 ? parts.join(', ') : null;
                })() : null
            });
        });

        return result;
    }, [leases, currentTransactions, selectedMonth, selectedYear, today]);

    // ========================================
    // FILTERED TENANTS (Search + Status Filter)
    // ========================================
    const filteredTenants = useMemo(() => {
        let result = formattedTenants;

        // 1. Status Filter (KPI Cards)
        if (filterStatus !== 'all') {
            result = result.filter(t => t.status === filterStatus);
        }

        return result;
    }, [formattedTenants, filterStatus]);

    // Helper function to format CSV data
    const _formatCSVValue = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    // Export to Excel function using xlsx
    const handleExportExcel = () => {
        // Prepare data for xlsx
        const data = formattedTenants.map(tenant => {
            const periodStr = selectedMonth && selectedYear
                ? `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`
                : '';

            const statusLabels: Record<string, string> = {
                paid: 'Payé',
                pending: 'En attente',
                overdue: 'Retard'
            };

            return {
                'Locataire': tenant.name || '',
                'Email': tenant.email || '',
                'Téléphone': tenant.phone || '',
                'Bien': tenant.property || '',
                'Période': periodStr,
                'Statut': statusLabels[tenant.status] || '',
                'Montant (FCFA)': tenant.rentAmount || 0
            };
        });

        // Import xlsx dynamically to use writeFile
        import('xlsx').then((XLSX) => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Locataires');

            // Generate filename
            const monthNames = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
                'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
            const filename = `locataires-${monthNames[selectedMonth - 1]}-${selectedYear}.xlsx`;

            // Write file - this properly handles the filename
            XLSX.writeFile(workbook, filename);

            toast.success(`Export Excel téléchargé : ${filename}`);
        });
    };

    // Format montant avec espaces
    const _formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    // ========================================
    // ACTION HANDLERS (LIFTED FROM TENANT TABLE)
    // ========================================
    const handleConfirmPayment = async (leaseId: string, transactionId?: string) => {
        const tenant = formattedTenants.find(t => t.id === leaseId);
        if (!tenant) {
            toast.error('Locataire introuvable');
            return;
        }

        setLoadingPaymentId(leaseId);
        try {
            // silent=true : on n'envoie pas l'email automatiquement, l'utilisateur décide via la modal
            const result = await confirmPayment(leaseId, transactionId, selectedMonth, selectedYear, true);

            if (!result.success) {
                toast.error(result.error || 'Erreur inconnue');
                return;
            }

            // --- OPTIMISTIC UPDATE ---
            const txIndex = localTransactions.findIndex(t =>
                (transactionId && t.id === transactionId) ||
                (!transactionId && t.lease_id === leaseId && t.period_month === selectedMonth && t.period_year === selectedYear)
            );

            const updatedTx: Transaction = txIndex >= 0
                ? { ...localTransactions[txIndex], status: 'paid', amount_paid: tenant.rentAmount, amount_due: tenant.rentAmount }
                : {
                    id: transactionId || `temp-${Date.now()}`,
                    lease_id: leaseId,
                    period_month: selectedMonth,
                    period_year: selectedYear,
                    status: 'paid',
                    amount_due: tenant.rentAmount,
                    amount_paid: tenant.rentAmount,
                    paid_at: new Date().toISOString()
                };

            if (txIndex >= 0) {
                const newTxs = [...localTransactions];
                newTxs[txIndex] = updatedTx;
                setLocalTransactions(newTxs);
            } else {
                setLocalTransactions([...localTransactions, updatedTx]);
            }
            // ------------------------

            toast.success('Paiement enregistré !');
            // Ouvrir la modal quittance — l'utilisateur choisit d'envoyer ou non
            handleViewReceipt(tenant);
            router.refresh();
        } finally {
            setLoadingPaymentId(null);
        }
    };

    const handleViewReceipt = (tenant: Tenant) => {
        const periodMonth = tenant.period_month?.toString().padStart(2, '0') || '01';
        const periodYear = tenant.period_year || new Date().getFullYear();

        setCurrentReceipt({
            leaseId: tenant.id,
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
            window.location.reload();
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
            window.location.reload();
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const handleInvite = async (leaseId: string) => {
        toast.promise(sendTenantInvitation(leaseId), {
            loading: 'Envoi de l\'invitation...',
            success: (data) => {
                if (!data.success) throw new Error(data.error);
                return data.message || 'Invitation envoyée avec succès';
            },
            error: (err) => `Erreur: ${err.message}`
        });
    };

    const handleSendReminders = async () => {
        // Optimistic UI interaction
        const promise = processLateReminders();

        toast.promise(promise, {
            loading: 'Envoi des relances...',
            success: (result) => {
                if (result.count > 0) {
                    return `✅ ${result.count} relance(s) envoyée(s)`;
                } else {
                    return 'ℹ️ Aucune relance à envoyer';
                }
            },
            error: '❌ Erreur lors de l\'envoi'
        });

        try {
            await promise;
            router.refresh(); // Refresh to update reminder status/counts
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-0 w-full">
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                data={currentReceipt}
            />

            {/* ========================================
                DASHBOARD STATS - Style Noflaye
                ======================================== */}
            <div id="tour-stats">
                <DashboardStats
                    stats={{
                        totalExpected: kpiStats.totalExpected,
                        totalCollected: kpiStats.totalCollected,
                        totalPending: kpiStats.totalPending,
                        paidCount: kpiStats.paidCount,
                        pendingCount: kpiStats.pendingCount,
                        overdueCount: kpiStats.overdueCount,
                        collectedPercent: kpiStats.collectedPercent,
                        totalTenants: leases.length,
                    }}
                    onFilterChange={setFilterStatus}
                    activeFilter={filterStatus}
                />
            </div>

            {/* ========================================
                QUICK ACTIONS - Style Noflaye
                ======================================== */}
            <QuickActions
                onExportExcel={handleExportExcel}
                pendingCount={kpiStats.pendingCount}
                overdueCount={kpiStats.overdueCount}
                onSendReminders={handleSendReminders}
                ownerId={ownerId}
                profile={profile}
            />

            {/* Ligne 1: Controls (Month Selector aligned left) */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                {/* Sélecteur de mois - Aligné à gauche */}
                <MonthSelector
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onMonthChange={handleMonthChange}
                    minDate={minDate}
                />

                {/* View Toggle + Export CSV */}
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-lg p-0.5 border border-border bg-muted">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards'
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="Vue cartes"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table'
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                            title="Vue tableau"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bouton Export Excel */}
                    <Button
                        id="tour-export-excel"
                        onClick={() => {
                            handleExportExcel();
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 shrink-0 bg-background border-border text-foreground hover:bg-muted"
                        disabled={formattedTenants.length === 0}
                    >
                        <Download className="w-4 h-4 mr-1.5" />
                        Excel
                    </Button>
                </div>
            </div>

            {/* ========================================
                TENANT VIEW - Cards or Table
                ======================================== */}
            <div id="tour-tenants-list" className="mt-6">
                <div id="tour-add-tenant">
                    {viewMode === 'cards' ? (
                        <TenantCardGrid
                            tenants={filteredTenants}
                            onEdit={(tenant) => setEditingTenant(tenant)}
                            ownerId={ownerId}
                            isViewingTerminated={isViewingTerminated}
                            searchQuery={searchQuery}
                            onConfirmPayment={handleConfirmPayment}
                            onViewReceipt={handleViewReceipt}
                            onTerminate={handleTerminateLease}
                            onReactivate={handleReactivateLease}
                            onInvite={handleInvite}
                            loadingPaymentId={loadingPaymentId}
                        />
                    ) : (
                        <TenantTable
                            tenants={filteredTenants}
                            profile={profile}
                            userEmail={userEmail}
                            ownerId={ownerId}
                            isViewingTerminated={isViewingTerminated}
                            searchQuery={searchQuery}
                            onEdit={(tenant) => setEditingTenant(tenant)}
                            onDelete={deleteTransaction}
                            onDeleteLease={deleteLease}
                            onConfirmPayment={handleConfirmPayment}
                            onViewReceipt={handleViewReceipt}
                            onTerminate={handleTerminateLease}
                            onReactivate={handleReactivateLease}
                            onInvite={handleInvite}
                        />
                    )}
                </div>
            </div>

            {/* Modale d'édition */}
            {
                editingTenant && (
                    <EditTenantDialog
                        isOpen={!!editingTenant}
                        onClose={() => setEditingTenant(null)}
                        tenant={editingTenant}
                    />
                )
            }
        </div >
    );
}
