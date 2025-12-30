"use client"

import { useState } from 'react';
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createNewLease } from "../actions";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AddTenantButtonProps {
    ownerId: string;
}

export function AddTenantButton({ ownerId }: AddTenantButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const data = {
            owner_id: ownerId,
            tenant_name: formData.get('tenant_name') as string,
            tenant_phone: formData.get('tenant_phone') as string,
            tenant_email: formData.get('tenant_email') as string,
            property_address: formData.get('property_address') as string,
            monthly_amount: Number(formData.get('monthly_amount')),
            billing_day: Number(formData.get('billing_day')) || 5,
            start_date: formData.get('start_date') as string,
            end_date: formData.get('end_date') as string || null,
            status: 'active' as const,
        };

        const result = await createNewLease(data);
        setLoading(false);

        if (result.success) {
            toast.success('Locataire ajouté avec succès');
            setOpen(false);
            router.refresh();
        } else {
            const errorMsg = result.error || 'Erreur lors de la création';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 rounded-lg h-9 px-4 font-medium text-sm transition-all">
                    <Plus className="w-4 h-4 mr-1.5" /> Nouveau
                </Button>
            </DialogTrigger>
            <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[95vw] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900 border-slate-800 text-white p-4 sm:p-6 outline-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">Nouveau Locataire</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Remplissez les informations pour créer un nouveau bail
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Zone d'erreur critique */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                            <span className="text-red-500 mt-0.5">⚠️</span>
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-red-500">Erreur Bloquante</h4>
                                <p className="text-sm text-red-200/90">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nom complet <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="tenant_name"
                                placeholder="ex: Mamadou Diop"
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Téléphone</label>
                            <Input
                                name="tenant_phone"
                                placeholder="ex: +221 77..."
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Email <span className="text-red-400">*</span>
                            <span className="text-xs text-slate-500 ml-2">(pour l&apos;envoi des quittances)</span>
                        </label>
                        <Input
                            name="tenant_email"
                            type="email"
                            placeholder="ex: locataire@email.com"
                            required
                            className="bg-slate-800 border-slate-700 text-white"
                            whileFocus={{ scale: 1 }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Adresse du bien</label>
                        <Input
                            name="property_address"
                            placeholder="ex: Appartement F3, Almadies, Dakar"
                            className="bg-slate-800 border-slate-700 text-white"
                            whileFocus={{ scale: 1 }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Loyer (FCFA) <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="monthly_amount"
                                type="number"
                                placeholder="500000"
                                required
                                className="bg-slate-800 border-slate-700 text-white font-mono"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Jour de paiement</label>
                            <Input
                                name="billing_day"
                                type="number"
                                min="1"
                                max="31"
                                defaultValue="5"
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Début bail <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="start_date"
                                type="date"
                                required
                                className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Fin bail <span className="text-red-400">*</span>
                            <span className="text-xs text-slate-500 ml-2">(pour les alertes juridiques J-180 et J-90)</span>
                        </label>
                        <Input
                            name="end_date"
                            type="date"
                            required
                            className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1"
                            whileFocus={{ scale: 1 }}
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 h-11 text-base font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Création en cours...</span>
                                </div>
                            ) : (
                                "Confirmer & Créer le Bail"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
}
