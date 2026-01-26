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
import { useTheme } from '@/components/workspace/providers/theme-provider';

import { calculateFinancials, LeaseInput, TransactionInput } from '@/lib/finance';
import { getExpensesByYear, getExpensesSummary, getProfitabilityByProperty, PropertyProfitability, Expense } from './expenses-actions';
import { DownloadReportButton } from './components/DownloadReportButton';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { ExpenseList } from './components/ExpenseList';
import { ProfitabilityTable } from './components/ProfitabilityTable';

import { OnboardingTour, useOnboardingTour, TourStep } from '@/components/onboarding/OnboardingTour';
import { FloatingHelpButton } from '@/components/ui/floating-help-button';

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
    const { isDark } = useTheme();
    const { user, loading: authLoading } = useAuth();
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_comptabilite_tour', 1500);
    const [leases, setLeases] = useState<LeaseInput[]>([]);
    const [transactions, setTransactions] = useState<TransactionInput[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'revenus' | 'depenses' | 'rentabilite'>('revenus');
    const [profitabilityData, setProfitabilityData] = useState<PropertyProfitability[]>([]);

    // Tour Steps
    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-compta-kpi',
            title: 'Indicateurs financiers',
            description: 'Visualisez vos revenus attendus, encaissés, en attente et les retards de paiement en un coup d\'œil.',
            imageSrc: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'KPIs financiers'
        },
        {
            targetId: 'tour-compta-chart',
            title: 'Graphiques de revenus',
            description: 'Analysez vos revenus mensuels et la répartition des paiements avec des graphiques interactifs.',
            imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Graphiques financiers'
        },
        {
            targetId: 'tour-compta-tabs',
            title: 'Revenus & Dépenses',
            description: 'Basculez entre la vue des revenus (loyers) et celle des dépenses pour une comptabilité complète.',
            imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Tabs comptabilité'
        },
        {
            targetId: 'tour-compta-export',
            title: 'Export & Actions',
            description: 'Exportez vos données financières et ajoutez des dépenses directement depuis cette page.',
            imageSrc: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Export financier'
        }
    ], []);

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

                // Fetch Profitability for PDF
                const profitResult = await getProfitabilityByProperty(selectedYear);
                if (profitResult.success && profitResult.data) {
                    setProfitabilityData(profitResult.data);
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

    const chartColors = {
        collected: '#22c55e',
        pending: '#f59e0b',
        overdue: '#ef4444',
        expected: '#3b82f6',
        future: isDark ? '#334155' : '#cbd5e1', // Slate 700 (dark) vs Slate 300 (light)
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
        { name: 'Encaissé', value: totals.collected, color: chartColors.collected },
        { name: 'En attente', value: totals.pending, color: chartColors.pending }, // This now includes future
        { name: 'En retard', value: totals.overdue, color: chartColors.overdue },
    ].filter(d => d.value > 0), [totals, chartColors]);

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
                <Skeleton className={`h-10 w-64 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className={`h-32 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    ))}
                </div>
                <Skeleton className={`h-80 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Veuillez vous connecter</p>
            </div>
        );
    }

    return (
        <div className={`p-4 md:p-6 space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {/* Premium Onboarding Tour */}
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_comptabilite_tour"
            />

            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Gestion Locative</p>
                    <h1 className={`text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Financier</h1>
                </div>

                {/* Year Selector + Actions */}
                <div id="tour-compta-export" className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className={`flex items-center gap-2 rounded-lg px-2.5 md:px-3 py-1.5 md:py-2 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                        }`}>
                        <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className={`bg-transparent text-sm outline-none cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'
                                }`}
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year} className={isDark ? 'bg-slate-900' : 'bg-white'}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* PDF Report Button */}
                    <DownloadReportButton
                        year={selectedYear}
                        globalStats={profitabilityData.reduce((acc, curr) => ({
                            revenue: acc.revenue + curr.totalRevenue,
                            expenses: acc.expenses + curr.totalExpenses,
                            profit: acc.profit + curr.netProfit,
                            margin: (acc.revenue + curr.totalRevenue) > 0
                                ? ((acc.profit + curr.netProfit) / (acc.revenue + curr.totalRevenue) * 100)
                                : 0
                        }), { revenue: 0, expenses: 0, profit: 0, margin: 0 })}
                        properties={profitabilityData}
                    />

                    {/* Add Expense Button */}
                    <AddExpenseDialog properties={properties} onExpenseAdded={refreshExpenses} />
                </div>
            </div>

            {/* Tabs for Revenue vs Expenses vs Profitability */}
            <Tabs id="tour-compta-tabs" value={activeTab} onValueChange={(v) => setActiveTab(v as 'revenus' | 'depenses' | 'rentabilite')} className="w-full">
                <TabsList className={`w-full md:w-auto ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-100 border border-gray-200'}`}>
                    <TabsTrigger value="revenus" className={`text-xs md:text-sm flex-1 md:flex-none ${isDark ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'}`}>
                        <span className="hidden md:inline">Revenus (Loyers)</span>
                        <span className="md:hidden">Revenus</span>
                    </TabsTrigger>
                    <TabsTrigger value="depenses" className={`text-xs md:text-sm flex-1 md:flex-none ${isDark ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'}`}>
                        Dépenses
                    </TabsTrigger>
                    <TabsTrigger value="rentabilite" className={`text-xs md:text-sm flex-1 md:flex-none ${isDark ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : 'data-[state=active]:bg-white data-[state=active]:text-gray-900'}`}>
                        Rentabilité
                    </TabsTrigger>
                </TabsList>

                {/* REVENUS TAB CONTENT */}
                <TabsContent value="revenus" className="mt-6 space-y-6">
                    {/* KPI Cards */}
                    <div id="tour-compta-kpi" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {/* Total Expected */}
                        <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                    <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Attendu</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl md:text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.expected)}</span>
                                <span className={`text-[10px] md:text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>FCFA</span>
                            </div>
                        </div>

                        {/* Collected */}
                        <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Encaissé</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl md:text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.collected)}</span>
                                <span className={`text-[10px] md:text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>FCFA</span>
                            </div>
                            <p className="text-[10px] md:text-xs text-green-500 mt-1.5 md:mt-2 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                <span className="truncate">{totals.collectionRate}% taux de recouvrement</span>
                            </p>
                        </div>

                        {/* Pending */}
                        <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                    <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>En attente</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl md:text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.pending)}</span>
                                <span className={`text-[10px] md:text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>FCFA</span>
                            </div>
                        </div>

                        {/* Overdue */}
                        <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Retards</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl md:text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.overdue)}</span>
                                <span className={`text-[10px] md:text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>FCFA</span>
                            </div>
                            {totals.overdue > 0 && (
                                <Link
                                    href="/gestion-locative?filter=overdue"
                                    className="text-[10px] md:text-xs text-red-500 mt-1.5 md:mt-2 flex items-center gap-1 hover:underline"
                                >
                                    Voir les impayés →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div id="tour-compta-chart" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart - Monthly Revenue */}
                        <div className={`lg:col-span-2 p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
                            }`}>
                            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Revenus Mensuels {selectedYear}</h3>
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
                                        <Bar dataKey="collected" name="Encaissé" fill={chartColors.collected} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pending" name="En attente" fill={chartColors.pending} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="future" name="À venir" fill={chartColors.future} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="overdue" name="Retards" fill={chartColors.overdue} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart - Distribution */}
                        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
                            }`}>
                            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Répartition des Paiements</h3>
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
                                    <div className={`h-full flex items-center justify-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'
                                        }`}>
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Collection Rate Line Chart */}
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'
                        }`}>
                        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Taux de Recouvrement Mensuel</h3>
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

                {/* RENTABILITE TAB CONTENT */}
                <TabsContent value="rentabilite" className="mt-6">
                    <ProfitabilityTable year={selectedYear} />
                </TabsContent>
            </Tabs>

            {/* Bouton pour relancer le tour (Portal) */}
            <FloatingHelpButton onClick={resetTour} />
        </div>
    );
}
