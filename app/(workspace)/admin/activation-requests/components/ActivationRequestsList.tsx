'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, X, FileText, User, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { approveActivationRequest, rejectActivationRequest } from '../actions';

interface Request {
    id: string;
    user_id: string;
    status: string;
    identity_document_url: string;
    property_proof_url: string;
    admin_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    user: { full_name: string; email: string } | null;
}

export function ActivationRequestsList({ requests }: { requests: Request[] }) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({
        open: false,
        requestId: null
    });
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async (requestId: string) => {
        setIsLoading(requestId);
        try {
            const result = await approveActivationRequest(requestId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Demande approuvée !');
            }
        } catch {
            toast.error('Erreur lors de la validation');
        } finally {
            setIsLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectDialog.requestId) return;
        setIsLoading(rejectDialog.requestId);
        try {
            const result = await rejectActivationRequest(rejectDialog.requestId, rejectReason);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Demande rejetée');
                setRejectDialog({ open: false, requestId: null });
                setRejectReason('');
            }
        } catch {
            toast.error('Erreur lors du rejet');
        } finally {
            setIsLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">En attente</Badge>;
            case 'approved':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approuvée</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejetée</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">Aucune demande</p>
                <p className="text-sm text-zinc-500 mt-1">Les demandes d&apos;activation apparaîtront ici.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className={`bg-zinc-900 border rounded-xl p-5 ${request.status === 'pending' ? 'border-amber-500/30' : 'border-zinc-800'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* User info */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <User className="w-6 h-6 text-zinc-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {request.user?.full_name || 'Utilisateur inconnu'}
                                    </h3>
                                    <p className="text-sm text-zinc-500">{request.user?.email}</p>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        Demandé le {format(new Date(request.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-3">
                                {getStatusBadge(request.status)}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            {request.identity_document_url && (
                                <a
                                    href={request.identity_document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Pièce d&apos;identité
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                            {request.property_proof_url && (
                                <a
                                    href={request.property_proof_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap.2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Justificatif propriété
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        {/* Admin notes */}
                        {request.admin_notes && (
                            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
                                <p className="text-sm text-zinc-400">
                                    <span className="font-medium">Note admin :</span> {request.admin_notes}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        {request.status === 'pending' && (
                            <div className="mt-4 flex gap-3">
                                <Button
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={isLoading === request.id}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isLoading === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Approuver
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectDialog({ open: true, requestId: request.id })}
                                    disabled={isLoading === request.id}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Rejeter
                                </Button>
                            </div>
                        )}

                        {/* Force Sync Action for Approved Requests (Maintenance) */}
                        {request.status === 'approved' && (
                            <div className="mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={isLoading === request.id}
                                    className="text-xs h-7 border-dashed border-zinc-700 text-zinc-500 hover:text-white"
                                    title="Forcer la synchronisation du profil"
                                >
                                    {isLoading === request.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                    ) : (
                                        <ExternalLink className="w-3 h-3 mr-2" />
                                    )}
                                    Resynchroniser
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, requestId: open ? rejectDialog.requestId : null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter la demande</DialogTitle>
                        <DialogDescription>
                            Indiquez la raison du rejet. L&apos;utilisateur sera notifié.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Raison du rejet..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog({ open: false, requestId: null })}>
                            Annuler
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || isLoading !== null}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmer le rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
