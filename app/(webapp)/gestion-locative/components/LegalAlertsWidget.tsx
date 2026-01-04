'use client';

import { Scale, AlertTriangle, Clock, ArrowRight, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useTheme } from '../../theme-provider';

interface Alert {
    alert_type: string;
}

interface LegalAlertsWidgetProps {
    alerts: Alert[];
}

export function LegalAlertsWidget({ alerts }: LegalAlertsWidgetProps) {
    const { isDark } = useTheme();

    // Compter les alertes par type
    const j180Count = alerts.filter(a => a.alert_type === 'J-180').length;
    const j90Count = alerts.filter(a => a.alert_type === 'J-90').length;
    const totalAlerts = alerts.length;

    // Empty state - tout va bien
    if (totalAlerts === 0) {
        return (
            <div className={`relative overflow-hidden rounded-xl p-5 group transition-colors border ${
                isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'
                        }`}>
                            <Scale className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </div>
                        <div>
                            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Conformité Juridique</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Statut des échéances légales</p>
                        </div>
                    </div>

                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <CheckCircle className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Tout est en ordre</p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-600'}`}>Aucune échéance à venir</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Avec des alertes
    return (
        <Link href="/compte/legal" className="block group">
            <div className={`relative overflow-hidden rounded-xl transition-all duration-300 p-5 border ${
                isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                                isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'
                            }`}>
                                <Scale className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            </div>
                            <div>
                                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Conformité Juridique</h3>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Échéances à surveiller</p>
                            </div>
                        </div>

                        {/* Badge total */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'
                        }`}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                            </span>
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalAlerts}</span>
                        </div>
                    </div>

                    {/* Alertes par type */}
                    <div className="space-y-2 mb-4">
                        {j180Count > 0 && (
                            <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isDark
                                    ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                        <AlertTriangle className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Congé Reprise</p>
                                        <p className={`text-[10px] uppercase tracking-wide ${
                                            isDark ? 'text-slate-500' : 'text-gray-600'
                                        }`}>J-180 • 6 mois</p>
                                    </div>
                                </div>
                                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{j180Count}</span>
                            </div>
                        )}

                        {j90Count > 0 && (
                            <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                isDark
                                    ? 'bg-slate-800/50 border-slate-800 hover:bg-slate-800'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                        <Clock className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Reconduction</p>
                                        <p className={`text-[10px] uppercase tracking-wide ${
                                            isDark ? 'text-slate-500' : 'text-gray-600'
                                        }`}>J-90 • 3 mois</p>
                                    </div>
                                </div>
                                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{j90Count}</span>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center justify-between pt-3 border-t ${
                        isDark ? 'border-slate-800' : 'border-gray-200'
                    }`}>
                        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Voir le calendrier complet</span>
                        </div>
                        <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-all ${
                            isDark
                                ? 'text-slate-400 group-hover:text-white'
                                : 'text-gray-500 group-hover:text-gray-900'
                        }`} />
                    </div>
                </div>
            </div>
        </Link>
    );
}
