"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useTheme } from "@/components/workspace/providers/theme-provider";
import { TrendingUp } from "lucide-react";

interface RevenueHistoryItem {
    month: string;
    year: number;
    monthNum: number;
    collected: number;
    expected: number;
}

interface RevenueChartProps {
    data: RevenueHistoryItem[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    const { isDark } = useTheme();
    const [showExpected, setShowExpected] = useState(true);

    // Format data for display
    const chartData = data.map((item) => ({
        name: `${item.month} ${item.year}`,
        collected: item.collected,
        expected: item.expected,
    }));

    // Calculate totals for summary
    const totalCollected = data.reduce((sum, d) => sum + d.collected, 0);
    const totalExpected = data.reduce((sum, d) => sum + d.expected, 0);
    const collectionRate = totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 100;

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-3 rounded-lg shadow-lg border ${isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                    }`}>
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className={isDark ? "text-slate-300" : "text-gray-600"}>
                                {entry.name === "collected" ? "Encaissé" : "Attendu"}:
                            </span>
                            <span className="font-mono font-medium">
                                {entry.value.toLocaleString('fr-FR')} FCFA
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (data.length === 0) {
        return (
            <div className={`p-6 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"
                }`}>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#F4C430]" />
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Évolution des Revenus
                    </h3>
                </div>
                <p className={`text-center py-8 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    Pas encore de données. Les revenus apparaîtront ici après les premiers encaissements.
                </p>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#F4C430]" />
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        Évolution des Revenus
                    </h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                        <p className={`font-mono font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                            {totalCollected.toLocaleString('fr-FR')}
                        </p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            Encaissé
                        </p>
                    </div>
                    <div className="text-center">
                        <p className={`font-bold ${collectionRate >= 90 ? "text-green-500" : collectionRate >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                            {collectionRate}%
                        </p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            Taux
                        </p>
                    </div>
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showExpected}
                        onChange={(e) => setShowExpected(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F4C430] focus:ring-[#F4C430]"
                    />
                    <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        Afficher attendu
                    </span>
                </label>
            </div>

            {/* Chart */}
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F4C430" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#F4C430" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? "#334155" : "#e5e7eb"}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: isDark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: isDark ? "#475569" : "#d1d5db" }}
                        />
                        <YAxis
                            tick={{ fill: isDark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            tickLine={false}
                            axisLine={{ stroke: isDark ? "#475569" : "#d1d5db" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {showExpected && (
                            <Area
                                type="monotone"
                                dataKey="expected"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#colorExpected)"
                                strokeWidth={2}
                                name="expected"
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="collected"
                            stroke="#F4C430"
                            fillOpacity={1}
                            fill="url(#colorCollected)"
                            strokeWidth={2}
                            name="collected"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F4C430]" />
                    <span className={isDark ? "text-slate-400" : "text-gray-600"}>Encaissé</span>
                </div>
                {showExpected && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className={isDark ? "text-slate-400" : "text-gray-600"}>Attendu</span>
                    </div>
                )}
            </div>
        </div>
    );
}
