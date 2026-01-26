"use client";

import { useState } from "react";
import { TenantSelector } from "./TenantSelector";
import { associateTenant } from "@/app/(workspace)/gestion/biens/actions";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white mb-1">
                        Associer un locataire
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Pour le bien : <span className="text-[#F4C430]">{propertyTitle}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                        <label className="block text-sm font-medium text-zinc-300">
                            Date d'entrée (Début du bail)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-[#F4C430] shadow-sm appearance-none"
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-lg text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedTenantId || !startDate || isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-[#F4C430] text-black rounded-lg font-medium hover:bg-[#F4C430]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                "Valider le bail"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
