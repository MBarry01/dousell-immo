'use client';

import { useState } from 'react';
import { TenantList } from './TenantList';
import { MonthSelector } from './MonthSelector';

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
}

interface GestionLocativeClientProps {
    leases: any[];
    transactions: Transaction[];
    profile: any;
    userEmail?: string;
}

export function GestionLocativeClient({
    leases,
    transactions,
    profile,
    userEmail
}: GestionLocativeClientProps) {
    // État pour le mois/année sélectionné
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const handleMonthChange = (month: number, year: number) => {
        setSelectedMonth(month);
        setSelectedYear(year);
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
        let displayStatus: 'paid' | 'pending' | 'overdue' = selectedTransaction?.status || 'pending';

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
            last_transaction_id: selectedTransaction?.id
        };
    });

    // Statistiques pour le mois sélectionné
    const monthStats = {
        total: formattedTenants.length,
        paid: formattedTenants.filter(t => t.status === 'paid').length,
        pending: formattedTenants.filter(t => t.status === 'pending').length,
        overdue: formattedTenants.filter(t => t.status === 'overdue').length,
        totalAmount: formattedTenants.reduce((sum, t) => sum + t.rentAmount, 0),
        paidAmount: formattedTenants.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.rentAmount, 0),
    };

    return (
        <div className="space-y-6">
            {/* Sélecteur de mois */}
            <MonthSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={handleMonthChange}
            />

            {/* Statistiques du mois */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Total Baux</div>
                    <div className="text-2xl font-bold text-white mt-1">{monthStats.total}</div>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <div className="text-xs text-green-400 uppercase tracking-wider">Payés</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">{monthStats.paid}</div>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                    <div className="text-xs text-yellow-400 uppercase tracking-wider">En attente</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">{monthStats.pending}</div>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <div className="text-xs text-red-400 uppercase tracking-wider">En retard</div>
                    <div className="text-2xl font-bold text-red-400 mt-1">{monthStats.overdue}</div>
                </div>
            </div>

            {/* Montant total */}
            <div className="p-6 bg-gradient-to-br from-[#F4C430]/20 to-transparent border border-[#F4C430]/30 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-400">Montant total du mois</div>
                        <div className="text-3xl font-bold text-white mt-1">
                            {monthStats.totalAmount.toLocaleString('fr-FR')} <span className="text-xl text-gray-500">FCFA</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-green-400">Encaissé</div>
                        <div className="text-2xl font-bold text-green-400 mt-1">
                            {monthStats.paidAmount.toLocaleString('fr-FR')} <span className="text-base text-gray-500">FCFA</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {monthStats.total > 0 ? Math.round((monthStats.paid / monthStats.total) * 100) : 0}% collecté
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des locataires filtrée par mois */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Paiements - {selectedMonth}/{selectedYear}</h2>
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    {formattedTenants.length} locataire{formattedTenants.length > 1 ? 's' : ''}
                </span>
            </div>

            <div className="bg-gray-900/20 border border-gray-800 rounded-[2rem] p-2 overflow-hidden">
                <TenantList
                    tenants={formattedTenants}
                    profile={profile}
                    userEmail={userEmail}
                />
            </div>
        </div>
    );
}
