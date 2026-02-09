import { Building2, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface KPICardsProps {
    stats: {
        occupancyRate: number;
        avgPaymentDelay: number;
        unpaidRate: number;
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
            subtext: "ce mois",
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
            default: return "bg-muted-foreground/30";
        }
    };

    return (
        <div id="tour-gestion-kpi-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {kpis.map((kpi, index) => {
                const Icon = kpi.icon;

                return (
                    <div
                        key={index}
                        className="px-3 py-2 rounded-lg border border-border bg-card shadow-sm transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-0.5">
                            <Icon className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                {kpi.label}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ml-auto ${getStatusColor(kpi.status)}`} />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-semibold text-foreground">
                                {kpi.value}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                                {kpi.subtext}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

