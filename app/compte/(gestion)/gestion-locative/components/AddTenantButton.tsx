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
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';

interface AddTenantButtonProps {
    ownerId: string;
    trigger?: React.ReactNode;
    profile?: any; // To allow flexibility with Supabase types
    initialData?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        amount?: number;
        day?: number;
        startDate?: string;
        endDate?: string;
    };
}

export function AddTenantButton({ ownerId, trigger, initialData, profile }: AddTenantButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProfileAlert, setShowProfileAlert] = useState(false);

    // Contract Generation Flow State
    const [showContractPrompt, setShowContractPrompt] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [createdLease, setCreatedLease] = useState<{ id: string, name: string } | null>(null);

    const router = useRouter();

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            // Check if profile is complete enough for legal contracts
            // We check for minimal required fields: Name/Company and Address
            const isProfileComplete = profile && (
                (profile.full_name || profile.company_name) &&
                (profile.company_address)
            );

            if (!isProfileComplete) {
                setShowProfileAlert(true);
                return;
            }
        }
        setOpen(isOpen);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const tenantNameVal = formData.get('tenant_name') as string;

        const data = {
            owner_id: ownerId,
            tenant_name: tenantNameVal,
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

        if (result.success && result.id) {
            toast.success('Locataire ajouté avec succès');
            // Instead of closing immediately, trigger the contract flow
            setCreatedLease({ id: result.id, name: tenantNameVal });
            setOpen(false); // Close the "Add Tenant" modal

            // Short delay to allow smooth transition before showing contract prompt
            setTimeout(() => {
                setShowContractPrompt(true);
            }, 300);

            router.refresh();
        } else {
            const errorMsg = result.error || 'Erreur lors de la création';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {trigger ? (
                        trigger
                    ) : (
                        <Button className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 rounded-lg h-9 px-4 font-medium text-sm transition-all">
                            <Plus className="w-4 h-4 mr-1.5" /> Nouveau
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[90vw] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900 border-slate-800 text-white px-4 pt-4 pb-24 sm:p-6 outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-white">
                            {initialData ? "Exemple de Bail (Démo)" : "Nouveau Locataire"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {initialData ? "Ces données sont pré-remplies pour tester la création." : "Remplissez les informations pour créer un nouveau bail"}
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
                                    defaultValue={initialData?.name}
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
                                    defaultValue={initialData?.phone}
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
                                defaultValue={initialData?.email}
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Adresse du bien <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="property_address"
                                placeholder="ex: Appartement F3, Almadies, Dakar"
                                defaultValue={initialData?.address}
                                required
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
                                    defaultValue={initialData?.amount}
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
                                    defaultValue={initialData?.day || 5}
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
                                    defaultValue={initialData?.startDate}
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
                                defaultValue={initialData?.endDate}
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

            {/* PROMPT: Generate Contract? */}
            <Dialog open={showContractPrompt} onOpenChange={setShowContractPrompt}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Générer le contrat de bail ?</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Le locataire a été créé avec succès. Souhaitez-vous générer et personnaliser le contrat de bail maintenant ?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowContractPrompt(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Non, plus tard
                        </Button>
                        <Button
                            onClick={() => {
                                setShowContractPrompt(false);
                                // Small delay to prevent body scroll locking issues between modals
                                setTimeout(() => setShowContractModal(true), 150);
                            }}
                            className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
                        >
                            Oui, générer le contrat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: Generate Contract */}
            {
                createdLease && (
                    <GenerateContractModal
                        leaseId={createdLease.id}
                        tenantName={createdLease.name}
                        open={showContractModal}
                        onOpenChange={setShowContractModal}
                        onSuccess={() => {
                            // Contract generated successfully
                            setShowContractModal(false);
                        }}
                    />
                )
            }
            {/* ALERT: Profile Incomplete */}
            <Dialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-red-900/50 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <span>⚠️ Profil Incomplet</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 pt-2">
                            Pour créer des baux valides et générer des contrats légaux, vous devez d&apos;abord renseigner vos informations (Nom/Agence et Adresse).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowProfileAlert(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => router.push('/compte/gestion-locative/config')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Compléter mon profil
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
