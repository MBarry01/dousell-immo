'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Wrench, Clock, CheckCircle, ChevronDown, ChevronUp, Phone, Calendar, CircleDollarSign, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { getTenantMaintenanceRequests, cancelMaintenanceRequest } from './actions';
import { useTheme } from '@/components/workspace/providers/theme-provider';

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

export default function MaintenanceListPage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const { isDark } = useTheme();

    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
        'open': {
            label: 'En attente',
            color: isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600',
            icon: Clock
        },
        'artisan_found': { label: 'Artisan trouvé', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: Wrench },
        'awaiting_approval': { label: 'Devis en attente', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: CircleDollarSign },
        'approved': { label: 'Approuvé', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: CheckCircle },
        'in_progress': { label: 'En cours', color: 'bg-[#F4C430]/20 text-[#F4C430]', icon: Wrench },
        'completed': { label: 'Terminé', color: 'bg-emerald-500/20 text-emerald-500', icon: CheckCircle },
    };

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
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Mes Signalements</h1>
                <p className="text-sm text-muted-foreground mt-1">Suivez vos demandes d'intervention</p>
            </header>

            <main className="max-w-lg mx-auto space-y-3">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
                            isDark
                                ? 'bg-slate-900 border-slate-800'
                                : 'bg-gray-100 border-gray-200'
                        }`}>
                            <Wrench className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Aucun signalement</h3>
                        <p className="max-w-xs mt-2 text-sm text-muted-foreground">
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
                                className={`rounded-xl overflow-hidden border ${
                                    isDark
                                        ? 'bg-slate-900 border-slate-800'
                                        : 'bg-white border-gray-200 shadow-sm'
                                }`}
                            >
                                {/* Main Row - Clickable */}
                                <button
                                    onClick={() => toggleExpand(req.id)}
                                    className="w-full p-4 text-left"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {req.category || 'Autre'}
                                        </span>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {status.label}
                                        </span>
                                    </div>

                                    <p className="text-foreground font-medium line-clamp-2 mb-3">
                                        {req.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}</span>
                                        <div className="flex items-center gap-1">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className={`px-4 pb-4 pt-0 border-t space-y-3 ${
                                        isDark ? 'border-slate-800/50' : 'border-gray-100'
                                    }`}>
                                        {/* Photos */}
                                        {req.photo_urls && req.photo_urls.length > 0 && (
                                            <div className="flex gap-2 pt-3 overflow-x-auto">
                                                {req.photo_urls.map((url, i) => (
                                                    <img
                                                        key={i}
                                                        src={url}
                                                        alt={`Photo ${i + 1}`}
                                                        className={`w-20 h-20 rounded-lg object-cover flex-shrink-0 border ${
                                                            isDark ? 'border-slate-700' : 'border-gray-200'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Artisan Info */}
                                        {req.artisan_name && (
                                            <div className={`rounded-lg p-3 space-y-2 ${
                                                isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                                            }`}>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Artisan assigné</p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-foreground font-medium">{req.artisan_name}</p>
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
                                                    <div className={`rounded-lg p-3 ${
                                                        isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                                                    }`}>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <CircleDollarSign className="w-3 h-3" /> Devis
                                                        </p>
                                                        <p className="text-foreground font-semibold mt-1">
                                                            {req.quoted_price.toLocaleString('fr-FR')} FCFA
                                                        </p>
                                                    </div>
                                                )}
                                                {req.intervention_date && (
                                                    <div className={`rounded-lg p-3 ${
                                                        isDark ? 'bg-slate-800/50' : 'bg-gray-50'
                                                    }`}>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" /> Intervention
                                                        </p>
                                                        <p className="text-foreground font-semibold mt-1">
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
                                                className="w-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
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
                href="/locataire/maintenance/new"
                className="fixed bottom-20 right-4 w-14 h-14 bg-[#F4C430] text-black rounded-full flex items-center justify-center shadow-lg hover:bg-[#D4A420] transition-colors z-20"
            >
                <Plus className="w-8 h-8" />
            </Link>
        </div>
    );
}
