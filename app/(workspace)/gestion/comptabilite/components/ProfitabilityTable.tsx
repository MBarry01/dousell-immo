'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Building2, Loader2 } from 'lucide-react';
import { getProfitabilityByProperty, PropertyProfitability } from '../expenses-actions';
import { toast } from 'sonner';
import { useTheme } from "@/components/theme-provider";

interface ProfitabilityTableProps {
    year: number;
}

export function ProfitabilityTable({ year }: ProfitabilityTableProps) {
    const { isDark } = useTheme();
    const [data, setData] = useState<PropertyProfitability[]>([]);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await getProfitabilityByProperty(year);
            if (result.success && result.data) {
                setData(result.data);
                if (result.debug) setDebugInfo(result.debug);
            } else if (!result.success && result.error) {
                toast.error(result.error);
                console.error(result.error);
            }
            setLoading(false);
        };
        loadData();
    }, [year]);

    const formatAmount = (amount: number) => amount.toLocaleString('fr-FR');

    // Calculate totals
    const totals = data.reduce(
        (acc, item) => ({
            revenue: acc.revenue + item.totalRevenue,
            expenses: acc.expenses + item.totalExpenses,
            profit: acc.profit + item.netProfit,
        }),
        { revenue: 0, expenses: 0, profit: 0 }
    );

    const overallMargin = totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100) : 0;

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Chargement...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                <Building2 className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune donnée de rentabilité</p>
                <p className="text-sm">Ajoutez des baux et des dépenses pour voir la rentabilité.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-2`}>
                <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Revenus Totaux</p>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatAmount(totals.revenue)} FCFA</p>
                </div>
                <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Dépenses Totales</p>
                    <p className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{formatAmount(totals.expenses)} FCFA</p>
                </div>
                <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Bénéfice Net</p>
                    <p className={`text-lg font-semibold ${totals.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatAmount(totals.profit)} FCFA
                    </p>
                </div>
                <div className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Marge Globale</p>
                    <p className={`text-lg font-semibold flex items-center gap-2 ${overallMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {overallMargin >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {overallMargin.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`text-left text-xs border-b ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                <th className="px-4 py-3 font-medium">Bien / Locataire</th>
                                <th className="px-4 py-3 font-medium text-right">Revenus</th>
                                <th className="px-4 py-3 font-medium text-right">Dépenses</th>
                                <th className="px-4 py-3 font-medium text-right">Bénéfice Net</th>
                                <th className="px-4 py-3 font-medium text-right">Marge</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                            {data.map((item, index) => (
                                <tr key={index} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                                            <span className="font-medium truncate max-w-[200px]">{item.propertyAddress}</span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-right ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                        {formatAmount(item.totalRevenue)} FCFA
                                    </td>
                                    <td className={`px-4 py-3 text-right ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {formatAmount(item.totalExpenses)} FCFA
                                    </td>
                                    <td className={`px-4 py-3 text-right font-medium ${item.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {formatAmount(item.netProfit)} FCFA
                                    </td>
                                    <td className={`px-4 py-3 text-right ${item.profitMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {item.profitMargin >= 50 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : item.profitMargin < 0 ? (
                                                <TrendingDown className="w-4 h-4" />
                                            ) : null}
                                            {item.profitMargin.toFixed(1)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
