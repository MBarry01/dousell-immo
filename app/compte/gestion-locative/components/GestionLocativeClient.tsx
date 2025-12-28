'use client';

import { useState, useMemo } from 'react';
import { TenantTable } from './TenantTable';
import { MonthSelector } from './MonthSelector';
import { EditTenantDialog } from './EditTenantDialog';
import { SendRemindersButton } from './SendRemindersButton';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { deleteTransaction, deleteLease } from '../actions';

import { calculateFinancials, LeaseInput, TransactionInput } from '@/lib/finance';

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

interface Lease {
    id: string;
    tenant_name: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount: number;
    billing_day?: number;
    start_date?: string;
    status?: 'active' | 'terminated' | 'pending';
    created_at?: string;
}

interface GestionLocativeClientProps {
    leases: Lease[];
    transactions: Transaction[];
    profile: any;
    userEmail?: string;
    isViewingTerminated?: boolean;
    minDate?: string;
}

export function GestionLocativeClient({
    leases,
    transactions,
    profile,
    userEmail,
    isViewingTerminated = false,
    minDate
}: GestionLocativeClientProps) {
    // État pour le mois/année sélectionné - Initialisé à aujourd'hui
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    // ========================================
    // FILTRAGE STRICT PAR PÉRIODE
    // ========================================
    const currentTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.period_month === selectedMonth &&
            t.period_year === selectedYear
        );
    }, [transactions, selectedMonth, selectedYear]);

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

        const kpis = calculateFinancials(safeLeases, safeTransactions, targetDate);

        return {
            totalExpected: kpis.totalExpected,
            totalCollected: kpis.totalCollected,
            totalPending: kpis.totalExpected - kpis.totalCollected, // Reste = Attendu - Encaissé
            paidCount: kpis.paidCount,
            pendingCount: kpis.pendingCount,
            overdueCount: kpis.overdueCount,
            collectedPercent: kpis.collectionRate,
            transactionCount: currentTransactions.length // Juste pour info debug si besoin
        };
    }, [leases, currentTransactions, selectedMonth, selectedYear]);

    // ========================================
    // FORMATER LES LOCATAIRES POUR LE TABLEAU
    // ========================================
    const formattedTenants: Tenant[] = useMemo(() => {
        const result: Tenant[] = [];

        (leases || []).forEach(lease => {
            // Trouver TOUTES les transactions pour CE mois sélectionné
            const leaseTransactions = currentTransactions.filter(t => t.lease_id === lease.id);

            // Calcul du jour actuel (pour déterminer si overdue)
            const currentDay = today.getDate();
            const isCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

            // Si aucune transaction : Créer une ligne virtuelle "Pending" (cas normal début de mois)
            if (leaseTransactions.length === 0) {
                let displayStatus: 'pending' | 'overdue' = 'pending';
                if (isCurrentMonth && lease.billing_day && currentDay > lease.billing_day) {
                    displayStatus = 'overdue';
                }

                result.push({
                    id: lease.id,
                    name: lease.tenant_name,
                    property: lease.property_address || 'Adresse non renseignée',
                    phone: lease.tenant_phone,
                    email: lease.tenant_email,
                    rentAmount: lease.monthly_amount,
                    status: displayStatus,
                    dueDate: lease.billing_day,
                    startDate: lease.start_date,
                    last_transaction_id: undefined, // Pas de transaction réelle
                    period_month: selectedMonth,
                    period_year: selectedYear,
                    period_start: null,
                    period_end: null
                });
            } else {
                // Si transactions existent : Créer une ligne POUR CHAQUE transaction (mode "Révéler les doublons")
                leaseTransactions.forEach(trans => {
                    // Calculer le statut d'affichage en fonction du billing_day (SYNCHRONISÉ AVEC finance.ts)
                    let displayStatus: 'paid' | 'pending' | 'overdue';

                    if (trans.status === 'paid') {
                        displayStatus = 'paid';
                    } else {
                        // Pour les transactions non payées, vérifier si le billing_day est dépassé
                        const billingDay = lease.billing_day || 5;
                        if (isCurrentMonth && currentDay > billingDay) {
                            displayStatus = 'overdue';
                        } else {
                            displayStatus = 'pending';
                        }
                    }

                    result.push({
                        id: lease.id,
                        name: lease.tenant_name,
                        property: lease.property_address || 'Adresse non renseignée',
                        phone: lease.tenant_phone,
                        email: lease.tenant_email,
                        rentAmount: trans.amount_due || lease.monthly_amount,
                        status: displayStatus,
                        dueDate: lease.billing_day,
                        startDate: lease.start_date,
                        last_transaction_id: trans.id, // ID unique de la transaction
                        period_month: selectedMonth,
                        period_year: selectedYear,
                        period_start: trans.period_start || null,
                        period_end: trans.period_end || null
                    });
                });
            }
        });

        return result;
    }, [leases, currentTransactions, selectedMonth, selectedYear, today]);

    // Helper function to format CSV data
    const formatCSVValue = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    // Export to CSV function
    const handleExportCSV = () => {
        const headers = ['Locataire', 'Email', 'Téléphone', 'Bien', 'Période', 'Statut', 'Montant (FCFA)'];

        const csvRows = formattedTenants.map(tenant => {
            const periodStr = selectedMonth && selectedYear
                ? `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`
                : '';

            const statusLabels = {
                paid: 'Payé',
                pending: 'En attente',
                overdue: 'Retard'
            };

            return [
                formatCSVValue(tenant.name),
                formatCSVValue(tenant.email),
                formatCSVValue(tenant.phone),
                formatCSVValue(tenant.property),
                formatCSVValue(periodStr),
                formatCSVValue(statusLabels[tenant.status]),
                formatCSVValue(tenant.rentAmount)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const filename = `loyers-${monthNames[selectedMonth - 1]}-${selectedYear}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Format montant avec espaces
    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    return (
        <div className="space-y-0">
            {/* ========================================
                KPI STRIP - Bandeau Dense Dark Enterprise
                ======================================== */}
            <div className="border-b border-slate-800 bg-black -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-4 md:gap-6 font-mono">
                        {/* Total Attendu */}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs uppercase tracking-wider hidden md:inline">Total</span>
                            <span className="font-semibold text-white">{formatAmount(kpiStats.totalExpected)}</span>
                        </div>

                        <div className="text-slate-700">|</div>

                        {/* Encaissé */}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs uppercase tracking-wider hidden md:inline">Encaissé</span>
                            <span className="font-semibold text-green-400">{formatAmount(kpiStats.totalCollected)}</span>
                            <span className="text-slate-500 text-xs">({kpiStats.collectedPercent}%)</span>
                        </div>

                        <div className="text-slate-700 hidden md:block">|</div>

                        {/* Reste */}
                        <div className="flex items-center gap-2 hidden md:flex">
                            <span className="text-slate-500 text-xs uppercase tracking-wider">Reste</span>
                            <span className={`font-semibold ${kpiStats.totalPending > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {formatAmount(kpiStats.totalPending)}
                            </span>
                        </div>
                    </div>

                    {/* Compteurs */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-green-400 font-medium">{kpiStats.paidCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            <span className="text-yellow-400 font-medium">{kpiStats.pendingCount}</span>
                        </div>
                        {kpiStats.overdueCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-red-400 font-medium">{kpiStats.overdueCount}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================
                BARRE DE CONTRÔLES
                ======================================== */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                {/* Recherche */}
                <div className="flex-1 flex items-center gap-2 bg-black border border-slate-800 rounded-md px-3 h-9 focus-within:border-slate-700">
                    <Search className="h-4 w-4 text-slate-500 shrink-0" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm outline-none"
                    />
                </div>

                {/* Bouton Export CSV */}
                <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="bg-black border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white h-9 px-3"
                    disabled={formattedTenants.length === 0}
                >
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                </Button>

                {/* Bouton Relances J+5 */}
                <SendRemindersButton />

                {/* Sélecteur de mois - Centré sur mobile */}
                <div className="w-fit mx-auto md:mx-0 md:w-auto">
                    <MonthSelector
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onMonthChange={handleMonthChange}
                        minDate={minDate}
                    />
                </div>
            </div>

            {/* ========================================
                TABLE ENTERPRISE
                ======================================== */}
            <TenantTable
                tenants={formattedTenants}
                profile={profile}
                userEmail={userEmail}
                isViewingTerminated={isViewingTerminated}
                searchQuery={searchQuery}
                onEdit={(tenant) => setEditingTenant(tenant)}
                onDelete={deleteTransaction}
                onDeleteLease={deleteLease}
            />

            {/* Modale d'édition */}
            {editingTenant && (
                <EditTenantDialog
                    isOpen={!!editingTenant}
                    onClose={() => setEditingTenant(null)}
                    tenant={editingTenant}
                />
            )}
        </div>
    );
}
