'use client';

import { Wallet, Clock, AlertCircle, Users, TrendingUp, TrendingDown } from 'lucide-react';

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
    const formatAmount = (amount: number) => {
        return amount.toLocaleString('fr-FR');
    };

    const cards = [
        {
            title: "Total Attendu",
            value: `${formatAmount(stats.totalExpected)}`,
            suffix: "FCFA",
            icon: Wallet,
            iconBg: "bg-slate-800",
            iconColor: "text-white",
            valueColor: "text-white",
            description: `${stats.paidCount + stats.pendingCount + stats.overdueCount} locataires`,
            filter: 'all' as const,
        },
        {
            title: "Encaissé",
            value: `${formatAmount(stats.totalCollected)}`,
            suffix: "FCFA",
            icon: TrendingUp,
            iconBg: "bg-slate-800",
            iconColor: "text-white",
            valueColor: "text-green-400",
            description: `${stats.collectedPercent}% du total`,
            trend: stats.collectedPercent >= 50 ? "up" : "down",
            filter: 'paid' as const,
        },
        {
            title: "En Attente",
            value: `${formatAmount(stats.totalPending)}`,
            suffix: "FCFA",
            icon: Clock,
            iconBg: "bg-slate-800",
            iconColor: "text-white",
            valueColor: stats.totalPending > 0 ? "text-yellow-400" : "text-slate-400",
            description: `${stats.pendingCount} paiement${stats.pendingCount > 1 ? 's' : ''} en cours`,
            filter: 'pending' as const,
        },
        {
            title: "Retards",
            value: stats.overdueCount.toString(),
            suffix: stats.overdueCount > 0 ? "impayé" + (stats.overdueCount > 1 ? "s" : "") : "",
            icon: AlertCircle,
            iconBg: "bg-slate-800",
            iconColor: "text-white",
            valueColor: stats.overdueCount > 0 ? "text-red-400" : "text-slate-400",
            description: stats.overdueCount > 0 ? "Action requise" : "Tout est à jour",
            alert: stats.overdueCount > 0,
            filter: 'overdue' as const,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const isActive = activeFilter === card.filter;

                return (
                    <div
                        key={index}
                        onClick={() => onFilterChange?.(card.filter)}
                        className={`
                            relative overflow-hidden cursor-pointer
                            p-4 md:p-5 rounded-xl 
                            bg-slate-900/80 border 
                            ${isActive
                                ? 'border-blue-500 bg-slate-800/80'
                                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }
                            transition-all duration-200
                            group
                            ${card.alert && !isActive ? 'ring-1 ring-red-500/20' : ''}
                        `}
                    >
                        {/* Background gradient effect */}
                        <div className={`
                            absolute inset-0 opacity-0 group-hover:opacity-100
                            transition-opacity duration-300
                            bg-gradient-to-br from-slate-800/50 to-transparent
                        `} />

                        <div className="relative z-10">
                            {/* Header: Icon + Title */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`
                                    p-2.5 md:p-3 rounded-xl ${card.iconBg}
                                    transition-transform duration-200
                                    group-hover:scale-105
                                `}>
                                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.iconColor}`} />
                                </div>
                                <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                    {card.title}
                                </span>
                            </div>

                            {/* Value */}
                            <div className="flex items-baseline gap-1.5 mb-1">
                                <span className={`text-xl md:text-2xl font-bold ${card.valueColor} tracking-tight`}>
                                    {card.value}
                                </span>
                                {card.suffix && (
                                    <span className="text-xs md:text-sm text-slate-500 font-medium">
                                        {card.suffix}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                {card.trend === "up" && (
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                )}
                                {card.trend === "down" && (
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                {card.description}
                            </p>
                        </div>

                        {/* Alert pulse animation */}
                        {card.alert && (
                            <div className="absolute top-3 right-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </div>
                        )}

                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
