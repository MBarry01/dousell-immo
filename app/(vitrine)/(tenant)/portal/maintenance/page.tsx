'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Wrench, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Phone, Calendar, CircleDollarSign, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { getTenantMaintenanceRequests, cancelMaintenanceRequest } from './actions';

type MaintenanceRequest = {
    id: string;
    category: string;
    description: string;
    status: string;
    photo_urls?: string[];
    created_at: string;
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    quoted_price?: number;
    intervention_date?: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    'open': { label: 'En attente', color: 'bg-slate-700 text-slate-300', icon: Clock },
    'artisan_found': { label: 'Artisan trouvé', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: Wrench },
    'awaiting_approval': { label: 'Devis en attente', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: CircleDollarSign },
    'approved': { label: 'Approuvé', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: CheckCircle },
    'in_progress': { label: 'En cours', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: Wrench },
    'completed': { label: 'Terminé', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
};

export default function MaintenanceListPage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        const data = await getTenantMaintenanceRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Voulez-vous vraiment annuler ce signalement ?")) return;

        setCancellingId(id);
        const result = await cancelMaintenanceRequest(id);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Signalement annulé");
            setRequests(requests.filter(r => r.id !== id));
        }
        setCancellingId(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/portal" className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-semibold text-white">Mes Signalements</h1>
                </div>
            </header>

            <main className="p-4 max-w-lg mx-auto space-y-3">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Wrench className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white">Aucun signalement</h3>
                        <p className="max-w-xs mt-2 text-sm text-slate-400">
                            Vous n'avez pas encore signalé de problème. Appuyez sur le + pour commencer.
                        </p>
                    </div>
                ) : (
                    requests.map((req) => {
                        const status = statusConfig[req.status] || statusConfig['open'];
                        const StatusIcon = status.icon;
                        const isExpanded = expandedId === req.id;
                        const canCancel = req.status === 'open';

                        return (
                            <div
                                key={req.id}
                                className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800"
                            >
                                {/* Main Row - Clickable */}
                                <button
                                    onClick={() => toggleExpand(req.id)}
                                    className="w-full p-4 text-left"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            {req.category || 'Autre'}
                                        </span>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </span>
                                    </div>

                                    <p className="text-white font-medium line-clamp-2 mb-3">
                                        {req.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>{format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}</span>
                                        <div className="flex items-center gap-1">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-slate-800/50 space-y-3">
                                        {/* Photos */}
                                        {req.photo_urls && req.photo_urls.length > 0 && (
                                            <div className="flex gap-2 pt-3 overflow-x-auto">
                                                {req.photo_urls.map((url, i) => (
                                                    <img
                                                        key={i}
                                                        src={url}
                                                        alt={`Photo ${i + 1}`}
                                                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-slate-700"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Artisan Info */}
                                        {req.artisan_name && (
                                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                                                <p className="text-xs text-slate-400 uppercase tracking-wider">Artisan assigné</p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">{req.artisan_name}</p>
                                                        {req.artisan_rating && (
                                                            <p className="text-xs text-[#F4C430]">⭐ {req.artisan_rating.toFixed(1)}</p>
                                                        )}
                                                    </div>
                                                    {req.artisan_phone && (
                                                        <a
                                                            href={`tel:${req.artisan_phone}`}
                                                            className="w-10 h-10 bg-[#F4C430] rounded-full flex items-center justify-center"
                                                        >
                                                            <Phone className="w-5 h-5 text-black" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quote & Date */}
                                        {(req.quoted_price || req.intervention_date) && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {req.quoted_price && (
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                                            <CircleDollarSign className="w-3 h-3" /> Devis
                                                        </p>
                                                        <p className="text-white font-semibold mt-1">
                                                            {req.quoted_price.toLocaleString('fr-FR')} FCFA
                                                        </p>
                                                    </div>
                                                )}
                                                {req.intervention_date && (
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> Intervention
                                                        </p>
                                                        <p className="text-white font-semibold mt-1">
                                                            {format(new Date(req.intervention_date), 'd MMM', { locale: fr })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Cancel Button */}
                                        {canCancel && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancel(req.id)}
                                                disabled={cancellingId === req.id}
                                                className="w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                {cancellingId === req.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4 mr-2" />
                                                )}
                                                Annuler ce signalement
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </main>

            {/* FAB */}
            <Link
                href="/portal/maintenance/new"
                className="fixed bottom-20 right-4 w-14 h-14 bg-[#F4C430] text-black rounded-full flex items-center justify-center shadow-lg hover:bg-[#D4A420] transition-colors z-20"
            >
                <Plus className="w-8 h-8" />
            </Link>
        </div>
    );
}
