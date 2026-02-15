'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Wrench,
    Clock,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Phone,
    Calendar,
    CircleDollarSign,
    X,
    Loader2,
    Check,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { getTenantMaintenanceRequests, cancelMaintenanceRequest, respondToMaintenanceSlot } from './actions';

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
    tenant_response?: 'confirmed' | 'reschedule_requested';
    tenant_suggested_date?: string;
    rejection_reason?: string;
    quote_url?: string;
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; icon: any }> = {
    'submitted': {
        label: 'En attente de validation',
        bgColor: 'bg-zinc-100',
        textColor: 'text-zinc-600',
        icon: Clock
    },
    'open': {
        label: 'Recherche d artisan',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        icon: Clock
    },
    'artisan_found': {
        label: 'Artisan trouvé',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: Wrench
    },
    'awaiting_approval': {
        label: 'Devis en attente',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        icon: CircleDollarSign
    },
    'approved': {
        label: 'Approuvé',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        icon: CheckCircle2
    },
    'in_progress': {
        label: 'En cours',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: Wrench
    },
    'completed': {
        label: 'Terminé',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        icon: CheckCircle2
    },
    'rejected': {
        label: 'Rejeté',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        icon: AlertTriangle
    },
};

export default function MaintenanceListPage() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [processingResponseId, setProcessingResponseId] = useState<string | null>(null);
    const [suggestedDate, setSuggestedDate] = useState<string>('');
    const [showReschedule, setShowReschedule] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        const data = await getTenantMaintenanceRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleConfirmSlot = async (id: string) => {
        setProcessingResponseId(id);
        const result = await respondToMaintenanceSlot(id, 'confirmed');
        if (result.success) {
            toast.success("Présence confirmée !");
            loadRequests();
        } else {
            toast.error(result.error || "Une erreur est survenue");
        }
        setProcessingResponseId(null);
    };

    const handleRescheduleSlot = async (id: string) => {
        if (!suggestedDate) {
            toast.error("Veuillez choisir une date");
            return;
        }
        setProcessingResponseId(id);
        const result = await respondToMaintenanceSlot(id, 'reschedule_requested', suggestedDate);
        if (result.success) {
            toast.success("Demande de report envoyée");
            loadRequests();
            setShowReschedule(null);
        } else {
            toast.error(result.error || "Une erreur est survenue");
        }
        setProcessingResponseId(null);
        setSuggestedDate('');
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
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-zinc-900">Mes Signalements</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Suivez vos demandes d'intervention</p>
            </div>

            {/* List */}
            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                        <Wrench className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900">Aucun signalement</h3>
                    <p className="max-w-xs mt-2 text-sm text-zinc-500">
                        Vous n'avez pas encore signalé de problème.
                    </p>
                    <Link href="/locataire/maintenance/new">
                        <Button className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouveau signalement
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => {
                        const status = statusConfig[req.status] || statusConfig['submitted'];
                        const StatusIcon = status.icon;
                        const isExpanded = expandedId === req.id;
                        const canCancel = ['submitted', 'open'].includes(req.status);

                        return (
                            <div
                                key={req.id}
                                className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
                            >
                                {/* Main Row */}
                                <button
                                    onClick={() => toggleExpand(req.id)}
                                    className="w-full p-4 text-left"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                            {req.category || 'Autre'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bgColor} ${status.textColor}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                    </div>

                                    <p className="text-zinc-900 font-medium line-clamp-2 mb-3 text-sm">
                                        {req.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-zinc-400">
                                        <span>{format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}</span>
                                        <div className="flex items-center gap-1">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-zinc-100 space-y-3">
                                        {/* Photos */}
                                        {req.photo_urls && req.photo_urls.length > 0 && (
                                            <div className="flex gap-2 pt-3 overflow-x-auto">
                                                {req.photo_urls.map((url, i) => (
                                                    <img
                                                        key={i}
                                                        src={url}
                                                        alt={`Photo ${i + 1}`}
                                                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-zinc-200"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {req.status === 'rejected' && req.rejection_reason && (
                                            <div className="py-2 px-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium flex items-start gap-2 border border-red-100">
                                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                                <div>
                                                    <p className="font-bold uppercase text-[9px]">Motif du rejet :</p>
                                                    <p>{req.rejection_reason}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Coordination Flow (Confirm/Reschedule) */}
                                        {req.status === 'approved' && req.intervention_date && !req.tenant_response && (
                                            <div className="py-3 border-b border-zinc-100">
                                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                                    <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-tight mb-2 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Confirmation requise
                                                    </p>
                                                    <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                                        L&apos;intervention est prévue pour le <strong>{format(new Date(req.intervention_date), 'd MMMM', { locale: fr })}</strong>. Êtes-vous disponible ?
                                                    </p>

                                                    {showReschedule === req.id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="datetime-local"
                                                                className="w-full rounded border-zinc-200 text-xs p-2"
                                                                value={suggestedDate}
                                                                onChange={(e) => setSuggestedDate(e.target.value)}
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleRescheduleSlot(req.id)}
                                                                    disabled={processingResponseId === req.id}
                                                                    className="flex-1 text-xs bg-zinc-900 h-8"
                                                                >
                                                                    {processingResponseId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Envoyer"}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setShowReschedule(null)}
                                                                    className="text-xs h-8"
                                                                >
                                                                    Annuler
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleConfirmSlot(req.id)}
                                                                disabled={processingResponseId === req.id}
                                                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 h-8"
                                                            >
                                                                {processingResponseId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Je confirme</>}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setShowReschedule(req.id)}
                                                                className="flex-1 text-xs h-8"
                                                            >
                                                                Reporter
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback confirmed status */}
                                        {req.tenant_response === 'confirmed' && (
                                            <div className="py-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Présence confirmée pour le {format(new Date(req.intervention_date!), 'd MMMM', { locale: fr })}
                                            </div>
                                        )}

                                        {/* Feedback reschedule_requested status */}
                                        {req.tenant_response === 'reschedule_requested' && (
                                            <div className="py-2 px-3 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-2 border border-amber-100">
                                                <Clock className="w-4 h-4" /> Report demandé pour le {req.tenant_suggested_date ? format(new Date(req.tenant_suggested_date), 'd MMMM à HH:mm', { locale: fr }) : 'à venir'}
                                            </div>
                                        )}

                                        {/* Artisan Info */}
                                        {req.artisan_name && (
                                            <div className="rounded-lg bg-zinc-50 p-3 space-y-2">
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                                    Artisan assigné
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-zinc-900 font-medium">{req.artisan_name}</p>
                                                        {req.artisan_rating && (
                                                            <p className="text-xs text-amber-600">⭐ {req.artisan_rating.toFixed(1)}</p>
                                                        )}
                                                    </div>
                                                    {req.artisan_phone && (
                                                        <a
                                                            href={`tel:${req.artisan_phone}`}
                                                            className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                                        >
                                                            <Phone className="w-5 h-5 text-white" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quote & Date */}
                                        {(req.quoted_price || req.intervention_date) && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {req.quoted_price && (
                                                    <div className="rounded-lg bg-zinc-50 p-3">
                                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-medium">
                                                            <CircleDollarSign className="w-3 h-3" /> Devis
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-zinc-900 font-semibold">
                                                                {req.quoted_price.toLocaleString('fr-FR')} F
                                                            </p>
                                                            {req.quote_url && (
                                                                <a
                                                                    href={req.quote_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    PDF ↗
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {req.intervention_date && (
                                                    <div className="rounded-lg bg-zinc-50 p-3 text-left">
                                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-medium">
                                                            <Calendar className="w-3 h-3" /> Intervention
                                                        </p>
                                                        <p className="text-zinc-900 font-semibold mt-1">
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
                                                className="w-full text-zinc-500 hover:text-red-600 hover:bg-red-50 text-xs"
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
                    })}
                </div>
            )}

            {/* FAB */}
            {requests.length > 0 && (
                <Link
                    href="/locataire/maintenance/new"
                    className="fixed bottom-24 right-4 w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors z-20"
                >
                    <Plus className="w-7 h-7" />
                </Link>
            )}
        </div>
    );
}
