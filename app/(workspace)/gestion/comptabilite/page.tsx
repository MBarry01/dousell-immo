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
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useTheme } from "@/components/theme-provider";

import { calculateYearlyFinancials, LeaseInput, TransactionInput } from '@/lib/finance';
import { getExpensesByYear, getExpensesSummary, getProfitabilityByProperty, getComptabiliteData, PropertyProfitability, Expense } from './expenses-actions';
import { DownloadReportButton } from './components/DownloadReportButton';
import { AddExpenseDialog } from './components/AddExpenseDialog';
import { ExpenseList } from './components/ExpenseList';
import { ProfitabilityTable } from './components/ProfitabilityTable';
import { FeatureLockedState } from '@/components/gestion/FeatureLockedState';
import { KPICardSkeleton, ChartSkeleton } from "../components/PremiumSkeletons";

import { ActivationInlineNoticeClient } from '@/components/activation/ActivationInlineNoticeClient';

interface _MonthlyData {
    month: string;
    shortMonth: string;
    expected: number;
    collected: number;
    pending: number;
    future: number;
    overdue: number;
    collectionRate: number;
}

const _COLORS = {
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
    const [leases, setLeases] = useState<LeaseInput[]>([]);
    const [transactions, setTransactions] = useState<TransactionInput[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTab] = useState<'revenus' | 'depenses' | 'rentabilite'>('revenus');
    const [profitabilityData, setProfitabilityData] = useState<PropertyProfitability[]>([]);
    const [upgradeRequired, setUpgradeRequired] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setLoading(true);

            try {
                // 1. Fetch all comptabilité data via Server Action (team_id based)
                const comptaResult = await getComptabiliteData(selectedYear);

                if (!comptaResult.success && comptaResult.upgradeRequired) {
                    setUpgradeRequired(true);
                    setLoading(false);
                    return;
                }

                if (comptaResult.success && comptaResult.data) {
                    setLeases(comptaResult.data.leases as LeaseInput[]);
                    setTransactions(comptaResult.data.transactions);
                    setProperties(comptaResult.data.properties);
                }

                // 2. Fetch Expenses for the year (already team_id based)
                const expensesResult = await getExpensesByYear(selectedYear);
                if (expensesResult.success) {
                    setExpenses(expensesResult.expenses as Expense[]);
                }

                // 3. Fetch Profitability for PDF (already team_id based)
                const profitResult = await getProfitabilityByProperty(selectedYear);
                if (profitResult.success && profitResult.data) {
                    setProfitabilityData(profitResult.data);
                }
            } catch (error) {
                console.error('Error loading comptabilité data:', error);
            }

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

    // Calculate monthly data with Unified Logic
    const monthlyData = useMemo(() => {
        if (!leases.length) return [];

        // Transform transactions to match the unified input
        const txInputs: TransactionInput[] = transactions.map(t => ({
            ...t,
            period_month: (t as any).period_month,
            period_year: (t as any).period_year,
            paid_at: (t as any).paid_at
        }));

        const results = calculateYearlyFinancials(leases, txInputs, expenses, selectedYear);

        // Adapt unified results to UI format
        return results.map(res => ({
            month: fullMonthNames[res.month - 1],
            shortMonth: monthNames[res.month - 1],
            expected: res.totalExpected,
            collected: res.totalCollected,
            pending: res.pendingAmount, // Use explicit Amount
            future: res.future,
            overdue: res.overdueAmount, // Use explicit Amount
            collectionRate: res.collectionRate
        }));
    }, [leases, transactions, selectedYear]);

    // Calculate totals from monthly data
    const calculatedTotals = useMemo(() => {
        return monthlyData.reduce((acc, curr) => ({
            expected: acc.expected + curr.expected,
            collected: acc.collected + curr.collected,
            pending: acc.pending + curr.pending, // Removed + curr.future to avoid mixing Future with Arrears
            overdue: acc.overdue + curr.overdue,
            future: acc.future + curr.future, // Track future separately if needed
            collectionRate: 0
        }), { expected: 0, collected: 0, pending: 0, overdue: 0, future: 0, collectionRate: 0 });
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

    // Ne montrer que depuis le premier mois avec des données réelles
    const chartData = useMemo(() => {
        const firstDataIndex = monthlyData.findIndex(
            m => m.expected > 0 || m.collected > 0 || m.overdue > 0
        );
        return firstDataIndex === -1 ? monthlyData : monthlyData.slice(firstDataIndex);
    }, [monthlyData]);

    const formatAmount = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return val.toString();
    };

    if (authLoading || loading) {
        return (
            <div className="p-6 space-y-8">
                <div className="space-y-2">
                    <Skeleton className={`h-10 w-64 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-200'}`} />
                    <Skeleton className={`h-4 w-96 rounded-lg ${isDark ? 'bg-slate-900/50' : 'bg-gray-200'}`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                </div>

                <ChartSkeleton className="h-96" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className={`h-64 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-200'}`} />
                    <Skeleton className={`h-64 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-200'}`} />
                </div>
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

    if (upgradeRequired) {
        return (
            <FeatureLockedState
                title="Comptabilité & Analyses Financières"
                description="Accédez à des rapports détaillés, suivez votre rentabilité en temps réel et générez des exports comptables professionnels."
                requiredTier="pro"
            />
        );
    }

    return (
        <>
            <ActivationInlineNoticeClient
                moduleLabel="la Comptabilité"
                requiredAction="configurez d'abord un bail"
                ctaLabel="Configurer maintenant →"
                ctaHref="/gestion/biens"
                requiredStage={4}
            />
            <div className={`p-4 md:p-6 space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <p className={`text-[10px] uppercase font-black tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gestion Locative</p>
                        <h1 className={`text-2xl md:text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Dashboard Financier</h1>
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
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'revenus' | 'depenses' | 'rentabilite')} className="w-full">
                    <TabsList id="tour-compta-tabs" className="w-full md:w-auto">
                        <TabsTrigger value="revenus" className="text-xs md:text-sm flex-1 md:flex-none">
                            <span className="hidden md:inline">Revenus (Loyers)</span>
                            <span className="md:hidden">Revenus</span>
                        </TabsTrigger>
                        <TabsTrigger value="depenses" className="text-xs md:text-sm flex-1 md:flex-none text-red-600 dark:text-red-400 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                            Dépenses
                        </TabsTrigger>
                        <TabsTrigger value="rentabilite" className="text-xs md:text-sm flex-1 md:flex-none">
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
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attendu</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl md:text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatAmount(totals.expected)}</span>
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>FCFA</span>
                                </div>
                            </div>

                            {/* Collected */}
                            <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                    <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Encaissé</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl md:text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatAmount(totals.collected)}</span>
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>FCFA</span>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-green-500 mt-2 flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span className="truncate">{totals.collectionRate}% de recouvrement</span>
                                </p>
                            </div>

                            {/* Pending */}
                            <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                    <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                        <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>En attente</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl md:text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatAmount(totals.pending)}</span>
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>FCFA</span>
                                </div>
                            </div>

                            {/* Overdue */}
                            <div className={`p-3 md:p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                    <div className={`p-1.5 md:p-2 rounded-md ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                        <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Retards</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl md:text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.overdue)}</span>
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>FCFA</span>
                                </div>
                                {totals.overdue > 0 && (
                                    <Link
                                        href="/gestion?filter=overdue"
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
                            <div className={`lg:col-span-2 p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Revenus Mensuels {selectedYear}</h3>
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
                            <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Répartition des Paiements</h3>
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
                                        <div className={`h-full flex items-center justify-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                            Aucune donnée disponible
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collection Rate Line Chart */}
                        <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Taux de Recouvrement Mensuel</h3>
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
            </div >
        </>
    );
}
