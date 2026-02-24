"use client";

import { useState } from "react";
import { TenantSelector } from "./TenantSelector";
import { associateTenant } from "@/app/(workspace)/gestion/biens/actions";
import { sendWelcomePack } from "@/app/(workspace)/gestion/actions";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building, Users } from "lucide-react";

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
    const [rentalType, setRentalType] = useState<'entire' | 'partial'>('entire');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantId || !startDate) return;

        setIsSubmitting(true);
        try {
            const result = await associateTenant(teamId, propertyId, selectedTenantId, startDate, rentalType);
            if (result.success && result.leaseId) {
                // Envoi automatique du pack de bienvenue
                toast.promise(sendWelcomePack(result.leaseId), {
                    loading: "Envoi du pack de bienvenue...",
                    success: "Pack de bienvenue envoyé ! 🎉",
                    error: "Erreur lors de l'envoi du pack"
                });

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
                                📝 Planifier l&apos;État des Lieux
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
            <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Associer un locataire</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Pour le bien : <span className="text-primary font-medium">{propertyTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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

                    {/* TYPE DE LOCATION */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Type de location</label>
                        <RadioGroup
                            value={rentalType}
                            onValueChange={(v) => setRentalType(v as 'entire' | 'partial')}
                            className="grid grid-cols-2 gap-4"
                        >
                            {([
                                { value: 'entire', id: 'entire', Icon: Building, label: 'Logement entier', sub: 'Pour un seul locataire ou une famille' },
                                { value: 'partial', id: 'partial', Icon: Users, label: 'Colocation', sub: 'Par chambre ou partie du bien' },
                            ] as const).map(({ value, id, Icon, label, sub }) => {
                                const isSelected = rentalType === value;
                                return (
                                    <div key={value}>
                                        <RadioGroupItem value={value} id={id} className="sr-only" />
                                                        <Label
                                            htmlFor={id}
                                            className={`group flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : 'bg-card border-border text-foreground hover:bg-muted hover:border-primary/40'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                            <div className="text-center">
                                                <p className="font-semibold text-xs">{label}</p>
                                                <p className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'opacity-70' : 'text-muted-foreground'}`}>{sub}</p>
                                            </div>
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* DATE D'ENTRÉE */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Date d&apos;entrée (Début du bail)
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
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-11 px-6 rounded-xl border-border/50 hover:bg-muted/50 transition-all"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedTenantId || !startDate || isSubmitting}
                            className="h-11 px-8 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
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
