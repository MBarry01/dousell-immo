'use client';

import { useState } from 'react';
import { FileText, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ReceiptModal } from '../../gestion-locative/components/ReceiptModal';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface Lease {
    id: string;
    tenant_name: string;
    tenant_email?: string;
    tenant_phone?: string;
    property_address: string;
    monthly_amount: number;
}

interface CreateReceiptDialogProps {
    leases: Lease[];
    userEmail?: string;
    profile?: any;
}

export function CreateReceiptDialog({ leases, userEmail, profile }: CreateReceiptDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
    const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + '');
    const [year, setYear] = useState<string>(new Date().getFullYear() + '');
    const [amount, setAmount] = useState<string>('');

    // State for the preview modal
    const [showPreview, setShowPreview] = useState(false);

    const selectedLease = leases.find(l => l.id === selectedLeaseId);

    const handleLeaseChange = (leaseId: string) => {
        const lease = leases.find(l => l.id === leaseId);
        setSelectedLeaseId(leaseId);
        if (lease) {
            setAmount(lease.monthly_amount.toString());
        }
    };

    const handleGenerate = () => {
        if (!selectedLease || !amount) return;
        setShowPreview(true);
    };

    const periodMonth = parseInt(month).toString().padStart(2, '0');

    // Construct data for ReceiptModal
    const receiptData = selectedLease ? {
        leaseId: selectedLease.id,
        tenant: {
            tenant_name: selectedLease.tenant_name,
            email: selectedLease.tenant_email,
            phone: selectedLease.tenant_phone,
            address: selectedLease.property_address
        },
        property_address: selectedLease.property_address,
        amount: parseInt(amount),
        month: periodMonth,
        year: parseInt(year),
        userEmail: userEmail,
        profile: profile
    } : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <button className="w-full text-left p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700 transition-all group outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">Générer une Quittance</h3>
                        <p className="text-sm text-slate-400 mt-2">Créer manuellement une quittance pour un paiement hors plateforme.</p>
                    </button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Générateur de Quittance
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Créez une quittance pour un locataire existant.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Locataire & Bien</label>
                            <Select value={selectedLeaseId} onValueChange={handleLeaseChange}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                                    <SelectValue placeholder="Sélectionner un bail..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                    {leases.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-slate-500">
                                            Aucun bail actif trouvé
                                        </div>
                                    ) : (
                                        leases.map((lease) => (
                                            <SelectItem key={lease.id} value={lease.id} className="focus:bg-slate-700 focus:text-slate-100">
                                                <span className="font-medium">{lease.tenant_name}</span>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedLease && (
                                <p className="text-xs text-slate-500 ml-1">
                                    {selectedLease.property_address}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Mois</label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Année</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                        {[year, (parseInt(year) - 1).toString(), (parseInt(year) + 1).toString()].sort().map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Montant (FCFA)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedLease || !amount}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Prévisualiser la Quittance
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {receiptData && (
                <ReceiptModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    data={receiptData}
                />
            )}
        </>
    );
}
