import { Scale, AlertTriangle, Clock, ArrowRight, CheckCircle, Calendar } from "lucide-react";
import { getLeaseAlerts } from "../../legal/actions";
import Link from "next/link";

export async function LegalAlertsWidget() {
    const alerts = await getLeaseAlerts();

    // Compter les alertes par type
    const j180Count = alerts.filter(a => a.alert_type === 'J-180').length;
    const j90Count = alerts.filter(a => a.alert_type === 'J-90').length;
    const totalAlerts = alerts.length;

    // Empty state - tout va bien
    if (totalAlerts === 0) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-5 group hover:border-slate-700 transition-colors">
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                            <Scale className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm">Conformité Juridique</h3>
                            <p className="text-xs text-slate-400">Statut des échéances légales</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <div>
                            <p className="text-sm font-medium text-white">Tout est en ordre</p>
                            <p className="text-xs text-slate-500">Aucune échéance à venir</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Avec des alertes
    return (
        <Link href="/compte/legal" className="block group">
            <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 p-5">
                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 group-hover:scale-105 transition-transform">
                                <Scale className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Conformité Juridique</h3>
                                <p className="text-xs text-slate-400">Échéances à surveiller</p>
                            </div>
                        </div>

                        {/* Badge total */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <span className="text-xs font-bold text-white">{totalAlerts}</span>
                        </div>
                    </div>

                    {/* Alertes par type */}
                    <div className="space-y-2 mb-4">
                        {j180Count > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-slate-700">
                                        <AlertTriangle className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Congé Reprise</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">J-180 • 6 mois</p>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-white">{j180Count}</span>
                            </div>
                        )}

                        {j90Count > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-slate-700">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Reconduction</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">J-90 • 3 mois</p>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-white">{j90Count}</span>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Voir le calendrier complet</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
