'use client';

import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle2, AlertTriangle, Send, Loader2, X, ChevronDown, Phone, Star, MapPin, Calendar, CircleDollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { createMaintenanceRequest, getActiveLeases, submitQuote, approveQuoteByOwner, completeIntervention } from '../actions';

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'open' | 'artisan_found' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed';
    quoted_price?: number;
    intervention_date?: string;
    created_at?: string;
    tenant_name?: string;
    // Colonnes artisan
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    artisan_address?: string;
    owner_approved?: boolean;
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
            case 'open': return "bg-blue-500/10 text-blue-400";
            case 'artisan_found': return "bg-emerald-500/10 text-emerald-400";
            case 'awaiting_approval': return "bg-primary/10 text-primary";
            case 'approved': return "bg-purple-500/10 text-purple-400";
            case 'in_progress': return "bg-yellow-500/10 text-yellow-400";
            case 'completed': return "bg-green-500/10 text-green-400";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return "Recherche...";
            case 'artisan_found': return "Artisan trouvé";
            case 'awaiting_approval': return "Validation requise";
            case 'approved': return "Approuvé";
            case 'in_progress': return "En cours";
            case 'completed': return "Terminé";
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

    const openQuoteModal = (requestId: string) => {
        setQuoteRequestId(requestId);
        setQuotePrice('');
        setQuoteDate('');
        setShowQuoteModal(true);
    };

    const handleSubmitQuote = async () => {
        if (!quoteRequestId || !quotePrice || !quoteDate) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setProcessingId(quoteRequestId);
        const result = await submitQuote(quoteRequestId, {
            quoted_price: parseInt(quotePrice),
            intervention_date: quoteDate
        });
        setProcessingId(null);

        if (result.success) {
            toast.success(result.message || 'Devis enregistré !');
            setShowQuoteModal(false);
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
                        <div key={req.id} className="p-4 rounded-2xl space-y-3 border border-border bg-muted/20">
                            {/* En-tête */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm text-foreground">{req.description}</h4>
                                    <p className="text-xs text-muted-foreground">{req.category}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusStyle(req.status)}`}>
                                    {getStatusLabel(req.status)}
                                </span>
                            </div>

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
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(req.intervention_date).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Actions selon le statut */}
                            <div className="flex gap-2 pt-1 flex-wrap">
                                {/* Artisan trouvé → Saisir devis */}
                                {req.status === 'artisan_found' && (
                                    <Button
                                        onClick={() => openQuoteModal(req.id)}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                                    >
                                        <CircleDollarSign className="w-3 h-3 mr-1" /> Saisir le devis
                                    </Button>
                                )}

                                {/* En attente d'approbation → Approuver */}
                                {req.status === 'awaiting_approval' && (
                                    <Button
                                        onClick={() => handleApproveQuote(req.id)}
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
                                    <Button
                                        onClick={() => handleComplete(req.id)}
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
                                )}

                                {/* Terminé */}
                                {req.status === 'completed' && (
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Intervention clôturée
                                    </span>
                                )}

                                {/* Open (sans artisan) */}
                                {req.status === 'open' && !req.artisan_name && (
                                    <span className="text-xs text-gray-500 italic flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Recherche d&apos;artisan en cours...
                                    </span>
                                )}
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
                {showQuoteModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQuoteModal(false)}>
                        <div className="rounded-xl p-5 w-full max-w-sm space-y-4 border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-foreground">Saisir le devis</h4>
                                <button
                                    onClick={() => setShowQuoteModal(false)}
                                    className="transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs mb-1 block text-muted-foreground">Montant (FCFA)</label>
                                    <input
                                        type="number"
                                        value={quotePrice}
                                        onChange={(e) => setQuotePrice(e.target.value)}
                                        placeholder="Ex: 25000"
                                        className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs mb-1 block text-muted-foreground">Date d&apos;intervention</label>
                                    <input
                                        type="date"
                                        value={quoteDate}
                                        onChange={(e) => setQuoteDate(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-sm border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={() => setShowQuoteModal(false)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-border"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSubmitQuote}
                                    disabled={!quotePrice || !quoteDate || processingId === quoteRequestId}
                                    size="sm"
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                                >
                                    {processingId === quoteRequestId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Valider'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
