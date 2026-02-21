import { Building2, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface KPICardsProps {
    stats: {
        occupancyRate: number;
        avgPaymentDelay: number;
        unpaidRate: number;
        overdueAmount: number; // New field
        avgRevenuePerProperty: number;
        totalProperties: number;
        activeLeases: number;
    };
}

export function KPICards({ stats }: KPICardsProps) {

    const kpis = [
        {
            label: "Taux d'occupation",
            value: `${stats.occupancyRate}%`,
            subtext: `${stats.activeLeases} baux actifs`,
            icon: Building2,
            status: stats.occupancyRate >= 80 ? "good" : stats.occupancyRate >= 50 ? "warning" : "bad",
        },
        {
            label: "Délai moyen de paiement",
            value: `${stats.avgPaymentDelay}j`,
            subtext: stats.avgPaymentDelay === 0 ? "Tous à l'heure" : "après échéance",
            icon: Clock,
            status: stats.avgPaymentDelay <= 3 ? "good" : stats.avgPaymentDelay <= 7 ? "warning" : "bad",
        },
        {
            label: "Taux d'impayés",
            value: `${stats.unpaidRate}%`,
            subtext: stats.overdueAmount > 0
                ? `${stats.overdueAmount.toLocaleString('fr-FR')} FCFA`
                : "ce mois",
            icon: AlertTriangle,
            status: stats.unpaidRate === 0 ? "good" : stats.unpaidRate <= 20 ? "warning" : "bad",
        },
        {
            label: "Revenu moyen / bien",
            value: `${stats.avgRevenuePerProperty.toLocaleString('fr-FR')}`,
            subtext: "FCFA / mois",
            icon: TrendingUp,
            status: "neutral",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "good": return "bg-emerald-500";
            case "warning": return "bg-amber-500";
            case "bad": return "bg-red-500";
            default: return "bg-slate-300";
        }
    };

    return (
        <div id="tour-gestion-kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {kpis.map((kpi, index) => {
                const Icon = kpi.icon;

                return (
                    <div
                        key={index}
                        className="px-4 py-3 rounded-xl border border-border bg-card shadow-sm transition-all active:scale-[0.98] active-press"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                {kpi.label}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ml-auto ${getStatusColor(kpi.status)}`} />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {kpi.value}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {kpi.subtext}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

