import { getInventoryReports } from './actions';
import Link from 'next/link';
import { Plus, FileText, CheckCircle, Clock, Edit, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeleteInventoryButton } from './components/DeleteInventoryButton';

export const metadata = {
    title: 'États des Lieux - Gestion Locative',
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    'draft': { label: 'Brouillon', color: 'bg-slate-500/20 text-slate-300', icon: Edit },
    'completed': { label: 'Complété', color: 'bg-amber-500/20 text-amber-300', icon: Clock },
    'signed': { label: 'Signé', color: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle },
};

const typeLabels: Record<string, string> = {
    'entry': 'Entrée',
    'exit': 'Sortie',
};

export default async function EtatsLieuxPage() {
    const { data: reports, error } = await getInventoryReports();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/compte/gestion-locative" className="text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-white">États des Lieux</h1>
                        <p className="text-sm text-white/60 mt-1">
                            {reports.length} rapport{reports.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        <Link href="/compte/etats-lieux/formulaire-vierge">
                            <Printer className="w-4 h-4 mr-2" />
                            PDF Vierge
                        </Link>
                    </Button>
                    <Button asChild className="bg-[#F4C430] hover:bg-[#D4A420] text-black">
                        <Link href="/compte/etats-lieux/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouveau
                        </Link>
                    </Button>
                </div>
            </div>

            {/* List */}
            {error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    Erreur: {error}
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Aucun état des lieux</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                        Créez votre premier état des lieux pour documenter l'état du bien à l'entrée ou à la sortie du locataire.
                    </p>
                    <Button asChild className="bg-[#F4C430] hover:bg-[#D4A420] text-black">
                        <Link href="/compte/etats-lieux/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Créer un état des lieux
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {reports.map((report) => {
                        const status = statusConfig[report.status] || statusConfig['draft'];
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={report.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors flex items-start justify-between gap-4 group"
                            >
                                <Link
                                    href={`/compte/etats-lieux/${report.id}`}
                                    className="flex-1 min-w-0 flex items-start justify-between gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${report.type === 'entry'
                                                ? 'bg-blue-500/20 text-blue-300'
                                                : 'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {typeLabels[report.type]}
                                            </span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status.label}
                                            </span>
                                        </div>

                                        <h3 className="text-white font-medium truncate">
                                            {report.lease?.property_address || 'Adresse non renseignée'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {report.lease?.tenant_name || 'Locataire'}
                                        </p>
                                    </div>

                                    <div className="text-right text-xs text-slate-500">
                                        <p>{format(new Date(report.report_date), 'd MMM yyyy', { locale: fr })}</p>
                                        {report.signed_at && (
                                            <p className="text-emerald-400 mt-1">
                                                Signé le {format(new Date(report.signed_at), 'd MMM', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                </Link>

                                <div className="pl-2 border-l border-slate-800 self-stretch flex items-center">
                                    <DeleteInventoryButton id={report.id} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
