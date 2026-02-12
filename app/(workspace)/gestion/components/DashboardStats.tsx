'use client';

import { Wallet, Clock, AlertCircle, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from "@/components/theme-provider";

interface DashboardStatsProps {
    stats: {
        totalExpected: number;
        totalCollected: number;
        totalPending: number;
        paidCount: number;
        pendingCount: number;
        overdueCount: number;
        collectedPercent: number;
        totalTenants: number;
    };
    onFilterChange?: (status: 'all' | 'paid' | 'pending' | 'overdue') => void;
    activeFilter?: 'all' | 'paid' | 'pending' | 'overdue';
}

export function DashboardStats({ stats, onFilterChange, activeFilter = 'all' }: DashboardStatsProps) {
    const { isDark } = useTheme();

    const formatCompact = (num: number) => {
        return new Intl.NumberFormat('fr-FR', {
            notation: "compact",
            maximumFractionDigits: 1
        }).format(num);
    };

    const cards = [
        {
            title: "Total Attendu",
            value: formatCompact(stats.totalExpected),
            suffix: "FCFA",
            icon: Wallet,
            colorClass: isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600",
            description: `${stats.paidCount + stats.pendingCount + stats.overdueCount} locataires`,
            filter: 'all' as const,
        },
        {
            title: "Encaissé",
            value: formatCompact(stats.totalCollected),
            suffix: "FCFA",
            icon: TrendingUp,
            colorClass: isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600",
            description: `${stats.collectedPercent}% du total`,
            trend: stats.collectedPercent >= 50 ? "up" : "down",
            filter: 'paid' as const,
        },
        {
            title: "En Attente",
            value: formatCompact(stats.totalPending),
            suffix: "FCFA",
            icon: Clock,
            colorClass: isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600",
            description: `${stats.pendingCount} paiement${stats.pendingCount > 1 ? 's' : ''} en cours`,
            filter: 'pending' as const,
        },
        {
            title: "Retards",
            value: stats.overdueCount.toString(),
            suffix: stats.overdueCount > 0 ? "impayé" + (stats.overdueCount > 1 ? "s" : "") : "",
            icon: AlertCircle,
            colorClass: isDark ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-600",
            description: stats.overdueCount > 0 ? "Action requise" : "Tout est à jour",
            alert: stats.overdueCount > 0,
            filter: 'overdue' as const,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => {
                const isActive = activeFilter === card.filter;
                const Icon = card.icon;

                return (
                    <div
                        key={index}
                        onClick={() => onFilterChange?.(card.filter)}
                        className={`
                            p-5 rounded-lg border shadow-sm cursor-pointer transition-all duration-200
                            ${isActive
                                ? isDark
                                    ? 'bg-gray-900 border-gray-700 ring-1 ring-gray-700'
                                    : 'bg-white border-gray-300 ring-1 ring-gray-300'
                                : isDark
                                    ? 'bg-black border-gray-800 hover:border-gray-700'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        {/* Header : Icone colorée + Titre */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-md ${card.colorClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <h3 className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                {card.title}
                            </h3>
                        </div>

                        <div className="flex items-baseline gap-1">
                            {/* Chiffre : Toujours Neutre (Slate-900 / White) */}
                            <span className={`text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                {card.value}
                            </span>
                            {/* Unité : Discrète */}
                            {card.suffix && (
                                <span className={`text-sm font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'
                                    }`}>
                                    {card.suffix}
                                </span>
                            )}
                        </div>

                        {/* Description subtile en bas */}
                        {card.description && (
                            <div className={`mt-2 text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                {card.trend === "up" && (
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                )}
                                {card.trend === "down" && (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                {card.alert && (
                                    <AlertCircle className="w-3 h-3 text-red-500 mr-1" />
                                )}
                                {card.description}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
