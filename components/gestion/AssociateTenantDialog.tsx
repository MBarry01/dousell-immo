"use client";

import { useState } from "react";
import { TenantSelector } from "./TenantSelector";
import { associateTenant } from "@/app/(workspace)/gestion/biens/actions";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type AssociateTenantDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    propertyAddress?: string;
    propertyPrice?: number;
    teamId: string;
    ownerId: string;
};

export function AssociateTenantDialog({
    isOpen,
    onClose,
    propertyId,
    propertyTitle,
    propertyAddress,
    propertyPrice,
    teamId,
    ownerId,
}: AssociateTenantDialogProps) {
    const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>();
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantId || !startDate) return;

        setIsSubmitting(true);
        try {
            const result = await associateTenant(teamId, propertyId, selectedTenantId, startDate);
            if (result.success) {
                // Nudge Toast avec actions de suivi
                toast.success(
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold">Locataire associé avec succès ! 🎉</p>
                            <p className="text-sm text-zinc-400 mt-1">Que souhaitez-vous faire maintenant ?</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <a
                                href={`/gestion/baux/nouveau?property=${propertyId}`}
                                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                            >
                                📄 Générer le contrat de bail
                            </a>
                            <a
                                href={`/gestion/etats-lieux/new?property=${propertyId}&type=entree`}
                                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                            >
                                📝 Planifier l'État des Lieux
                            </a>
                        </div>
                    </div>,
                    {
                        duration: 8000,
                        className: "!bg-zinc-900 !border-zinc-800"
                    }
                );
                onClose();
            } else {
                toast.error(result.error || "Une erreur est survenue");
            }
        } catch (error) {
            toast.error("Erreur de connexion");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Associer un locataire</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Pour le bien : <span className="text-primary font-medium">{propertyTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    {/* SÉLECTEUR DE LOCATAIRE */}
                    <div className="space-y-2">
                        <TenantSelector
                            onChange={(id) => setSelectedTenantId(id)}
                            value={selectedTenantId}
                            propertyId={propertyId}
                            ownerId={ownerId}
                            propertyAddress={propertyAddress}
                            propertyPrice={propertyPrice}
                        />
                    </div>

                    {/* DATE D'ENTRÉE */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Date d'entrée (Début du bail)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm appearance-none h-11 dark:[&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-11 px-6"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedTenantId || !startDate || isSubmitting}
                            className="h-11 px-8 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Traitement...
                                </>
                            ) : (
                                "Valider le bail"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
