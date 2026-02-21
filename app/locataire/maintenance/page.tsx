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
import { PageHeaderSkeleton, ListSkeleton } from '../components/TenantSkeletons';
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
        label: 'Recherche d&apos;artisan',
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
            <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <PageHeaderSkeleton />
                <ListSkeleton count={3} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-8 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">Mes Signalements</h1>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest opacity-70">Suivi en temps réel de vos interventions</p>
            </div>

            {/* List */}
            {requests.length === 0 ? (
                <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 py-20 px-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Wrench className="w-10 h-10 text-[#0F172A]/20" />
                    </div>
                    <h3 className="text-xl font-black text-[#0F172A] tracking-tight">Aucun signalement</h3>
                    <p className="max-w-xs mx-auto mt-2 text-sm font-black text-slate-500 uppercase tracking-widest opacity-60">
                        Tout semble en ordre dans votre logement
                    </p>
                    <Link href="/locataire/maintenance/new">
                        <Button className="mt-8 bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-2xl px-8 h-12 font-black uppercase tracking-wider shadow-lg active-press transition-all">
                            <Plus className="w-5 h-5 mr-2" />
                            Signaler un problème
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => {
                        const status = statusConfig[req.status] || statusConfig['submitted'];
                        const StatusIcon = status.icon;
                        const isExpanded = expandedId === req.id;
                        const canCancel = ['submitted', 'open'].includes(req.status);

                        return (
                            <div
                                key={req.id}
                                className={`group bg-white rounded-[2rem] border transition-all duration-300 shadow-sm ${isExpanded ? 'border-[#0F172A] shadow-xl shadow-slate-900/5' : 'border-slate-200 hover:border-slate-400'
                                    } overflow-hidden`}
                            >
                                {/* Main Row */}
                                <button
                                    onClick={() => toggleExpand(req.id)}
                                    className="w-full p-6 text-left"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            {req.category || 'Autre'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bgColor} ${status.textColor} border border-current opacity-80`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                    </div>

                                    <p className={`font-black tracking-tight mb-4 text-base ${isExpanded ? 'text-[#0F172A]' : 'text-slate-800'} line-clamp-2 transition-colors`}>
                                        {req.description}
                                    </p>

                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{format(new Date(req.created_at), 'd MMM yyyy', { locale: fr })}</span>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-[#0F172A] text-white' : 'group-hover:bg-slate-100'}`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="h-px bg-slate-100 w-full" />

                                        {/* Photos */}
                                        {req.photo_urls && req.photo_urls.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photos jointes</p>
                                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                    {req.photo_urls.map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={url}
                                                            alt={`Photo ${i + 1}`}
                                                            className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border-2 border-slate-100 hover:border-[#0F172A] transition-colors cursor-pointer"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Coordination Flow */}
                                        {req.status === 'approved' && req.intervention_date && !req.tenant_response && (
                                            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-800">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Confirmation requise</p>
                                                </div>
                                                <p className="text-sm font-medium text-amber-800 leading-relaxed">
                                                    Intervention prévue le <strong>{format(new Date(req.intervention_date), 'd MMMM', { locale: fr })}</strong>.
                                                </p>

                                                {showReschedule === req.id ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full rounded-xl border-amber-200 bg-white text-sm p-3 focus:ring-2 focus:ring-amber-500 font-medium"
                                                            value={suggestedDate}
                                                            onChange={(e) => setSuggestedDate(e.target.value)}
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRescheduleSlot(req.id)}
                                                                disabled={processingResponseId === req.id}
                                                                className="flex-1 bg-[#0F172A] text-white font-black uppercase tracking-wider text-[10px] h-10 rounded-xl"
                                                            >
                                                                {processingResponseId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setShowReschedule(null)}
                                                                className="flex-1 text-amber-800 font-black uppercase tracking-wider text-[10px] h-10"
                                                            >
                                                                Annuler
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleConfirmSlot(req.id)}
                                                            disabled={processingResponseId === req.id}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] h-10 rounded-xl shadow-lg shadow-emerald-600/20"
                                                        >
                                                            {processingResponseId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Je confirme</>}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setShowReschedule(req.id)}
                                                            className="flex-1 bg-white border-amber-200 text-amber-800 font-black uppercase tracking-wider text-[10px] h-10 rounded-xl"
                                                        >
                                                            Reporter
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Feedbacks */}
                                        {req.tenant_response === 'confirmed' && (
                                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-100">
                                                <CheckCircle2 className="w-5 h-5" /> Présence validée ({format(new Date(req.intervention_date!), 'd MMM', { locale: fr })})
                                            </div>
                                        )}

                                        {/* Artisan Info */}
                                        {req.artisan_name && (
                                            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-4">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Expert assigné</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0F172A] shadow-sm font-black border border-slate-100 uppercase">
                                                            {req.artisan_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[#0F172A] font-black tracking-tight">{req.artisan_name}</p>
                                                            {req.artisan_rating && (
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <span className="text-amber-500">★</span>
                                                                    <span className="text-xs font-black text-slate-500">{req.artisan_rating.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {req.artisan_phone && (
                                                        <a
                                                            href={`tel:${req.artisan_phone}`}
                                                            className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                                        >
                                                            <Phone className="w-5 h-5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancel Button */}
                                        {canCancel && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancel(req.id)}
                                                disabled={cancellingId === req.id}
                                                className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-[0.2em] pt-4"
                                            >
                                                {cancellingId === req.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4 mr-2" />
                                                )}
                                                Annuler la demande
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
                    className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 w-16 h-16 bg-[#0F172A] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-30 group"
                >
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            )}
        </div>
    );
}
