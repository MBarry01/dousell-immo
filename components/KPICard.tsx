import React from 'react';

interface KPICardProps {
    label: string;
    value: number;
    currency?: string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'gold' | 'green' | 'red' | 'blue';
    small?: boolean;
    alert?: {
        type: 'warning' | 'danger' | 'info';
        icon?: string;
        message?: string;
    };
}

export function KPICard({
    label,
    value,
    currency = '',
    unit = '',
    trend,
    color = 'gold',
    small = false,
    alert,
}: KPICardProps) {
    const bgColor = {
        gold: 'from-amber-500/20 to-amber-500/5', // Adaptation gold -> amber pour Tailwind standard si gold pas défini
        green: 'from-green-500/20 to-green-500/5',
        red: 'from-red-500/20 to-red-500/5',
        blue: 'from-blue-500/20 to-blue-500/5',
    }[color];

    const textColor = {
        gold: 'text-amber-400',
        green: 'text-green-400',
        red: 'text-red-400',
        blue: 'text-blue-400',
    }[color];

    const borderColor = {
        gold: 'border-amber-500/30',
        green: 'border-green-500/30',
        red: 'border-red-500/30',
        blue: 'border-blue-500/30',
    }[color];

    const formattedValue = new Intl.NumberFormat('fr-FR', {
        style: currency ? 'currency' : 'decimal',
        currency: currency || undefined,
        maximumFractionDigits: 0,
    }).format(value);

    return (
        <div
            className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-amber-500/10`}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
                    <p className={`text-2xl font-bold ${textColor} tracking-tight`}>
                        {formattedValue}
                        {unit && <span className="text-sm ml-1 font-normal opacity-70">{unit}</span>}
                    </p>
                </div>
                {trend && (
                    <div
                        className={`text-lg p-2 rounded-lg bg-gray-900/50 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
                            }`}
                    >
                        {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
                    </div>
                )}
            </div>

            {alert && (
                <div
                    className={`mt-4 p-2.5 rounded-lg text-[11px] leading-relaxed ${alert.type === 'warning'
                            ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                            : alert.type === 'danger'
                                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}
                >
                    <div className="flex gap-2">
                        {alert.icon && <span className="shrink-0">{alert.icon}</span>}
                        <span>{alert.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
