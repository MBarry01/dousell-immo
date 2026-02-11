"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[90vw] sm:w-full sm:max-w-[550px] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-card border-border text-foreground px-4 pt-4 pb-24 sm:p-6 outline-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">Modifier le bail</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Modifications pour {tenant.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tenant_name" className="text-sm font-medium text-foreground/80" required>
                                Nom complet
                            </Label>
                            <Input
                                name="tenant_name"
                                required
                                defaultValue={tenant.name}
                                placeholder="ex: Amadou Ndiaye"
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tenant_phone" className="text-sm font-medium text-foreground/80" required>
                                Téléphone
                            </Label>
                            <Input
                                name="tenant_phone"
                                required
                                defaultValue={tenant.phone}
                                placeholder="ex: +221 77..."
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tenant_email" className="text-sm font-medium text-foreground/80" required>
                            Email
                        </Label>
                        <Input
                            name="tenant_email"
                            type="email"
                            required
                            defaultValue={tenant.email}
                            placeholder="ex: locataire@email.com"
                            className="bg-background border-border text-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="property_address" className="text-sm font-medium text-foreground/80" required>
                            Adresse du bien
                        </Label>
                        <Input
                            name="property_address"
                            required
                            defaultValue={tenant.property}
                            placeholder="ex: Appartement F3, Almadies, Dakar"
                            className="bg-background border-border text-foreground"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="monthly_amount" className="text-sm font-medium text-foreground/80" required>
                                Loyer (FCFA)
                            </Label>
                            <Input
                                name="monthly_amount"
                                type="number"
                                required
                                defaultValue={tenant.rentAmount}
                                placeholder="500000"
                                className="bg-background border-border text-foreground font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billing_day" className="text-sm font-medium text-foreground/80" required>
                                Jour paiement
                            </Label>
                            <Input
                                name="billing_day"
                                type="number"
                                min="1"
                                max="31"
                                required
                                defaultValue={tenant.dueDate || 5}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start_date" className="text-sm font-medium text-foreground/80" required>
                                Début bail
                            </Label>
                            <Input
                                name="start_date"
                                type="date"
                                required
                                defaultValue={tenant.startDate}
                                className="bg-background border-border text-foreground h-10 w-full px-3 block"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end_date" className="text-sm font-medium text-foreground/80" required>
                            Fin bail <span className="text-xs text-muted-foreground ml-2">(pour les alertes juridiques J-180 et J-90)</span>
                        </Label>
                        <Input
                            name="end_date"
                            type="date"
                            required
                            defaultValue={tenant.endDate}
                            className="bg-background border-border text-foreground h-10 w-full px-3 block"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="hover:bg-accent text-accent-foreground"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                        >
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
