"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { updateLease } from "../actions";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Tenant {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    property: string;
    rentAmount: number;
    dueDate?: number;
    startDate?: string;
    endDate?: string;
}

interface EditTenantDialogProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant;
}

export function EditTenantDialog({ isOpen, onClose, tenant }: EditTenantDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!tenant) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // Only include fields that have values
        const data: Record<string, string | number> = {};

        const tenantName = formData.get('tenant_name') as string;
        if (tenantName) data.tenant_name = tenantName;

        const tenantPhone = formData.get('tenant_phone') as string;
        if (tenantPhone) data.tenant_phone = tenantPhone;

        const tenantEmail = formData.get('tenant_email') as string;
        if (tenantEmail) data.tenant_email = tenantEmail;

        const propertyAddress = formData.get('property_address') as string;
        if (propertyAddress) data.property_address = propertyAddress;

        const monthlyAmount = formData.get('monthly_amount');
        if (monthlyAmount) data.monthly_amount = Number(monthlyAmount);

        const billingDay = formData.get('billing_day');
        if (billingDay) data.billing_day = Number(billingDay);

        // Start date might be needed if user wants to correct it
        const startDate = formData.get('start_date') as string;
        if (startDate) data.start_date = startDate;

        // End date for legal alerts (J-180 and J-90)
        const endDate = formData.get('end_date') as string;
        if (endDate) data.end_date = endDate;

        const result = await updateLease(tenant.id, data);
        setLoading(false);

        if (result.success) {
            toast.success('Bail modifié avec succès');
            onClose();
            router.refresh();
        } else {
            toast.error(result.error || 'Erreur lors de la modification');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[90vw] sm:w-full sm:max-w-[550px] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-slate-900 border-slate-800 text-white px-4 pt-4 pb-24 sm:p-6 outline-none">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">Modifier le bail</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Modifications pour {tenant.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Nom complet <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="tenant_name"
                                required
                                defaultValue={tenant.name}
                                placeholder="ex: Mamadou Diop"
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Téléphone <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="tenant_phone"
                                required
                                defaultValue={tenant.phone}
                                placeholder="ex: +221 77..."
                                className="bg-slate-800 border-slate-700 text-white"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Email <span className="text-red-400">*</span>
                        </label>
                        <Input
                            name="tenant_email"
                            type="email"
                            required
                            defaultValue={tenant.email}
                            placeholder="ex: locataire@email.com"
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
                            required
                            defaultValue={tenant.property}
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
                                required
                                defaultValue={tenant.rentAmount}
                                placeholder="500000"
                                className="bg-slate-800 border-slate-700 text-white font-mono"
                                whileFocus={{ scale: 1 }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Jour paiement <span className="text-red-400">*</span>
                            </label>
                            <Input
                                name="billing_day"
                                type="number"
                                min="1"
                                max="31"
                                required
                                defaultValue={tenant.dueDate || 5}
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
                                defaultValue={tenant.startDate}
                                className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:p-1"
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
                            defaultValue={tenant.endDate}
                            className="bg-slate-800 border-slate-700 text-white h-10 w-full px-3 block [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:p-1"
                            whileFocus={{ scale: 1 }}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="hover:bg-slate-800 text-slate-300"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90"
                        >
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
