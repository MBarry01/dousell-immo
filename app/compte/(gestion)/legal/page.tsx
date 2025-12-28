import { AlertTriangle, CheckCircle, FileText, Gavel, ShieldCheck, Clock, Scale, BookOpen, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getLegalStats, getLeaseAlerts } from "./actions";
import { DecisionModal } from "./components/DecisionModal";

export const dynamic = 'force-dynamic';

export default async function LegalAssistantPage() {
    const stats = await getLegalStats();
    const alerts = await getLeaseAlerts();

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-500">

                {/* SECTION 1 : EN-TÊTE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Assistant Juridique
                        </h1>
                        <p className="text-slate-400 mt-1">Conformité Loi 2014 & COCC Sénégal 🇸🇳</p>
                    </div>
                </div>

                {/* SECTION 2 : LES KPI (Indicateurs Clés) */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Baux Actifs</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.activeLeases}</div>
                            <p className="text-xs text-slate-500">Tous enregistrés</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 relative overflow-hidden">
                        {/* Indicateur visuel pour attirer l'oeil */}
                        {stats.upcomingRenewals > 0 && (
                            <div className="absolute top-0 right-0 w-1 h-full bg-orange-500" />
                        )}
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Renouvellements (3 mois)</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.upcomingRenewals}</div>
                            <p className="text-xs text-orange-400">
                                {stats.upcomingRenewals > 0 ? 'Tacite reconduction approche' : 'Aucune échéance proche'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Risque Juridique</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.legalRisks}</div>
                            <p className="text-xs text-slate-500">Aucun contentieux en cours</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 3 : LE RADAR DES ÉCHÉANCES */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Radar des Échéances</h2>
                    <div className="rounded-lg border border-slate-800 bg-black/50 overflow-hidden">
                        {alerts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-800">
                                        <tr>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Locataire & Bien</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Échéance</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Type d'alerte</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">Statut</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-right whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {alerts.map((alert) => (
                                            <tr key={alert.id} className="hover:bg-slate-900/50 transition-colors group">
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="text-white font-medium whitespace-nowrap">{alert.tenant_name}</div>
                                                    <div className="text-slate-500 text-xs max-w-[150px] md:max-w-none truncate">{alert.property_address}</div>
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4 text-slate-300 whitespace-nowrap">
                                                    {format(new Date(alert.end_date), 'dd MMM yyyy', { locale: fr })}
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.alert_type === 'J-180'
                                                            ? 'bg-orange-500'
                                                            : 'bg-blue-500'
                                                            }`} />
                                                        <span className="text-slate-300 text-xs md:text-sm whitespace-nowrap">
                                                            {alert.alert_type === 'J-180' ? 'Congé (6 mois)' : 'Reconduction (3 mois)'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm whitespace-nowrap">
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
                                <p className="text-slate-300 font-medium">Aucune échéance dans les 6 prochains mois</p>
                                <p className="text-slate-500 text-sm mt-1">Tous vos baux sont à jour</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 4 : GÉNÉRATEUR RAPIDE */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Carte Quittance */}
                    <div className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700 transition-all cursor-pointer group">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Générer une Quittance</h3>
                        <p className="text-sm text-slate-400 mt-2">Créer manuellement une quittance pour un paiement hors plateforme.</p>
                    </div>

                    {/* Carte Nouveau Bail */}
                    <div className="p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700 transition-all cursor-pointer group">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Nouveau Contrat de Bail</h3>
                        <p className="text-sm text-slate-400 mt-2">Modèle conforme OHADA / Sénégal pré-rempli.</p>
                    </div>
                </div>

                {/* Référence juridique */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        Cadre Juridique de Référence
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-2">Textes applicables :</h3>
                            <ul className="space-y-1 text-sm text-slate-400">
                                <li>• COCC (Code des Obligations Civiles et Commerciales)</li>
                                <li>• Décret de 2014 sur la baisse des loyers</li>
                                <li>• Loi de régulation 2024</li>
                                <li>• Droit OHADA (usage commercial)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-2">Délais clés :</h3>
                            <ul className="space-y-1 text-sm text-slate-400">
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
