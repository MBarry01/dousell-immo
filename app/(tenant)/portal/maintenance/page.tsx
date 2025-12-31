import { getTenantMaintenanceRequests } from './actions';
import Link from 'next/link';
import { ArrowLeft, Plus, Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const metadata = {
    title: 'Mes Signalements - Portail Locataire',
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    'open': { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
    'quote_received': { label: 'Devis reçu', color: 'bg-blue-100 text-blue-700', icon: Wrench },
    'approved': { label: 'Approuvé', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
    'in_progress': { label: 'En cours', color: 'bg-indigo-100 text-indigo-700', icon: Wrench },
    'completed': { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default async function MaintenanceListPage() {
    const requests = await getTenantMaintenanceRequests();

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/portal" className="p-2 -ml-2 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-semibold text-slate-900">Mes Signalements</h1>
                </div>
            </header>

            <main className="p-4 max-w-md mx-auto space-y-4">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Wrench className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Aucun signalement</h3>
                        <p className="max-w-xs mt-2 text-sm">
                            Vous n'avez pas encore signalé de problème. Appuyez sur le + pour commencer.
                        </p>
                    </div>
                ) : (
                    requests.map((req) => {
                        const status = statusConfig[req.status] || statusConfig['open'];
                        const StatusIcon = status.icon;

                        return (
                            <div key={req.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        {req.category || 'Autre'}
                                    </span>
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </span>
                                </div>

                                <p className="text-slate-900 font-medium line-clamp-2 mb-3">
                                    {req.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}</span>
                                    {req.photo_urls && req.photo_urls.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            {req.photo_urls.length} photo(s)
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>

            {/* FAB (Floating Action Button) */}
            <Link
                href="/portal/maintenance/new"
                className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-20"
            >
                <Plus className="w-8 h-8" />
            </Link>
        </div>
    );
}
