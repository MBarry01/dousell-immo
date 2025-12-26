import { Wallet, Clock, AlertCircle } from 'lucide-react';

interface RentalStatsProps {
    stats: {
        collected: string;
        pending: string;
        overdue: string;
    };
}

export function RentalStats({ stats }: RentalStatsProps) {
    const cards = [
        { title: "Collecté ce mois", value: stats.collected, color: "text-green-500", icon: Wallet, bg: "bg-green-500/10" },
        { title: "En attente", value: stats.pending, color: "text-yellow-500", icon: Clock, bg: "bg-yellow-500/10" },
        { title: "Retards / Impayés", value: stats.overdue, color: "text-red-500", icon: AlertCircle, bg: "bg-red-500/10" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, i) => (
                <div key={i} className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800 flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${card.bg}`}>
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">{card.title}</p>
                        <p className={`text-xl font-bold ${card.color}`}>{card.value} FCFA</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
