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
import { ReceiptModal } from '../../components/ReceiptModal';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { useTheme } from '@/components/workspace/providers/theme-provider';

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
    const { isDark } = useTheme();
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
                    <button className={`w-full text-left p-6 rounded-xl border transition-all group outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer ${isDark
                            ? 'border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                            <FileText className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Générer une Quittance</h3>
                        <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Créer manuellement une quittance pour un paiement hors plateforme.</p>
                    </button>
                </DialogTrigger>
                <DialogContent className={`sm:max-w-md ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <FileText className="h-5 w-5 text-blue-500" />
                            Générateur de Quittance
                        </DialogTitle>
                        <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                            Créez une quittance pour un locataire existant.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Locataire & Bien</label>
                            <Select value={selectedLeaseId} onValueChange={handleLeaseChange}>
                                <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                    <SelectValue placeholder="Sélectionner un bail..." />
                                </SelectTrigger>
                                <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}>
                                    {leases.length === 0 ? (
                                        <div className={`py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                            Aucun bail actif trouvé
                                        </div>
                                    ) : (
                                        leases.map((lease) => (
                                            <SelectItem key={lease.id} value={lease.id} className={isDark ? 'focus:bg-slate-700 focus:text-slate-100' : 'focus:bg-gray-100 focus:text-gray-900'}>
                                                <span className="font-medium">{lease.tenant_name}</span>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedLease && (
                                <p className={`text-xs ml-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    {selectedLease.property_address}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Mois</label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Année</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}>
                                        {[year, (parseInt(year) - 1).toString(), (parseInt(year) + 1).toString()].sort().map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Montant (FCFA)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-300 text-gray-900'
                                    }`}
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
