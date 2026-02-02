'use client';

import { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle, Search, Download } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateContractButton } from '@/components/contracts/GenerateContractButton';
import { ReceiptModal } from './ReceiptModal';
import { cn } from '@/lib/utils'; // Assumed utility

interface Lease {
    id: string;
    tenant_name: string;
    tenant_email?: string;
    tenant_phone?: string;
    property_address: string;
    monthly_amount: number;
    lease_pdf_url?: string | null;
}

interface DocumentGeneratorDialogProps {
    leases: Lease[];
    userEmail?: string;
    profile?: any;
    trigger?: React.ReactNode;
}

export function DocumentGeneratorDialog({ leases, userEmail, profile, trigger }: DocumentGeneratorDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [docType, setDocType] = useState<'receipt' | 'contract'>('receipt');

    // Receipt State
    const [receiptLeaseId, setReceiptLeaseId] = useState<string>('');
    const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + '');
    const [year, setYear] = useState<string>(new Date().getFullYear() + '');
    const [amount, setAmount] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);

    // Contract State
    const [contractLeaseId, setContractLeaseId] = useState<string>('');

    const selectedReceiptLease = leases.find(l => l.id === receiptLeaseId);
    const selectedContractLease = leases.find(l => l.id === contractLeaseId);

    const handleReceiptLeaseChange = (leaseId: string) => {
        const lease = leases.find(l => l.id === leaseId);
        setReceiptLeaseId(leaseId);
        if (lease) {
            setAmount(lease.monthly_amount.toString());
        }
    };

    const handleGenerateReceipt = () => {
        if (!selectedReceiptLease || !amount) return;
        setShowPreview(true);
    };

    const periodMonth = parseInt(month).toString().padStart(2, '0');

    // Receipt Data Construction
    const receiptData = selectedReceiptLease ? {
        leaseId: receiptLeaseId, // Ajout pour stockage automatique
        tenant: {
            tenant_name: selectedReceiptLease.tenant_name,
            email: selectedReceiptLease.tenant_email,
            phone: selectedReceiptLease.tenant_phone,
            address: selectedReceiptLease.property_address
        },
        property_address: selectedReceiptLease.property_address,
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
                    {trigger ? trigger : (
                        <Button
                            variant="outline"
                            className="h-9 px-2 sm:px-3 gap-2 bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Générer</span>
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-foreground">
                            {docType === 'receipt' ? (
                                <FileText className="h-5 w-5 text-primary" />
                            ) : (
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            )}
                            Générateur de Documents
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Sélectionnez le type de document à générer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-2 pb-4">
                        {/* Type Selector */}
                        <div className="w-full">
                            <Tabs value={docType} onValueChange={(v) => setDocType(v as 'receipt' | 'contract')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-muted">
                                    <TabsTrigger value="receipt" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                                        quittance de Loyer
                                    </TabsTrigger>
                                    <TabsTrigger value="contract" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                                        Contrat de Bail
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* RECEIPT FORM */}
                        {docType === 'receipt' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/80">Locataire & Bien</label>
                                    <Select value={receiptLeaseId} onValueChange={handleReceiptLeaseChange}>
                                        <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue placeholder="Sélectionner un bail..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-foreground">
                                            {leases.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">Aucun bail actif</div>
                                            ) : (
                                                leases.map((lease) => (
                                                    <SelectItem key={lease.id} value={lease.id} className="focus:bg-accent focus:text-accent-foreground">
                                                        <span className="font-medium text-foreground">{lease.tenant_name}</span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {selectedReceiptLease && (
                                        <p className="text-xs text-muted-foreground ml-1 truncate">
                                            {selectedReceiptLease.property_address}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground/80">Mois</label>
                                        <Select value={month} onValueChange={setMonth}>
                                            <SelectTrigger className="bg-background border-border text-foreground text-sm h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-foreground max-h-[200px]">
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                    <SelectItem key={m} value={m.toString()}>
                                                        {new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground/80">Année</label>
                                        <Select value={year} onValueChange={setYear}>
                                            <SelectTrigger className="bg-background border-border text-foreground text-sm h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-foreground">
                                                {[year, (parseInt(year) - 1).toString(), (parseInt(year) + 1).toString()].sort().map((y) => (
                                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/80">Montant (FCFA)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => {
                                            setIsOpen(false); // Fermer le dialogue principal pour éviter le chevauchement
                                            handleGenerateReceipt();
                                        }}
                                        disabled={!selectedReceiptLease || !amount}
                                        className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-all shadow-md"
                                    >
                                        Prévisualiser la Quittance
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* CONTRACT FORM */}
                        {docType === 'contract' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/80">Locataire & Bien</label>
                                    <Select value={contractLeaseId} onValueChange={setContractLeaseId}>
                                        <SelectTrigger className="bg-background border-border text-foreground">
                                            <SelectValue placeholder="Sélectionner un bail..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-foreground">
                                            {leases.length === 0 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">Aucun bail actif</div>
                                            ) : (
                                                leases.map((lease) => (
                                                    <SelectItem key={lease.id} value={lease.id} className="focus:bg-accent focus:text-accent-foreground">
                                                        <span className="font-medium text-foreground">{lease.tenant_name}</span>
                                                        <span className="ml-2 text-muted-foreground text-xs truncate max-w-[200px] inline-block align-bottom">
                                                            - {lease.property_address}
                                                        </span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedContractLease && (
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-foreground">{selectedContractLease.tenant_name}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{selectedContractLease.property_address}</p>
                                            </div>
                                            {selectedContractLease.lease_pdf_url && (
                                                <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-medium border border-green-500/20 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Existe déjà
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <GenerateContractButton
                                                leaseId={selectedContractLease.id}
                                                tenantName={selectedContractLease.tenant_name}
                                                existingContractUrl={selectedContractLease.lease_pdf_url || undefined}
                                                variant="default"
                                                className="w-full bg-[#0F172A] text-white hover:bg-[#1E293B] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-medium transition-all shadow-md"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <p className="text-xs text-primary/80">
                                        💡 Le contrat généré sera conforme aux normes OHADA et au droit sénégalais.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal (Outside of main dialog to prevent nesting issues) */}
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
