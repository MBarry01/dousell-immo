'use client';

import { Wrench, Clock, CheckCircle2, AlertTriangle, Send, Loader2, X, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { createMaintenanceRequest, getActiveLeases, approveMaintenanceQuote } from '../actions';
import { toast } from 'sonner';

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'open' | 'quote_received' | 'approved' | 'completed';
    quote_amount?: number;
    created_at?: string;
    tenant_name?: string;
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
    const [approvingId, setApprovingId] = useState<string | null>(null);

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
            case 'open': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case 'quote_received': return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case 'approved': return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case 'completed': return "bg-green-500/10 text-green-400 border-green-500/20";
            default: return "bg-gray-500/10 text-gray-400";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return "En attente";
            case 'quote_received': return "Devis reçu";
            case 'approved': return "Approuvé";
            case 'completed': return "Terminé";
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
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
            toast.success('Intervention signalée!');
            setDescription('');
            setCategory('Plomberie');
            setShowForm(false);
        } else {
            toast.error(result.error || 'Erreur lors du signalement');
        }
    };

    const handleApproveQuote = async (requestId: string) => {
        setApprovingId(requestId);
        const result = await approveMaintenanceQuote(requestId);
        setApprovingId(null);
        if (result.success) {
            toast.success('Devis approuvé!');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" /> Interventions
                </h3>
                <Button
                    size="sm"
                    variant={showForm ? "ghost" : "outline"}
                    className={`text-xs h-8 ${showForm ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'border-gray-700 hover:bg-gray-800'}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <><X className="w-3 h-3 mr-1" /> Annuler</> : 'Signaler'}
                </Button>
            </div>

            {/* Formulaire */}
            {showForm && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-3">
                    <p className="text-xs font-medium text-orange-400">Nouvelle intervention</p>

                    {/* Bail concerné */}
                    {leases.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedLease}
                                onChange={(e) => setSelectedLease(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-white appearance-none cursor-pointer"
                            >
                                {leases.map(lease => (
                                    <option key={lease.id} value={lease.id}>
                                        {lease.tenant_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    {/* Description */}
                    <textarea
                        placeholder="Décrivez le problème..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none h-16 focus:border-orange-500/50 focus:outline-none"
                    />

                    {/* Catégorie + Envoyer */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-white appearance-none cursor-pointer"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.emoji} {cat.value}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={!description.trim() || submitting}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 h-9 px-4"
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
            <div className="space-y-2">
                {requests.length > 0 ? requests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-2xl">
                        <div>
                            <p className="text-sm font-bold">{req.description}</p>
                            <span className="text-[10px] text-gray-500 uppercase">{req.status}</span>
                        </div>

                        {/* Le bouton n'apparaît que si un devis a été reçu */}
                        {req.status === 'quote_received' ? (
                            <Button
                                onClick={() => handleApproveQuote(req.id)}
                                disabled={approvingId === req.id}
                                className="bg-orange-600 hover:bg-orange-700 text-[10px] h-7 px-3 font-bold"
                            >
                                {approvingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : `Approuver ${req.quote_amount} FCFA`}
                            </Button>
                        ) : (
                            <span className="text-[10px] italic text-gray-600 text-right">
                                {req.status === 'approved' ? 'Devis approuvé' : 'En attente de devis...'}
                            </span>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">Aucune panne signalée</p>
                    </div>
                )}
            </div>
        </div>
    );
}
