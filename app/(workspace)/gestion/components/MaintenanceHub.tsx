'use client';

import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle2, X, Plus, ChevronDown, ChevronUp, CircleDollarSign, Calendar, Loader2, Send, Star, Phone, MapPin, AlertTriangle, Image as ImageIcon, User, Home, FileText, Upload } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { createMaintenanceRequest, getActiveLeases, submitQuote, approveQuoteByOwner, completeIntervention, validateMaintenanceRequest, rejectMaintenanceRequest, handleOwnerRescheduleResponse } from '../actions';

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'submitted' | 'open' | 'artisan_found' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
    quoted_price?: number;
    intervention_date?: string;
    created_at?: string;
    tenant_name?: string;
    // Colonnes artisan
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    artisan_address?: string;
    tenant_response?: 'confirmed' | 'reschedule_requested';
    tenant_suggested_date?: string;
    rejection_reason?: string;
    owner_approved?: boolean;
    photo_urls?: string[];
    quote_url?: string;
    property_title?: string;
    property_images?: string[];
    tenant_email?: string;
    is_new?: boolean;
}

interface Lease {
    id: string;
    tenant_name: string;
    property_address?: string;
}

interface MaintenanceHubProps {
    requests?: MaintenanceRequest[];
}

const CATEGORIES = [
    { value: 'Plomberie', emoji: '🔧' },
    { value: 'Électricité', emoji: '⚡' },
    { value: 'Maçonnerie', emoji: '🧱' },
    { value: 'Climatisation', emoji: '❄️' },
    { value: 'Serrurerie', emoji: '🔑' },
    { value: 'Peinture', emoji: '🎨' },
    { value: 'Autre', emoji: '📋' }
];

