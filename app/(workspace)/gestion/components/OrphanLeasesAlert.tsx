"use client";

import { useState } from "react";
import { AlertTriangle, Link as LinkIcon, X, Check, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAllTeamProperties, type VacantProperty } from "../actions/property-selector";
import { linkLeaseToProperty } from "../actions";

interface OrphanLease {
    id: string;
    tenant_name: string;
    property_address?: string;
    monthly_amount: number;
}

interface OrphanLeasesAlertProps {
    count: number;
    leases: OrphanLease[];
}

export function OrphanLeasesAlert({ count, leases }: OrphanLeasesAlertProps) {
    const [open, setOpen] = useState(false);
    const [properties, setProperties] = useState<VacantProperty[]>([]);
    const [loading, setLoading] = useState(false);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [dismissed, setDismissed] = useState(false);
    const router = useRouter();

    const handleOpenDialog = async () => {
        setLoading(true);
        const result = await getAllTeamProperties();
        if (result.success && result.data) {
            setProperties(result.data);
        }
        setLoading(false);
        setOpen(true);
    };

    const handleLink = async (leaseId: string) => {
        const propertyId = selections[leaseId];
        if (!propertyId) {
            toast.error("Sélectionnez un bien");
            return;
        }

        setLoading(true);
        const result = await linkLeaseToProperty(leaseId, propertyId);
        setLoading(false);

        if (result.success) {
            toast.success("Bail lié au bien !");
            // Remove from selections
            const newSelections = { ...selections };
            delete newSelections[leaseId];
            setSelections(newSelections);
            router.refresh();
        } else {
            toast.error(result.error || "Erreur lors de la liaison");
        }
    };

    if (dismissed) return null;

    return (
        <>
            {/* Banner Alert */}
            <div className="mb-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 relative">
                {/* Bouton fermer en haut à droite */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissed(true)}
                    className="absolute top-2 right-2 h-7 w-7 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                >
                    <X className="w-4 h-4" />
                </Button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-8">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-orange-300">
                                {count} bail{count > 1 ? "s" : ""} sans bien associé
                            </p>
                            <p className="text-sm text-orange-400/80">
                                Ces locataires ont été importés sans liaison automatique à un bien existant.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleOpenDialog}
                        className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto shrink-0"
                        size="sm"
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Lier maintenant
                    </Button>
                </div>
            </div>

            {/* Reconciliation Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground max-h-[80vh] overflow-y-auto shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-primary" />
                            Associer les baux aux biens
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Sélectionnez le bien correspondant à chaque locataire.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {leases.map((lease) => (
                            <div
                                key={lease.id}
                                className="p-4 rounded-lg bg-muted/30 border border-border space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">{lease.tenant_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {lease.property_address || "Adresse non renseignée"} • {lease.monthly_amount.toLocaleString()} FCFA/mois
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Select
                                        value={selections[lease.id] || ""}
                                        onValueChange={(val) =>
                                            setSelections({ ...selections, [lease.id]: val })
                                        }
                                    >
                                        <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                                            <SelectValue placeholder="Sélectionner un bien..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border">
                                            {properties.length === 0 ? (
                                                <SelectItem value="_empty" disabled className="text-muted-foreground">
                                                    Aucun bien disponible
                                                </SelectItem>
                                            ) : (
                                                properties.map((prop) => (
                                                    <SelectItem
                                                        key={prop.id}
                                                        value={prop.id}
                                                        className="focus:bg-accent focus:text-accent-foreground"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Home className="w-4 h-4 text-primary" />
                                                            <span>{prop.title}</span>
                                                            <span className="text-muted-foreground text-xs">
                                                                ({prop.price.toLocaleString()} FCFA)
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        onClick={() => handleLink(lease.id)}
                                        disabled={!selections[lease.id] || loading}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                                        size="sm"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {leases.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                <p>Tous les baux sont liés !</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
