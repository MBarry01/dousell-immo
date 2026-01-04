'use client';

import { AlertTriangle, CheckCircle, FileText, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DecisionModal } from "./components/DecisionModal";
import { CreateContractDialog } from "./components/CreateContractDialog";
import { CreateReceiptDialog } from "./components/CreateReceiptDialog";
import { RentalTour } from "@/components/onboarding/RentalTour";
import { useTheme } from "../theme-provider";

interface LegalPageClientProps {
    stats: {
        activeLeases: number;
        upcomingRenewals: number;
        legalRisks: number;
    };
    alerts: any[];
    leases: any[];
    userEmail?: string;
    profile: any;
}

export function LegalPageClient({ stats, alerts, leases, userEmail, profile }: LegalPageClientProps) {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <RentalTour page="legal" />
            <div className="w-full mx-auto px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-500">

                {/* SECTION 1 : EN-TÊTE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Assistant Juridique
                        </h1>
                        <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Conformité Loi 2014 & COCC Sénégal 🇸🇳
                        </p>
                    </div>
                </div>

                {/* SECTION 2 : LES KPI */}
                <div id="tour-legal-kpi" className="grid gap-4 md:grid-cols-3">
                    <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                Baux Actifs
                            </CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.activeLeases}
                            </div>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                Tous enregistrés
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                        {stats.upcomingRenewals > 0 && (
                            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500" />
                        )}
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                Renouvellements (3 mois)
                            </CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.upcomingRenewals}
                            </div>
                            <p className="text-xs text-orange-400">
                                {stats.upcomingRenewals > 0 ? 'Tacite reconduction approche' : 'Aucune échéance proche'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                Risque Juridique
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.legalRisks}
                            </div>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                Aucun contentieux en cours
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 3 : LE RADAR DES ÉCHÉANCES */}
                <div id="tour-legal-alerts" className="space-y-4">
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Radar des Échéances
                    </h2>
                    <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-800 bg-black/50' : 'border-gray-200 bg-white'
                        }`}>
                        {alerts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className={`font-medium border-b ${isDark
                                            ? 'bg-slate-900/50 text-slate-400 border-slate-800'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        <tr>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Locataire & Bien</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Échéance</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Type d'alerte</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Statut</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-right whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                                        {alerts.map((alert) => (
                                            <tr
                                                key={alert.id}
                                                className={`transition-colors group ${isDark ? 'hover:bg-slate-900/50' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className={`font-medium whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {alert.tenant_name}
                                                    </div>
                                                    <div className={`text-xs max-w-[150px] md:max-w-none truncate ${isDark ? 'text-slate-500' : 'text-gray-500'
                                                        }`}>
                                                        {alert.property_address}
                                                    </div>
                                                </td>
                                                <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-gray-700'
                                                    }`}>
                                                    {format(new Date(alert.end_date), 'dd MMM yyyy', { locale: fr })}
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.alert_type === 'J-180'
                                                                ? 'bg-orange-500'
                                                                : 'bg-blue-500'
                                                            }`} />
                                                        <span className={`text-xs md:text-sm whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-gray-700'
                                                            }`}>
                                                            {alert.alert_type === 'J-180' ? 'Congé (6 mois)' : 'Reconduction (3 mois)'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className={`flex items-center gap-2 text-xs md:text-sm whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-gray-600'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.status === 'sent' ? 'bg-green-500' : 'bg-amber-500'
                                                            }`} />
                                                        {alert.status === 'sent' ? 'Envoyé' : 'En attente'}
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                                    <DecisionModal alert={alert} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Aucune échéance dans les 6 prochains mois
                                </p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    Tous vos baux sont à jour
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 4 : GÉNÉRATEUR RAPIDE */}
                <div id="tour-legal-tools" className="grid gap-6 md:grid-cols-2">
                    <CreateReceiptDialog leases={leases} userEmail={userEmail} profile={profile} />
                    <CreateContractDialog leases={leases} />
                </div>

                {/* Référence juridique */}
                <div id="tour-legal-reference" className={`p-6 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                    }`}>
                    <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        <BookOpen className="w-5 h-5 text-green-500" />
                        Cadre Juridique de Référence
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Textes applicables :
                            </h3>
                            <ul className={`space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                <li>• COCC (Code des Obligations Civiles et Commerciales)</li>
                                <li>• Décret de 2014 sur la baisse des loyers</li>
                                <li>• Loi de régulation 2024</li>
                                <li>• Droit OHADA (usage commercial)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Délais clés :
                            </h3>
                            <ul className={`space-y-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                                <li>• <span className="text-red-500 font-semibold">6 mois</span> : Préavis propriétaire (congé pour reprise)</li>
                                <li>• <span className="text-yellow-500 font-semibold">3 mois</span> : Négociation avant tacite reconduction</li>
                                <li>• <span className="text-blue-500 font-semibold">2 mois</span> : Préavis locataire (résidentiel)</li>
                                <li>• <span className="text-purple-500 font-semibold">1 mois</span> : Préavis locataire (meublé)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
