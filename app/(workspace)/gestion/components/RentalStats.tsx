import { Wallet, Clock, AlertCircle } from 'lucide-react';

interface RentalStatsProps {
    stats: {
        collected: string;
        pending: string;
        overdue: string;
    };
}

export function RentalStats({ stats }: RentalStatsProps) {
    const _cards = [
        { title: "Collecté ce mois", value: stats.collected, color: "text-green-500", icon: Wallet, bg: "bg-green-500/10" },
        { title: "En attente", value: stats.pending, color: "text-yellow-500", icon: Clock, bg: "bg-yellow-500/10" },
        { title: "Retards / Impayés", value: stats.overdue, color: "text-red-500", icon: AlertCircle, bg: "bg-red-500/10" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-green-500/10">
                    <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-medium">Collecté ce mois</p>
                    <p className="text-xl font-bold text-green-500">{stats.collected} FCFA</p>
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-yellow-500/10">
                    <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-medium">En attente</p>
                    <p className="text-xl font-bold text-yellow-500">{stats.pending} FCFA</p>
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-gray-900/40 border border-gray-800 flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${Number(stats.overdue.replace(/\s/g, '')) > 0 ? 'bg-red-500/20' : 'bg-gray-800'}`}>
                    <AlertCircle className={`w-6 h-6 ${Number(stats.overdue.replace(/\s/g, '')) > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-medium">Retards / Impayés</p>
                    <p className={`text-xl font-bold ${Number(stats.overdue.replace(/\s/g, '')) > 0 ? 'text-red-500' : 'text-gray-300'}`}>{stats.overdue} FCFA</p>
                </div>
            </div>
        </div>
    );
}
