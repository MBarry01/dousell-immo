'use client';

import { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle, Search } from 'lucide-react';
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
import { GenerateContractButton } from '@/components/contracts/GenerateContractButton';
import { cn } from '@/lib/utils';

interface Lease {
    id: string;
    tenant_name: string;
    property_address: string;
    lease_pdf_url?: string | null;
}

interface CreateContractDialogProps {
    leases: Lease[];
}

export function CreateContractDialog({ leases }: CreateContractDialogProps) {
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    const selectedLease = leases.find(l => l.id === selectedLeaseId);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="w-full text-left p-6 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700 transition-all group outline-none focus:ring-2 focus:ring-blue-500/50">
                    <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Nouveau Contrat de Bail</h3>
                    <p className="text-sm text-slate-400 mt-2">Générer un contrat conforme OHADA / Sénégal pour un locataire existant.</p>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Générateur de Contrat
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Sélectionnez un bail actif pour générer le contrat PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Locataire & Bien</label>
                        <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-500 focus:ring-offset-slate-900">
                                <SelectValue placeholder="Sélectionner un bail..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                {leases.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-slate-500">
                                        Aucun bail actif trouvé
                                    </div>
                                ) : (
                                    leases.map((lease) => (
                                        <SelectItem key={lease.id} value={lease.id} className="focus:bg-slate-700 focus:text-slate-100 data-[state=checked]:bg-slate-700">
                                            <span className="font-medium">{lease.tenant_name}</span>
                                            <span className="ml-2 text-slate-500 text-xs truncate max-w-[200px] inline-block align-bottom">
                                                - {lease.property_address}
                                            </span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedLease && (
                        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3 border border-slate-700/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-white">{selectedLease.tenant_name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{selectedLease.property_address}</p>
                                </div>
                                {selectedLease.lease_pdf_url && (
                                    <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium border border-green-500/20 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Contrat existant
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <GenerateContractButton
                                    leaseId={selectedLease.id}
                                    tenantName={selectedLease.tenant_name}
                                    existingContractUrl={selectedLease.lease_pdf_url || undefined}
                                    variant="default"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
