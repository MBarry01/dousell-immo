"use client";

import { useState, useEffect } from "react";
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        console.log("[RevenueChart] ✓ Component mounted");
    }, []);

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
                <div className="p-3 rounded-lg shadow-lg border border-border bg-card text-card-foreground">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
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

    if (!mounted || data.length === 0) {
        return (
            <div className="p-6 rounded-xl border border-border bg-muted/20 min-h-[300px] flex items-center justify-center">
                <div className="text-center space-y-2">
                    <TrendingUp className="w-5 h-5 text-primary mx-auto animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                        {!mounted ? "Chargement du graphique..." : "Pas encore de données."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div id="tour-gestion-revenue-chart" className="p-6 rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                        Évolution des Revenus
                    </h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                        <p className="font-mono font-bold text-green-600 dark:text-green-500">
                            {totalCollected.toLocaleString('fr-FR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Encaissé
                        </p>
                    </div>
                    <div className="text-center">
                        <p className={`font-bold ${collectionRate >= 90 ? "text-green-500" : collectionRate >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                            {collectionRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">
                        Afficher attendu
                    </span>
                </label>
            </div>

            {/* Chart */}
            <div className="h-[250px] min-h-[250px] w-full">
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
                            stroke="currentColor"
                            className="text-border"
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            className="text-muted-foreground"
                            tickLine={false}
                            axisLine={{ stroke: "currentColor", className: "text-border" }}
                        />
                        <YAxis
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            className="text-muted-foreground"
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            tickLine={false}
                            axisLine={{ stroke: "currentColor", className: "text-border" }}
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
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Encaissé</span>
                </div>
                {showExpected && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-muted-foreground">Attendu</span>
                    </div>
                )}
            </div>
        </div>
    );
}
