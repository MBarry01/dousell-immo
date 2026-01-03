'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    DollarSign,
    AlertTriangle,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

import { calculateFinancials, LeaseInput, TransactionInput } from '@/lib/finance';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { ExpenseList } from './components/ExpenseList';
import { getExpensesByYear, Expense } from './expenses-actions';

interface MonthlyData {
    month: string;
    shortMonth: string;
    expected: number;
    collected: number;
    pending: number;
    future: number;
    overdue: number;
    collectionRate: number;
}

const COLORS = {
    collected: '#22c55e',
    pending: '#f59e0b',
    overdue: '#ef4444',
    expected: '#3b82f6',
    future: '#334155', // Plus sombre/discret (Slate 700) pour le futur
};

const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const fullMonthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function ComptabilitePage() {
    const { user, loading: authLoading } = useAuth();
    const [leases, setLeases] = useState<LeaseInput[]>([]);
    const [transactions, setTransactions] = useState<TransactionInput[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'revenus' | 'depenses'>('revenus');

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setLoading(true);
            const supabase = createClient();

            // 1. Fetch Leases
            const { data: leasesData } = await supabase
                .from('leases')
                .select('id, monthly_amount, status, start_date, billing_day')
                .eq('owner_id', user.id);

            setLeases((leasesData || []) as LeaseInput[]);

            // 2. Fetch Leases with tenant names for expense form
            const leasesForExpenses = (leasesData || []).map(l => ({
                id: l.id,
                tenant_name: (l as any).tenant_name || 'Locataire'
            }));

            // Re-fetch with tenant_name if not already available
            try {
                const { data: leasesWithTenants } = await supabase
                    .from('leases')
                    .select('id, tenant_name')
                    .eq('owner_id', user.id)
                    .eq('status', 'active');

                setProperties((leasesWithTenants || []).map(l => ({ id: l.id, address: l.tenant_name || 'Locataire' })));
            } catch (leaseError) {
                console.warn('Could not fetch leases for expenses:', leaseError);
                setProperties(leasesForExpenses.map(l => ({ id: l.id, address: l.tenant_name })));
            }

            // 3. Fetch Expenses for the year
            try {
                const expensesResult = await getExpensesByYear(selectedYear);
                if (expensesResult.success) {
                    setExpenses(expensesResult.expenses as Expense[]);
                }
            } catch (expError) {
                console.warn('Could not fetch expenses:', expError);
                setExpenses([]);
            }

            if (!leasesData || leasesData.length === 0) {
                setLoading(false);
                return;
            }

            const leaseIds = leasesData.map(l => l.id);

            // 4. Fetch Transactions for Selected Year
            const { data: txsData } = await supabase
                .from('rental_transactions')
                .select('id, lease_id, amount_due, status, period_month, period_year, created_at')
                .in('lease_id', leaseIds)
                .eq('period_year', selectedYear);

            // Polyfill amount_paid
            const formattedTxs: any[] = (txsData || []).map(t => ({
                id: t.id,
                lease_id: t.lease_id,
                amount_due: t.amount_due,
                status: t.status,
                period_date: `${t.period_year}-${String(t.period_month).padStart(2, '0')}-01`,
                created_at: t.created_at,
                period_month: t.period_month, // Keep for filtering
                amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
            }));

            setTransactions(formattedTxs);
            setLoading(false);
        };

        loadData();
    }, [user, selectedYear]);

    // Callback to refresh expenses after adding one
    const refreshExpenses = async () => {
        const result = await getExpensesByYear(selectedYear);
        if (result.success) {
            setExpenses(result.expenses as Expense[]);
        }
    };

    // Calculate monthly data with Logic
    const monthlyData = useMemo(() => {
        const data: MonthlyData[] = [];
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYearValue = today.getFullYear();
        const isPastYear = selectedYear < currentYearValue;
        const isFutureYear = selectedYear > currentYearValue;

        for (let month = 1; month <= 12; month++) {
            let expected = 0;
            let collected = 0;
            let pending = 0;
            let future = 0;
            let overdue = 0;

            const isPastMonth = isPastYear || (selectedYear === currentYearValue && month < currentMonth);
            const isFutureMonth = isFutureYear || (selectedYear === currentYearValue && month > currentMonth);
            // const isCurrentMonth = selectedYear === currentYearValue && month === currentMonth;

            leases.forEach(lease => {
                // Simplified active check: if status is active. 
                // Ideally check start_date vs current month but 'active' status is good enough proxy for now
                if (lease.status === 'active') {
                    const amount = Number(lease.monthly_amount) || 0;
                    expected += amount;

                    const tx = (transactions as any[]).find(t => t.lease_id === lease.id && t.period_month === month);

                    if (tx && tx.status?.toLowerCase() === 'paid') {
                        collected += (Number(tx.amount_due) || amount);
                    } else {
                        // Unpaid logic
                        const unpaidAmount = amount;
                        if (isPastMonth) {
                            overdue += unpaidAmount;
                        } else if (isFutureMonth) {
                            future += unpaidAmount; // Future expectations are 'future' (gray)
                        } else {
                            // Current Month Logic
                            const billingDay = lease.billing_day || 5;
                            if (today.getDate() > billingDay) {
                                overdue += unpaidAmount;
                            } else {
                                pending += unpaidAmount;
                            }
                        }
                    }
                }
            });

            const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

            data.push({
                month: fullMonthNames[month - 1],
                shortMonth: monthNames[month - 1],
                expected,
                collected,
                pending,
                future,
                overdue,
                collectionRate,
            });
        }

        return data;
    }, [leases, transactions, selectedYear]);

    // Calculate totals from monthly data
    const calculatedTotals = useMemo(() => {
        return monthlyData.reduce((acc, curr) => ({
            expected: acc.expected + curr.expected,
            collected: acc.collected + curr.collected,
            pending: acc.pending + curr.pending + curr.future, // Include future in pending totals
            overdue: acc.overdue + curr.overdue,
            collectionRate: 0
        }), { expected: 0, collected: 0, pending: 0, overdue: 0, collectionRate: 0 });
    }, [monthlyData]);

    const totals = useMemo(() => {
        const rate = calculatedTotals.expected > 0
            ? Math.round((calculatedTotals.collected / calculatedTotals.expected) * 100)
            : 0;
        return { ...calculatedTotals, collectionRate: rate };
    }, [calculatedTotals]);

    // Pie chart needs positive values
    const pieData = useMemo(() => [
        { name: 'Encaissé', value: totals.collected, color: COLORS.collected },
        { name: 'En attente', value: totals.pending, color: COLORS.pending }, // This now includes future
        { name: 'En retard', value: totals.overdue, color: COLORS.overdue },
    ].filter(d => d.value > 0), [totals]);

    // Revert chart filtering - Show all months again
    const chartData = useMemo(() => {
        return monthlyData;
    }, [monthlyData]);

    const formatAmount = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return val.toString();
    };

    if (authLoading || loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-64 bg-slate-800" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 bg-slate-800 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-80 bg-slate-800 rounded-xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-slate-400">Veuillez vous connecter</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Gestion Locative</p>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard Financier</h1>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="bg-transparent text-white text-sm outline-none cursor-pointer"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year} className="bg-slate-900">{year}</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-800 text-slate-400 hover:text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    {/* Add Expense Button */}
                    <AddExpenseDialog properties={properties} onExpenseAdded={refreshExpenses} />
                </div>
            </div>

            {/* Tabs for Revenue vs Expenses */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'revenus' | 'depenses')} className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="revenus" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                        Revenus (Loyers)
                    </TabsTrigger>
                    <TabsTrigger value="depenses" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                        Dépenses
                    </TabsTrigger>
                </TabsList>

                {/* REVENUS TAB CONTENT */}
                <TabsContent value="revenus" className="mt-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Expected */}
                        <div className="p-4 md:p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Wallet className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Attendu</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">
                                {formatAmount(totals.expected)}
                                <span className="text-sm text-slate-500 ml-1">FCFA</span>
                            </p>
                        </div>

                        {/* Collected */}
                        <div className="p-4 md:p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Encaissé</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-green-400">
                                {formatAmount(totals.collected)}
                                <span className="text-sm text-slate-500 ml-1">FCFA</span>
                            </p>
                            <p className="text-xs text-green-400/70 mt-1 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                {totals.collectionRate}% taux de recouvrement
                            </p>
                        </div>

                        {/* Pending (Merged future) */}
                        <div className="p-4 md:p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-amber-500/10">
                                    <DollarSign className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">En attente</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-amber-400">
                                {formatAmount(totals.pending)}
                                <span className="text-sm text-slate-500 ml-1">FCFA</span>
                            </p>
                        </div>

                        {/* Overdue */}
                        <div className="p-4 md:p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Retards</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-red-400">
                                {formatAmount(totals.overdue)}
                                <span className="text-sm text-slate-500 ml-1">FCFA</span>
                            </p>
                            {totals.overdue > 0 && (
                                <Link
                                    href="/compte/gestion-locative"
                                    className="text-xs text-red-400/70 mt-1 flex items-center gap-1 hover:text-red-400 transition-colors"
                                >
                                    Voir les impayés →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart - Monthly Revenue */}
                        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/50 border border-slate-800">
                            <h3 className="text-sm font-semibold text-white mb-4">Revenus Mensuels {selectedYear}</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="shortMonth" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={formatAmount} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`]}
                                        />
                                        <Bar dataKey="collected" name="Encaissé" fill={COLORS.collected} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pending" name="En attente" fill={COLORS.pending} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="future" name="À venir" fill={COLORS.future} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="overdue" name="Retards" fill={COLORS.overdue} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart - Distribution */}
                        <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
                            <h3 className="text-sm font-semibold text-white mb-4">Répartition des Paiements</h3>
                            <div className="h-72">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                                formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`]}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Collection Rate Line Chart */}
                    <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
                        <h3 className="text-sm font-semibold text-white mb-4">Taux de Recouvrement Mensuel</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="shortMonth" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(value: any) => [`${value}%`, 'Taux']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="collectionRate"
                                        name="Taux de recouvrement"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: '#3b82f6' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </TabsContent>

                {/* DEPENSES TAB CONTENT */}
                <TabsContent value="depenses" className="mt-6">
                    <ExpenseList expenses={expenses} onExpenseDeleted={refreshExpenses} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
