"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2, Eye, RotateCcw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { IdentityVerificationList } from "./identity-verification-list";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { revokeIdentityVerification } from "./actions";

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
        is_identity_verified: boolean;
        created_at: string;
    };
};

type Props = {
    initialDocuments: IdentityDocument[];
};

export function IdentityVerificationTabs({ initialDocuments }: Props) {
    const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
    const [documents, setDocuments] = useState(initialDocuments);

    // Synchroniser avec les mises à jour de initialDocuments (après router.refresh)
    useEffect(() => {
        setDocuments(initialDocuments);
    }, [initialDocuments]);

    // Séparer les documents en attente et vérifiés
    // Documents en attente: is_certified === false, null, ou undefined
    const pendingDocuments = documents.filter(doc =>
        doc.is_certified === false || doc.is_certified === null || doc.is_certified === undefined
    );
    // Documents vérifiés: is_certified === true strictement
    const verifiedDocuments = documents.filter(doc => doc.is_certified === true);

    return (
        <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`
                        flex items-center gap-2 px-6 py-3 font-medium transition-colors relative
                        ${activeTab === "pending"
                            ? "text-amber-400"
                            : "text-white/60 hover:text-white/80"
                        }
                    `}
                >
                    <Clock className="h-4 w-4" />
                    En attente
                    <span className={`
                        ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${activeTab === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/10 text-white/60"
                        }
                    `}>
                        {pendingDocuments.length}
                    </span>
                    {activeTab === "pending" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("verified")}
                    className={`
                        flex items-center gap-2 px-6 py-3 font-medium transition-colors relative
                        ${activeTab === "verified"
                            ? "text-emerald-400"
                            : "text-white/60 hover:text-white/80"
                        }
                    `}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Vérifiés
                    <span className={`
                        ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${activeTab === "verified"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/10 text-white/60"
                        }
                    `}>
                        {verifiedDocuments.length}
                    </span>
                    {activeTab === "verified" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                    )}
                </button>
            </div>

            {/* Tabs Content */}
            <div className="mt-6">
                {activeTab === "pending" && (
                    <IdentityVerificationList
                        initialDocuments={pendingDocuments}
                        onDocumentUpdate={(updatedDocs) => setDocuments(updatedDocs)}
                    />
                )}

                {activeTab === "verified" && (
                    <VerifiedDocumentsView documents={verifiedDocuments} />
                )}
            </div>
        </div>
    );
}

// Composant pour afficher les documents vérifiés (historique)
function VerifiedDocumentsView({ documents }: { documents: IdentityDocument[] }) {
    const router = useRouter();
    const [selectedDoc, setSelectedDoc] = useState<IdentityDocument | null>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleViewDocument = (doc: IdentityDocument) => {
        setSelectedDoc(doc);
        setPreviewDialogOpen(true);
    };

    const handleOpenRevokeDialog = (doc: IdentityDocument) => {
        setSelectedDoc(doc);
        setRevokeDialogOpen(true);
    };

    const handleRevoke = async () => {
        if (!selectedDoc || !revokeReason.trim()) {
            toast.error("Veuillez indiquer une raison");
            return;
        }

        if (!confirm(`⚠️ ATTENTION: Révoquer la vérification de ${selectedDoc.profiles.full_name} va également décertifier toutes ses annonces. Confirmer ?`)) {
            return;
        }

        setProcessing(true);
        try {
            const result = await revokeIdentityVerification(selectedDoc.user_id, revokeReason);

            if (result.success) {
                toast.success("🔓 Vérification révoquée avec succès");
                setRevokeDialogOpen(false);
                setRevokeReason("");
                setSelectedDoc(null);
                router.refresh();
            } else {
                toast.error(result.error || "Erreur lors de la révocation");
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    if (documents.length === 0) {
        return (
            <Card className="border-white/10 bg-white/5 p-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold text-white mb-2">
                    Aucun document vérifié
                </h3>
                <p className="text-white/60">
                    Les documents d'identité vérifiés apparaîtront ici
                </p>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Document
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Vérifié le
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {doc.profiles.full_name}
                                                </p>
                                                {doc.profiles.phone && (
                                                    <p className="text-xs text-white/40">
                                                        {doc.profiles.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm text-white font-medium">
                                                {doc.file_type === 'cni' ? 'CNI' : doc.file_type === 'passport' ? 'Passeport' : doc.file_type}
                                            </p>
                                            <p className="text-xs text-white/40 truncate max-w-[200px]">
                                                {doc.file_name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-white/60">
                                            {format(new Date(doc.uploaded_at), "dd/MM/yyyy", { locale: fr })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                            <span className="text-sm text-emerald-400 font-medium">
                                                Vérifié
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-400 hover:bg-blue-500/10"
                                                onClick={() => handleViewDocument(doc)}
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                Voir
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                onClick={() => handleOpenRevokeDialog(doc)}
                                                disabled={processing}
                                            >
                                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                Révoquer
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Dialog de prévisualisation */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="bg-[#0b0f18] border-white/10 max-w-5xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            Document vérifié - {selectedDoc?.profiles.full_name}
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            {selectedDoc?.file_type === 'cni' ? 'Carte Nationale d\'Identité' : 'Passeport'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative w-full h-[600px] bg-white/5 rounded-lg overflow-hidden">
                        {selectedDoc?.file_url && (
                            <iframe
                                src={selectedDoc.file_url}
                                className="w-full h-full"
                                title="Document d'identité"
                            />
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewDialogOpen(false)}
                        >
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog de révocation */}
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <DialogContent className="bg-[#0b0f18] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Révoquer la vérification d'identité
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            ⚠️ Action critique pour {selectedDoc?.profiles.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400 font-semibold mb-2">
                                Cette action va :
                            </p>
                            <ul className="text-xs text-red-300 space-y-1 list-disc list-inside">
                                <li>Retirer le badge "Vérifié" du profil</li>
                                <li>Décertifier tous les documents d'identité</li>
                                <li>Décertifier toutes les annonces de l'utilisateur</li>
                            </ul>
                        </div>

                        <div>
                            <label className="text-sm text-white/80 font-medium mb-2 block">
                                Raison de la révocation
                            </label>
                            <Textarea
                                placeholder="Ex: Document expiré, informations incorrectes, fraude détectée..."
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRevokeDialogOpen(false);
                                setRevokeReason("");
                            }}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleRevoke}
                            disabled={processing || !revokeReason.trim()}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Confirmer la révocation
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
