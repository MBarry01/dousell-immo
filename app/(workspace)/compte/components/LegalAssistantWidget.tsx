"use client";

import { Card } from "@/components/ui/card";
import { Scale, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { addMonths } from "date-fns";

interface LegalWidgetStats {
    activeLeases: number;
    j180Alerts: number;
    j90Alerts: number;
    complianceScore: number;
}

export function LegalAssistantWidget() {
    const [stats, setStats] = useState<LegalWidgetStats>({
        activeLeases: 0,
        j180Alerts: 0,
        j90Alerts: 0,
        complianceScore: 100
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLegalStats() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Récupérer les baux actifs avec date de fin
            const { data: leases } = await supabase
                .from('leases')
                .select('id, end_date')
                .eq('owner_id', user.id)
                .eq('status', 'active')
                .not('end_date', 'is', null);

            const activeLeases = leases?.length || 0;

            // Calculer les alertes
            const today = new Date();
            const threeMonthsFromNow = addMonths(today, 3);
            const sixMonthsFromNow = addMonths(today, 6);

            let j180 = 0;
            let j90 = 0;

            (leases || []).forEach(lease => {
                if (!lease.end_date) return;
                const endDate = new Date(lease.end_date);

                // J-180 (6 mois)
                if (endDate <= sixMonthsFromNow && endDate > threeMonthsFromNow) {
                    j180++;
                }

                // J-90 (3 mois)
                if (endDate <= threeMonthsFromNow && endDate > today) {
                    j90++;
                }
            });

            setStats({
                activeLeases,
                j180Alerts: j180,
                j90Alerts: j90,
                complianceScore: 100
            });
            setLoading(false);
        }

        fetchLegalStats();
    }, []);

    const totalAlerts = stats.j180Alerts + stats.j90Alerts;
    const hasAlerts = totalAlerts > 0;

    return (
        <Link href="/gestion/documents-legaux">
            <Card className={`cursor-pointer border transition-all hover:shadow-lg ${hasAlerts
                    ? 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50'
                    : 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
                }`}>
                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${hasAlerts ? 'bg-orange-500/10' : 'bg-green-500/10'
                                }`}>
                                <Scale className={`h-5 w-5 ${hasAlerts ? 'text-orange-500' : 'text-green-500'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    Assistant Juridique
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Conformité Loi 2014 & COCC
                                </p>
                            </div>
                        </div>

                        {/* Badge de statut */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${hasAlerts
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                            {hasAlerts ? (
                                <>
                                    <AlertTriangle className="h-3 w-3" />
                                    {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-3 w-3" />
                                    Conforme
                                </>
                            )}
                        </div>
                    </div>

                    {/* Statistiques */}
                    {loading ? (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            Chargement...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {hasAlerts ? (
                                <>
                                    {stats.j180Alerts > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm text-foreground">J-180 (Congé Reprise)</span>
                                            </div>
                                            <span className="text-sm font-semibold text-orange-500">
                                                {stats.j180Alerts}
                                            </span>
                                        </div>
                                    )}

                                    {stats.j90Alerts > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm text-foreground">J-90 (Reconduction)</span>
                                            </div>
                                            <span className="text-sm font-semibold text-blue-500">
                                                {stats.j90Alerts}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-3">
                                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-foreground font-medium">
                                        Aucune échéance proche
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tous vos baux sont à jour
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Voir le tableau de conformité →
                        </p>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
