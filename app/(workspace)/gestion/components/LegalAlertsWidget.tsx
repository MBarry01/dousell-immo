'use client';

import { Scale, AlertTriangle, Clock, ArrowRight, CheckCircle, Calendar } from "lucide-react";
import Link from "next/link";

interface Alert {
    alert_type: string;
}

interface LegalAlertsWidgetProps {
    alerts: Alert[];
}

export function LegalAlertsWidget({ alerts }: LegalAlertsWidgetProps) {

    // Compter les alertes par type
    const j180Count = alerts.filter(a => a.alert_type === 'J-180').length;
    const j90Count = alerts.filter(a => a.alert_type === 'J-90').length;
    const totalAlerts = alerts.length;

    // Empty state - tout va bien
    if (totalAlerts === 0) {
        return (
            <div className="relative overflow-hidden rounded-xl p-5 group transition-colors border bg-card border-border hover:border-accent">
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl border bg-muted border-border">
                            <Scale className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Conformité Juridique</h3>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Statut des échéances légales</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 border-border">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Tout est en ordre</p>
                            <p className="text-xs text-muted-foreground">Aucune échéance à venir</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Avec des alertes
    return (
        <Link href="/gestion/documents-legaux" className="block group">
            <div className="relative overflow-hidden rounded-xl transition-all duration-300 p-5 border bg-card border-border hover:border-accent">
                <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl border group-hover:scale-105 transition-transform bg-muted border-border">
                                <Scale className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Conformité Juridique</h3>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Échéances à surveiller</p>
                            </div>
                        </div>

                        {/* Badge total */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted border-border">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-xs font-bold text-foreground">{totalAlerts}</span>
                        </div>
                    </div>

                    {/* Alertes par type */}
                    <div className="space-y-2 mb-4">
                        {j180Count > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg border transition-colors bg-muted/30 border-border hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-muted">
                                        <AlertTriangle className="h-4 w-4 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-foreground tracking-tighter">Congé Reprise</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">J-180 • 6 mois</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-foreground tracking-tighter">{j180Count}</span>
                            </div>
                        )}

                        {j90Count > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-lg border transition-colors bg-muted/30 border-border hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-muted">
                                        <Clock className="h-4 w-4 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-foreground tracking-tighter">Reconduction</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">J-90 • 3 mois</p>
                                    </div>
                                </div>
                                <span className="text-lg font-black text-foreground tracking-tighter">{j90Count}</span>
                            </div>
                        )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Voir le calendrier complet</span>
                        </div>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all text-muted-foreground group-hover:text-foreground" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