export function MaintenanceHub({ requests = [] }: MaintenanceHubProps) {
    const [showForm, setShowForm] = useState(false);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Plomberie');
    const [selectedLease, setSelectedLease] = useState('');
    const [leases, setLeases] = useState<Lease[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal saisie devis
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteRequestId, setQuoteRequestId] = useState<string | null>(null);
    const [quotePrice, setQuotePrice] = useState('');
    const [quoteDate, setQuoteDate] = useState('');
    const [quoteFile, setQuoteFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (showForm) {
            getActiveLeases().then(result => {
                if (result.success && result.data) {
                    setLeases(result.data);
                    if (result.data.length > 0) {
                        setSelectedLease(result.data[0].id);
                    }
                }
            });
        }
    }, [showForm]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'submitted': return "bg-zinc-500/10 text-zinc-400";
            case 'open': return "bg-blue-500/10 text-blue-400";
            case 'artisan_found': return "bg-emerald-500/10 text-emerald-400";
            case 'awaiting_approval': return "bg-primary/10 text-primary";
            case 'approved': return "bg-purple-500/10 text-purple-400";
            case 'in_progress': return "bg-yellow-500/10 text-yellow-400";
            case 'completed': return "bg-green-500/10 text-green-400";
            case 'rejected': return "bg-red-500/10 text-red-400";
            case 'cancelled': return "bg-zinc-500/10 text-zinc-500";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'submitted': return "À valider";
            case 'open': return "Recherche...";
            case 'artisan_found': return "Artisan trouvé";
            case 'awaiting_approval': return "Validation requise";
            case 'approved': return "Approuvé";
            case 'in_progress': return "En cours";
            case 'completed': return "Terminé";
            case 'rejected': return "Rejeté";
            case 'cancelled': return "Annulé";
            default: return status;
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error('Veuillez décrire le problème');
            return;
        }

        setSubmitting(true);
        const result = await createMaintenanceRequest({
            leaseId: selectedLease || undefined,
            description: description.trim(),
            category: category
        });
        setSubmitting(false);

        if (result.success) {
            toast.success(result.message || 'Intervention signalée!');
            setDescription('');
            setCategory('Plomberie');
            setShowForm(false);
        } else {
            toast.error(result.error || 'Erreur lors du signalement');
        }
    };

    const openQuoteModal = (requestId: string, currentPrice?: number, currentDate?: string) => {
        setQuoteRequestId(requestId);
        setQuotePrice(currentPrice ? currentPrice.toString() : '');
        // Convert ISO date to YYYY-MM-DDTHH:mm for datetime-local
        if (currentDate) {
            const date = new Date(currentDate);
            const formatted = date.toISOString().slice(0, 16);
            setQuoteDate(formatted);
        } else {
            setQuoteDate('');
        }
        setQuoteFile(null);
        setShowQuoteModal(true);
    };

    const handleSubmitQuote = async () => {
        if (!quoteRequestId || !quotePrice || !quoteDate) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setProcessingId(quoteRequestId);
        let finalQuoteUrl = '';

        if (quoteFile) {
            setIsUploading(true);
            try {
                const supabase = createClient();
                const fileExt = quoteFile.name.split('.').pop();
                const fileName = `maintenance/quote_${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(fileName, quoteFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('properties')
                    .getPublicUrl(fileName);

                finalQuoteUrl = publicUrl;
            } catch (error: any) {
                toast.error("Erreur upload: " + error.message);
                setProcessingId(null);
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }

        const result = await submitQuote(quoteRequestId, {
            quoted_price: parseInt(quotePrice),
            intervention_date: quoteDate,
            quote_url: finalQuoteUrl || undefined
        });
        setProcessingId(null);

        if (result.success) {
            toast.success(result.message || 'Devis enregistré !');
            setShowQuoteModal(false);
            setQuoteFile(null);
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const handleApproveQuote = async (requestId: string) => {
        setProcessingId(requestId);
        const result = await approveQuoteByOwner(requestId);
        setProcessingId(null);
        if (result.success) {
            toast.success(result.message || 'Devis approuvé !');
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const handleAcceptReschedule = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            const result = await handleOwnerRescheduleResponse(requestId, 'accept');
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error || "Erreur lors de l'acceptation du report");
            }
        } catch (error) {
            toast.error("Erreur de connexion");
        } finally {
            setProcessingId(null);
        }
    };

    const handleValidateRequest = async (requestId: string) => {
        setProcessingId(requestId);
        const result = await validateMaintenanceRequest(requestId);
        setProcessingId(null);
        if (result.success) {
            toast.success(result.message || 'Intervention validée !');
        } else {
            toast.error(result.error || 'Erreur lors de la validation');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const reason = window.prompt("Motif du rejet (ex: déjà réparé, demande invalide...) :");
        if (reason === null) return; // Annulé par l'utilisateur

        setProcessingId(requestId);
        const result = await rejectMaintenanceRequest(requestId, reason);
        setProcessingId(null);
        if (result.success) {
            toast.success(result.message || 'Intervention rejetée');
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    const handleComplete = async (requestId: string) => {
        setProcessingId(requestId);
        const result = await completeIntervention(requestId);
        setProcessingId(null);
        if (result.success) {
            toast.success(result.message || 'Intervention terminée !');
        } else {
            toast.error(result.error || 'Erreur');
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl p-5 border border-border bg-card">
            <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl border border-border bg-muted">
                            <Wrench className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-foreground">Interventions</h3>
                            <p className="text-xs text-muted-foreground">Maintenance & travaux</p>
                        </div>
                    </div>
                    <div id="tour-intervention-signaler">
                        <Button
                            size="sm"
                            variant={showForm ? "ghost" : "outline"}
                            className="text-xs h-8"
                            onClick={() => setShowForm(!showForm)}
                        >
                            {showForm ? <><X className="w-3 h-3 mr-1" /> Annuler</> : '+ Signaler'}
                        </Button>
                    </div>
                </div>

                {/* Formulaire */}
                {showForm && (
                    <div className="p-4 rounded-xl space-y-3 border border-border bg-muted/30">
                        <p className="text-xs font-medium text-primary">Nouvelle intervention</p>

                        {leases.length > 0 && (
                            <div className="relative">
                                <select
                                    value={selectedLease}
                                    onChange={(e) => setSelectedLease(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 pr-8 text-sm appearance-none cursor-pointer border border-border bg-background text-foreground"
                                >
                                    {leases.map(lease => (
                                        <option key={lease.id} value={lease.id}>
                                            {lease.tenant_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                            </div>
                        )}

                        <textarea
                            placeholder="Décrivez le problème..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm resize-none h-16 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        />

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 pr-8 text-sm appearance-none cursor-pointer border border-border bg-background text-foreground"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.emoji} {cat.value}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={!description.trim() || submitting}
                                size="sm"
                                className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Send className="w-3 h-3 mr-1" /> Envoyer</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Liste des demandes */}
                <div className="space-y-3">
                    {requests.length > 0 ? requests.map((req) => (
                        <div key={req.id} className={`rounded-2xl border overflow-hidden transition-all duration-200 ${req.is_new ? 'border-blue-500/40 bg-blue-500/5' : 'border-border bg-muted/20'}`}>
                            {req.is_new && (
                                <div className="px-4 py-1.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-xs font-medium text-blue-400">Nouveau</span>
                                </div>
                            )}
                            {/* En-tête cliquable */}
                            <div
                                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-foreground">{req.description}</h4>
                                            {req.photo_urls && req.photo_urls.length > 0 && (
                                                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-1.5 py-0.5 rounded uppercase">
                                                {req.category}
                                            </p>
                                            {req.property_title && (
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Home className="w-3 h-3" /> {req.property_title}
                                                </p>
                                            )}
                                            {req.tenant_name && (
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {req.tenant_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusStyle(req.status)} whitespace-nowrap`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                        {expandedId === req.id ? (
                                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contenu détaillé (Expandable) */}
                            <div className={`px-4 pb-4 space-y-3 ${expandedId === req.id ? 'block' : 'hidden'}`}>
                                <div className="h-px bg-border/50 mb-3" />

                                {/* Photos */}
                                {req.photo_urls && req.photo_urls.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Photos du signalement
                                        </p>
                                        <div className="flex gap-2 p-1 overflow-x-auto pb-2 scrollbar-hide">
                                            {req.photo_urls.map((url, i) => (
                                                <img
                                                    key={i}
                                                    src={url}
                                                    alt={`Photo ${i + 1}`}
                                                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-border hover:opacity-90 cursor-zoom-in transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(url, '_blank');
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Détails Contact Locataire (si besoin) */}
                                {req.tenant_email && (
                                    <div className="p-3 rounded-lg border border-border bg-background/50 text-[11px] space-y-1">
                                        <p className="font-bold text-muted-foreground flex items-center gap-1 uppercase text-[9px]">Contact Locataire</p>
                                        <div className="flex flex-wrap gap-x-4">
                                            <p className="flex items-center gap-1">
                                                <User className="w-3 h-3 text-muted-foreground" /> {req.tenant_name}
                                            </p>
                                            <p className="text-muted-foreground italic">{req.tenant_email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Bloc Artisan (si trouvé) */}
                                {req.artisan_name && (
                                    <div className="p-3 rounded-lg border border-border bg-background">
                                        <p className="text-[10px] uppercase font-bold mb-2 text-muted-foreground">Artisan suggéré</p>
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{req.artisan_name}</p>
                                                {req.artisan_rating && (
                                                    <span className="text-yellow-500 text-xs flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-current" /> {req.artisan_rating}/5
                                                    </span>
                                                )}
                                            </div>
                                            {req.artisan_phone && (
                                                <a
                                                    href={`tel:${req.artisan_phone}`}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Phone className="w-3 h-3" /> Appeler
                                                </a>
                                            )}
                                        </div>
                                        {req.artisan_address && (
                                            <p className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                                                <MapPin className="w-3 h-3" /> {req.artisan_address}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Infos devis (si saisi) */}
                                {req.quoted_price && (
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <CircleDollarSign className="w-3 h-3" /> {req.quoted_price.toLocaleString('fr-FR')} FCFA
                                        </span>
                                        {req.intervention_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-secondary font-semibold">
                                                    {format(new Date(req.intervention_date), 'd MMMM à HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {req.status === 'rejected' && req.rejection_reason && (
                                    <div className="mt-2 px-3 py-2 rounded-lg bg-red-50/50 border border-red-100 flex items-start gap-2 text-xs font-medium text-red-600">
                                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                                        <div>
                                            <p className="font-bold uppercase text-[9px]">Motif du rejet :</p>
                                            <p>{req.rejection_reason}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Tenant Response Feedback */}
                                {req.tenant_response && (
                                    <div className="mt-2 space-y-2">
                                        <div className="px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium">
                                            {req.tenant_response === 'confirmed' ? (
                                                <div className="text-emerald-500 bg-emerald-50/50 border-emerald-100 flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Locataire disponible
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="text-amber-500 bg-amber-50/50 border-amber-100 flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" /> Report demandé : {req.tenant_suggested_date ? format(new Date(req.tenant_suggested_date), 'd MMMM à HH:mm', { locale: fr }) : 'à préciser'}
                                                    </div>

                                                    {req.tenant_response === 'reschedule_requested' && req.tenant_suggested_date && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={(e) => { e.stopPropagation(); handleAcceptReschedule(req.id); }}
                                                                disabled={processingId === req.id}
                                                                size="sm"
                                                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accepter ce créneau"}
                                                            </Button>
                                                            <Button
                                                                onClick={(e) => { e.stopPropagation(); openQuoteModal(req.id, req.quoted_price, req.intervention_date); }}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-[10px]"
                                                            >
                                                                Modifier la date
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions selon le statut */}
                                <div className="flex gap-2 pt-1 flex-wrap">
                                    {/* Nouvelle demande -> Valider ou Rejeter */}
                                    {req.status === 'submitted' && (
                                        <>
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); handleValidateRequest(req.id); }}
                                                disabled={processingId === req.id}
                                                size="sm"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md text-xs h-8"
                                            >
                                                {processingId === req.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <>Valider l&apos;intervention</>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); handleRejectRequest(req.id); }}
                                                disabled={processingId === req.id}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs h-8 border-red-500/50 text-red-500 hover:bg-red-500/10"
                                            >
                                                Rejeter
                                            </Button>
                                        </>
                                    )}

                                    {/* Artisan trouvé → Saisir devis */}
                                    {req.status === 'artisan_found' && (
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); openQuoteModal(req.id, req.quoted_price, req.intervention_date); }}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                                        >
                                            <CircleDollarSign className="w-3 h-3 mr-1" /> Saisir le devis
                                        </Button>
                                    )}

                                    {/* Lien devis (si disponible dans d'autres statuts) */}
                                    {req.quote_url && req.status !== 'approved' && req.status !== 'completed' && (
                                        <a
                                            href={req.quote_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                                        >
                                            <FileText className="w-3 h-3" /> Devis PDF
                                        </a>
                                    )}

                                    {/* Clôturé avec facture */}
                                    {req.status === 'completed' && req.quote_url && (
                                        <a
                                            href={req.quote_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                                        >
                                            <FileText className="w-3 h-3" /> Facture PDF
                                        </a>
                                    )}

                                    {/* En attente d'approbation → Approuver */}
                                    {req.status === 'awaiting_approval' && (
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); handleApproveQuote(req.id); }}
                                            disabled={processingId === req.id}
                                            size="sm"
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md text-xs h-8"
                                        >
                                            {processingId === req.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <>Approuver {req.quoted_price?.toLocaleString('fr-FR')} FCFA</>
                                            )}
                                        </Button>
                                    )}

                                    {/* Approuvé → Terminer */}
                                    {req.status === 'approved' && (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); handleComplete(req.id); }}
                                                disabled={processingId === req.id}
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-xs h-8"
                                            >
                                                {processingId === req.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Terminer &amp; Payer</>
                                                )}
                                            </Button>
                                            {req.quote_url && (
                                                <a
                                                    href={req.quote_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                                                >
                                                    <FileText className="w-3 h-3" /> Voir le devis
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Terminé */}
                                    {req.status === 'completed' && (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Intervention clôturée
                                            </span>
                                            {req.quote_url && (
                                                <a
                                                    href={req.quote_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-white transition-colors border border-slate-800 rounded px-1.5 py-0.5"
                                                >
                                                    <FileText className="w-3 h-3" /> Facture PDF
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Open (sans artisan) */}
                                    {req.status === 'open' && !req.artisan_name && (
                                        <span className="text-xs text-gray-500 italic flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Recherche d&apos;artisan en cours...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <EmptyState
                            title="Aucun signalement à traiter"
                            description="Vos locataires n'ont signalé aucun incident pour le moment. Vous pouvez créer une intervention manuellement si nécessaire."
                            icon={Wrench}
                            actionLabel="Créer une intervention"
                            onAction={() => setShowForm(true)}
                        />
                    )}
                </div>

                {/* Modal Saisie Devis */}
                {/* Modal Saisie Devis */}
                <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Saisir le devis</DialogTitle>
                            <DialogDescription>
                                Renseignez les détails du devis pour validation.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                    Montant (FCFA)
                                </label>
                                <input
                                    type="number"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                    placeholder="Ex: 25000"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                    Date et heure d&apos;intervention
                                </label>
                                <input
                                    type="datetime-local"
                                    value={quoteDate}
                                    onChange={(e) => setQuoteDate(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                    Document (Devis/Facture PDF)
                                </label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="application/pdf,image/*"
                                        onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors ${quoteFile ? 'border-primary/50 bg-primary/5' : 'border-border group-hover:border-primary/20'}`}>
                                        {quoteFile ? (
                                            <>
                                                <FileText className="w-6 h-6 text-primary/70" />
                                                <span className="text-[10px] font-medium text-foreground truncate max-w-full italic px-2">
                                                    {quoteFile.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setQuoteFile(null); }}
                                                    className="text-[9px] text-muted-foreground hover:text-foreground underline z-20"
                                                >
                                                    Supprimer
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary/50 transition-colors" />
                                                <span className="text-[10px] text-muted-foreground text-center">
                                                    Laissez vide pour générer un devis auto
                                                </span>
                                                <span className="text-[8px] text-gray-400 italic">
                                                    ou glissez un PDF externe ici
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                onClick={() => setShowQuoteModal(false)}
                                variant="outline"
                                type="button"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleSubmitQuote}
                                disabled={!quotePrice || !quoteDate || processingId !== null || isUploading}
                                className="bg-foreground text-background hover:bg-foreground/90 font-bold"
                            >
                                {processingId !== null || isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isUploading ? "Upload..." : "Enregistrement..."}
                                    </>
                                ) : (
                                    'Valider le devis'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
