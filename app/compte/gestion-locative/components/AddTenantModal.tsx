"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewLease } from "../actions";
import { X } from 'lucide-react';

interface AddTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerId: string;
}

export function AddTenantModal({ isOpen, onClose, ownerId }: AddTenantModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
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
            status: 'active' as const,
        };

        // Appel de l'action serveur créée en Phase 1
        const result = await createNewLease(data);
        setLoading(false);

        if (result.success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl my-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Nouveau Locataire</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Nom complet du locataire <span className="text-red-400">*</span></label>
                            <Input name="tenant_name" placeholder="ex: Mamadou Diop" required className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Téléphone (WhatsApp)</label>
                            <Input name="tenant_phone" placeholder="ex: +221 77..." className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Email du locataire <span className="text-red-400">*</span>
                            <span className="text-xs text-slate-500 ml-2">(obligatoire pour l&apos;envoi des documents)</span>
                        </label>
                        <Input
                            name="tenant_email"
                            type="email"
                            placeholder="ex: locataire@email.com"
                            required
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Adresse du bien loué</label>
                        <Input
                            name="property_address"
                            placeholder="ex: Appartement F3, Almadies, Dakar"
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Montant du Loyer (FCFA) <span className="text-red-400">*</span></label>
                            <Input name="monthly_amount" type="number" placeholder="500000" required className="bg-slate-800 border-slate-700 text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Jour de paiement</label>
                            <Input name="billing_day" type="number" min="1" max="31" defaultValue="5" className="bg-slate-800 border-slate-700 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Date de début du bail <span className="text-red-400">*</span></label>
                        <Input name="start_date" type="date" required className="bg-slate-800 border-slate-700 text-white" />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-[#F4C430] text-black hover:bg-[#F4C430]/90 h-11 text-base font-semibold rounded-lg">
                        {loading ? "Création du bail..." : "Confirmer & Générer le Bail"}
                    </Button>
                    <p className="text-xs text-center text-slate-500 italic">
                        En cliquant, un contrat de bail standard sera généré et envoyé par email pour signature.
                    </p>
                </form>
            </div>
        </div>
    );
}
