"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    CheckCircle,
    XCircle,
    Eye,
    User,
    Phone,
    MapPin,
    ExternalLink,
    FileText,
    BadgeCheck,
    Home,
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
import { approveProperty, rejectProperty } from "./actions";
import { formatCurrency } from "@/lib/utils";

type PropertyWithDocument = {
    id: string;
    title: string;
    price: number;
    location: { city?: string; [key: string]: unknown };
    images: string[];
    verification_status: string | null;
    created_at: string;
    proof_document_url: string;
    owner_id: string;
    profiles: {
        id: string;
        full_name: string;
        phone?: string;
        email?: string;
    };
    document: {
        id: string;
        file_name: string;
        file_type: string;
        file_url: string;
        uploaded_at: string;
    };
};

type Props = {
    initialProperties: PropertyWithDocument[];
};

export function PropertyVerificationList({ initialProperties }: Props) {
    const [properties, setProperties] = useState(initialProperties);
    const [selectedProperty, setSelectedProperty] = useState<PropertyWithDocument | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleApprove = async (property: PropertyWithDocument) => {
        if (!confirm(`Êtes-vous sûr de vouloir vérifier le bien "${property.title}" ?`)) {
            return;
        }

        setProcessing(true);
        try {
            const result = await approveProperty(property.id, property.document.id);

            if (result.success) {
                toast.success("Bien vérifié avec succès");
                // Remove from list
                setProperties(prev => prev.filter(p => p.id !== property.id));
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
        if (!selectedProperty || !rejectReason.trim()) {
            toast.error("Veuillez indiquer une raison");
            return;
        }

        setProcessing(true);
        try {
            const result = await rejectProperty(selectedProperty.id, selectedProperty.document.id, rejectReason);

            if (result.success) {
                toast.success("Document rejeté");
                // Remove from list
                setProperties(prev => prev.filter(p => p.id !== selectedProperty.id));
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedProperty(null);
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

    const openRejectDialog = (property: PropertyWithDocument) => {
        setSelectedProperty(property);
        setRejectDialogOpen(true);
    };

    if (properties.length === 0) {
        return (
            <Card className="border-border bg-card p-12 text-center">
                <BadgeCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    Aucun bien en attente
                </h3>
                <p className="text-muted-foreground">
                    Tous les documents de propriété ont été traités
                </p>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {properties.map((property) => (
                    <Card key={property.id} className="border-border bg-card p-6">
                        {/* Property Image */}
                        <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                            {property.images && property.images.length > 0 ? (
                                <Image
                                    src={property.images[0]}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Home className="h-12 w-12 text-muted-foreground/40" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <Link
                                    href={`/biens/${property.id}`}
                                    target="_blank"
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-foreground text-xs backdrop-blur-sm hover:bg-black/80"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Voir
                                </Link>
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="mb-4">
                            <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
                                {property.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>{property.location?.city || "Localisation non spécifiée"}</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-400">
                                {formatCurrency(property.price)}
                            </p>
                        </div>

                        {/* Owner Info */}
                        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-card">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {property.profiles.full_name}
                                </p>
                                {property.profiles.phone && (
                                    <p className="text-xs text-muted-foreground">{property.profiles.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <span className="text-sm font-medium text-white">{property.document.file_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Type: {property.document.file_type} • Uploadé le{" "}
                                {format(new Date(property.document.uploaded_at), "dd MMM yyyy", { locale: fr })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-border text-foreground hover:bg-muted"
                                onClick={() => window.open(property.document.file_url, "_blank")}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                Document
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                onClick={() => handleApprove(property)}
                                disabled={processing}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                onClick={() => openRejectDialog(property)}
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
                            Veuillez indiquer la raison du rejet pour &quot;{selectedProperty?.title}&quot;
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

