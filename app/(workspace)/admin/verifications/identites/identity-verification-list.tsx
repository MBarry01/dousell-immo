"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    CheckCircle,
    XCircle,
    Eye,
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveIdentity, rejectIdentity } from "./actions";

type IdentityDocument = {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
    uploaded_at: string;
    user_id: string;
    is_certified: boolean;
    profiles: {
        id: string;
        full_name: string;
        phone?: string;
        email?: string;
        is_identity_verified: boolean;
        created_at: string;
    };
};

type Props = {
    initialDocuments: IdentityDocument[];
    onDocumentUpdate?: (updatedDocs: IdentityDocument[]) => void;
};

export function IdentityVerificationList({ initialDocuments, onDocumentUpdate }: Props) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [selectedDoc, setSelectedDoc] = useState<IdentityDocument | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleApprove = async (doc: IdentityDocument) => {
        if (!confirm(`Êtes-vous sûr de vouloir vérifier l'identité de ${doc.profiles.full_name} ?`)) {
            return;
        }

        setProcessing(true);
        try {
            const result = await approveIdentity(doc.user_id, doc.id);

            if (result.success) {
                toast.success("Identité vérifiée avec succès");
                // Remove from list
                const updatedDocs = documents.filter(d => d.id !== doc.id);
                setDocuments(updatedDocs);
                onDocumentUpdate?.(updatedDocs);
            } else {
                toast.error(result.error || "Erreur lors de la vérification");
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDoc || !rejectReason.trim()) {
            toast.error("Veuillez indiquer une raison");
            return;
        }

        setProcessing(true);
        try {
            const result = await rejectIdentity(selectedDoc.user_id, selectedDoc.id, rejectReason);

            if (result.success) {
                toast.success("Document rejeté");
                // Remove from list
                const updatedDocs = documents.filter(d => d.id !== selectedDoc.id);
                setDocuments(updatedDocs);
                onDocumentUpdate?.(updatedDocs);
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedDoc(null);
            } else {
                toast.error(result.error || "Erreur lors du rejet");
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const openRejectDialog = (doc: IdentityDocument) => {
        setSelectedDoc(doc);
        setRejectDialogOpen(true);
    };

    if (documents.length === 0) {
        return (
            <Card className="border-border bg-card p-12 text-center">
                <BadgeCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aucun document en attente
                </h3>
                <p className="text-muted-foreground">
                    Tous les documents d&apos;identité ont été traités
                </p>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <Card key={doc.id} className="border-border bg-card p-6">
                        {/* User Info */}
                        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">
                                    {doc.profiles.full_name}
                                </h3>
                                {doc.profiles.is_identity_verified && (
                                    <Badge className="mt-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                        Déjà vérifié
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                            {doc.profiles.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{doc.profiles.email}</span>
                                </div>
                            )}
                            {doc.profiles.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{doc.profiles.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Membre depuis {format(new Date(doc.profiles.created_at), "MMMM yyyy", { locale: fr })}
                                </span>
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="mb-4 p-3 rounded-lg bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-white">{doc.file_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Type: {doc.file_type} • Uploadé le{" "}
                                {format(new Date(doc.uploaded_at), "dd MMM yyyy", { locale: fr })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-border text-foreground hover:bg-muted"
                                onClick={() => window.open(doc.file_url, "_blank")}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                onClick={() => handleApprove(doc)}
                                disabled={processing}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                onClick={() => openRejectDialog(doc)}
                                disabled={processing}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="bg-[#0b0f18] border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Rejeter le document</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Veuillez indiquer la raison du rejet pour {selectedDoc?.profiles.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Raison du rejet..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="bg-card border-border text-white"
                        rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleReject}
                            disabled={processing || !rejectReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Rejeter
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

