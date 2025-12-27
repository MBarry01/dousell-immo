'use client';

import { useState } from 'react';
import { TenantTable } from './TenantTable';
import { MonthSelector } from './MonthSelector';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
}

interface Transaction {
    id: string;
    lease_id: string;
    period_month: number;
    period_year: number;
    status: string;
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
}

export function GestionLocativeClient({
    leases,
    transactions,
    profile,
    userEmail,
    isViewingTerminated = false
}: GestionLocativeClientProps) {
    // État pour le mois/année sélectionné
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [searchQuery, setSearchQuery] = useState('');

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    // Helper function to format CSV data
    const formatCSVValue = (value: string | number | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape double quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    // Export to CSV function
    const handleExportCSV = () => {
        const headers = ['Locataire', 'Email', 'Téléphone', 'Bien', 'Période', 'Statut', 'Montant (FCFA)'];

        const csvRows = formattedTenants.map(tenant => {
            const periodStr = tenant.period_month && tenant.period_year
                ? `${tenant.period_month.toString().padStart(2, '0')}/${tenant.period_year}`
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

        // Create blob and download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Filename with month/year
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

    // Filtrer et formater les locataires pour le mois sélectionné
    const formattedTenants: Tenant[] = (leases || []).map(lease => {
        // Trouver la transaction pour CE mois sélectionné
        const leaseTransactions = transactions?.filter(t => t.lease_id === lease.id) || [];
        const selectedTransaction = leaseTransactions.find(t =>
            t.period_month === selectedMonth && t.period_year === selectedYear
        );

        // Calcul du jour actuel (pour déterminer si overdue)
        const today = new Date();
        const currentDay = today.getDate();
        const isCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

        // Calcul du statut dynamique
        let displayStatus: 'paid' | 'pending' | 'overdue' = (selectedTransaction?.status as 'paid' | 'pending' | 'overdue') || 'pending';

        // Si c'est le mois actuel, impayé et date passée => Overdue
        if (isCurrentMonth && displayStatus === 'pending' && lease.billing_day && currentDay > lease.billing_day) {
            displayStatus = 'overdue';
        }

        return {
            id: lease.id,
            name: lease.tenant_name,
            property: lease.property_address || 'Adresse non renseignée',
            phone: lease.tenant_phone,
            email: lease.tenant_email,
            rentAmount: lease.monthly_amount,
            status: displayStatus,
            dueDate: lease.billing_day,
            startDate: lease.start_date,
            last_transaction_id: selectedTransaction?.id,
            // DONNÉES DE PÉRIODE (depuis la transaction ou calculées depuis selectedMonth/selectedYear)
            period_month: selectedMonth,
            period_year: selectedYear,
            period_start: selectedTransaction?.period_start || null,
            period_end: selectedTransaction?.period_end || null
        };
    });

    // Statistiques GLOBALES (tous les baux actifs pour le mois sélectionné)
    const globalStats = {
        totalLeases: leases.length,
        totalBauxActifs: leases.filter(l => !l.status || l.status === 'active').length,
        paidCount: transactions?.filter(t =>
            t.status === 'paid' &&
            t.period_month === selectedMonth &&
            t.period_year === selectedYear
        ).length || 0,
        encaisse: transactions
            ?.filter(t =>
                t.status === 'paid' &&
                t.period_month === selectedMonth &&
                t.period_year === selectedYear
            )
            .reduce((sum, t) => sum + (t.amount_due || 0), 0) || 0
    };

    const globalPendingCount = globalStats.totalBauxActifs - globalStats.paidCount;

    // Statistiques pour le mois sélectionné (tableau filtré)
    const monthStats = {
        total: formattedTenants.length,
        paid: formattedTenants.filter(t => t.status === 'paid').length,
        pending: formattedTenants.filter(t => t.status === 'pending').length,
        overdue: formattedTenants.filter(t => t.status === 'overdue').length,
        totalAmount: formattedTenants.reduce((sum, t) => sum + t.rentAmount, 0),
        paidAmount: formattedTenants.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.rentAmount, 0),
    };

    return (
        <div className="space-y-0">
            {/* KPI Bar Globale - Style Enterprise Dense */}
            <div className="border-b border-slate-800 bg-slate-900/30 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-4">
                <div className="flex items-center justify-between gap-6 text-sm font-mono">
                    <div className="flex items-center gap-6">
                        <div>
                            <span className="text-slate-500">Total Baux:</span>
                            <span className="ml-2 font-semibold text-white">{globalStats.totalBauxActifs}</span>
                        </div>
                        <div className="hidden md:block text-slate-700">|</div>
                        <div>
                            <span className="text-slate-500">Payés:</span>
                            <span className="ml-2 font-semibold text-green-400">{globalStats.paidCount}</span>
                        </div>
                        <div className="hidden md:block text-slate-700">|</div>
                        <div>
                            <span className="text-slate-500">En attente:</span>
                            <span className="ml-2 font-semibold text-yellow-400">{globalPendingCount}</span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-slate-500">Encaissé:</span>
                        <span className="ml-2 font-semibold text-white">{globalStats.encaisse.toLocaleString('fr-FR')}</span>
                        <span className="ml-1 text-slate-500 text-xs">FCFA</span>
                    </div>
                </div>
            </div>

            {/* Barre de contrôles */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Recherche */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Rechercher un locataire, bien, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-slate-700 h-10"
                    />
                </div>

                {/* Bouton Export CSV */}
                <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white h-10 px-4"
                    disabled={formattedTenants.length === 0}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>

                {/* Sélecteur de mois */}
                <div className="md:w-auto">
                    <MonthSelector
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        onMonthChange={handleMonthChange}
                    />
                </div>
            </div>

            {/* Mini statistiques du mois en ligne (Tableau filtré) */}
            <div className="flex items-center gap-6 px-4 py-2 bg-slate-900/50 border-y border-slate-800 text-sm mt-4">
                <div>
                    <span className="text-slate-400">Affichés:</span>
                    <span className="ml-2 font-semibold text-white">{monthStats.total}</span>
                </div>
                <div>
                    <span className="text-slate-400">Payés:</span>
                    <span className="ml-2 font-semibold text-green-400">{monthStats.paid}</span>
                </div>
                <div>
                    <span className="text-slate-400">En attente:</span>
                    <span className="ml-2 font-semibold text-yellow-400">{monthStats.pending}</span>
                </div>
                <div>
                    <span className="text-slate-400">Retard:</span>
                    <span className="ml-2 font-semibold text-red-400">{monthStats.overdue}</span>
                </div>
                <div className="ml-auto hidden md:block">
                    <span className="text-slate-400">Total période:</span>
                    <span className="ml-2 font-mono font-semibold text-white">{monthStats.totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
            </div>

            {/* Table Enterprise */}
            <TenantTable
                tenants={formattedTenants}
                profile={profile}
                userEmail={userEmail}
                isViewingTerminated={isViewingTerminated}
                searchQuery={searchQuery}
            />
        </div>
    );
}
