'use client';

import { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle } from 'lucide-react';
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
import { useTheme } from "@/components/theme-provider";
import { ConfigurationRequirementCheck } from '../../components/ConfigurationRequirementCheck';

interface Lease {
    id: string;
    tenant_name: string;
    property_address: string;
    lease_pdf_url?: string | null;
}

interface CreateContractDialogProps {
    leases: Lease[];
    trigger?: React.ReactNode;
    profile?: any;
}

export function CreateContractDialog({ leases, trigger, profile }: CreateContractDialogProps) {
    const { isDark } = useTheme();
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    const selectedLease = leases.find(l => l.id === selectedLeaseId);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <button id="tour-generate-contract" className={`w-full text-left p-6 rounded-xl border transition-all group outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer ${isDark
                        ? 'border-slate-800 bg-gradient-to-br from-slate-900 to-black hover:border-slate-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                            <ShieldCheck className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nouveau Contrat de Bail</h3>
                        <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Générer un contrat conforme OHADA / Sénégal pour un locataire existant.</p>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className={`sm:max-w-md p-0 overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
                <ConfigurationRequirementCheck profile={profile} isDark={isDark}>
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <FileText className="h-5 w-5 text-primary" />
                                Générateur de Contrat
                            </DialogTitle>
                            <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                Sélectionnez un bail actif pour générer le contrat PDF.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Locataire & Bien</label>
                                <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                                    <SelectTrigger className={`focus:ring-primary ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-offset-slate-900' : 'bg-gray-50 border-gray-300 text-gray-900'
                                        }`}>
                                        <SelectValue placeholder="Sélectionner un bail..." />
                                    </SelectTrigger>
                                    <SelectContent className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'} max-w-[calc(100vw-2rem)]`}>
                                        {leases.length === 0 ? (
                                            <div className={`py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                Aucun bail actif trouvé
                                            </div>
                                        ) : (
                                            leases.map((lease) => (
                                                <SelectItem key={lease.id} value={lease.id} className={isDark ? 'focus:bg-slate-700 focus:text-slate-100 data-[state=checked]:bg-slate-700' : 'focus:bg-gray-100 focus:text-gray-900 data-[state=checked]:bg-gray-100'}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 max-w-full overflow-hidden">
                                                        <span className="font-medium truncate">{lease.tenant_name}</span>
                                                        <span className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                                            - {lease.property_address}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedLease && (
                                <div className={`rounded-lg p-4 space-y-3 border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedLease.tenant_name}</h4>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{selectedLease.property_address}</p>
                                        </div>
                                        {selectedLease.lease_pdf_url && (
                                            <div className={`px-2 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 ${isDark
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
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
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ConfigurationRequirementCheck>
            </DialogContent>
        </Dialog>
    );
}
