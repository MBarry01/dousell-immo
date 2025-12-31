import { getTenantDashboardData } from "./actions";
import { PaymentButton } from "./components/PaymentButton";
import { FileText, Wrench, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function TenantPortalPage() {
    const data = await getTenantDashboardData();

    if (!data.hasLease || !data.lease) {
        return (
            <div className="px-4 py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Aucune location trouvée</h1>
                <p className="text-slate-500 mb-6">
                    Nous n'avons trouvé aucune location active associée à votre adresse email.
                </p>
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm">
                    Contactez votre propriétaire pour qu'il vérifie l'adresse email renseignée dans votre bail.
                </div>
            </div>
        );
    }

    const { lease, isUpToDate } = data;
    const property = lease.property;
    const owner = lease.owner;

    return (
        <div className="px-4 space-y-6">
            {/* 1. Carte "Statut Loyer" */}
            <div className={`p-6 rounded-2xl text-white shadow-xl ${isUpToDate ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xs font-medium uppercase tracking-wider opacity-90">
                            Situation au {new Date().toLocaleDateString('fr-FR')}
                        </h2>
                        <div className="mt-2 text-3xl font-bold">
                            {isUpToDate ? 'À jour ✅' : `${lease.monthly_amount?.toLocaleString('fr-FR')} FCFA`}
                        </div>
                        {!isUpToDate && (
                            <p className="text-sm mt-1 opacity-90 font-medium">Loyer de {new Date().toLocaleString('fr-FR', { month: 'long' })} en attente</p>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    {isUpToDate ? (
                        <Link href="/portal/documents">
                            <button className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl transition-colors backdrop-blur-sm flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" />
                                Voir ma dernière quittance
                            </button>
                        </Link>
                    ) : (
                        <PaymentButton leaseId={lease.id} />
                    )}
                </div>
            </div>

            {/* Info Bien */}
            <div className="flex items-center gap-3 px-1">
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-slate-900">Ma Location</h1>
                    <p className="text-sm text-slate-500">{property?.location?.address || lease.property_address}</p>
                </div>
            </div>

            {/* 2. Actions Rapides */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/portal/documents" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-slate-300 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                        <span className="block font-semibold text-slate-900">Mon Bail</span>
                        <span className="text-xs text-slate-500">Et quittances</span>
                    </div>
                </Link>

                <Link href="/portal/maintenance" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-slate-300 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                        <span className="block font-semibold text-slate-900">Signaler</span>
                        <span className="text-xs text-slate-500">Un problème</span>
                    </div>
                </Link>
            </div>

            {/* 3. Contact Proprio */}
            {owner && (
                <Card className="p-4 border-slate-200 shadow-sm bg-slate-50/50">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Votre Propriétaire</h3>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                            {owner.full_name?.[0] || 'P'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{owner.company_name || owner.full_name}</p>
                            {owner.phone && <p className="text-xs text-slate-500">{owner.phone}</p>}
                            {owner.email && <p className="text-xs text-slate-500">{owner.email}</p>}
                        </div>
                    </div>
                </Card>
            )}

            {/* 4. Historique Rapide */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 px-1">Activités Récentes</h3>
                {lease.payments && lease.payments.length > 0 ? (
                    <div className="space-y-2">
                        {lease.payments.slice(0, 3).map((payment: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {payment.status === 'paid' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Loyer {format(new Date(payment.period_start), 'MMMM yyyy', { locale: fr })}</p>
                                        <p className="text-xs text-slate-500">
                                            {payment.status === 'paid'
                                                ? `Payé le ${payment.paid_at ? format(new Date(payment.paid_at), 'dd/MM/yyyy') : 'N/A'}`
                                                : 'En attente de paiement'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{payment.amount_due?.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 px-1">Aucun historique disponible.</p>
                )}
            </div>
        </div>
    );
}
