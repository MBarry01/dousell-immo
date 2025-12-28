import { Scale, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaseAlerts } from "../../legal/actions";
import Link from "next/link";

export async function LegalAlertsWidget() {
    const alerts = await getLeaseAlerts();

    // Compter les alertes par type
    const j180Count = alerts.filter(a => a.alert_type === 'J-180').length;
    const j90Count = alerts.filter(a => a.alert_type === 'J-90').length;
    const totalAlerts = alerts.length;

    if (totalAlerts === 0) {
        return (
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-green-500" />
                        Conformité Juridique
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-green-500">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="text-xs">Aucune échéance à venir</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Tous vos baux sont à jour</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Link href="/compte/legal">
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-orange-500" />
                        Conformité Juridique
                        {totalAlerts > 0 && (
                            <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
                                {totalAlerts}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {j180Count > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                                <span className="text-xs text-slate-300">J-180 (Congé Reprise)</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-500">{j180Count}</span>
                        </div>
                    )}

                    {j90Count > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-xs text-slate-300">J-90 (Reconduction)</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-500">{j90Count}</span>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-800">
                        <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                            Cliquer pour voir les détails →
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
