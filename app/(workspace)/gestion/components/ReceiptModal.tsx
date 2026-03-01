'use client';

import { useState, useEffect } from 'react';
import { X, Download, Mail } from 'lucide-react';
import { ReceiptPreview } from './ReceiptPreview';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';

interface ReceiptData {
    leaseId?: string;
    tenant?: {
        tenant_name?: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    property_address?: string;
    amount?: number;
    period?: string;
    month?: string | number;
    year?: number;
    periodStart?: string;
    periodEnd?: string;
    receiptNumber?: string;
    userEmail?: string;
    profile?: {
        company_name?: string | null;
        full_name?: string | null;
        company_address?: string | null;
        company_email?: string | null;
        email?: string;
        logo_url?: string | null;
        signature_url?: string | null;
        ninea?: string | null;
        company_ninea?: string | null;
    };
    receiptImage?: string | null;
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
    const [isSending, setIsSending] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // Reset hasSaved quand la modal se ferme ou que les données changent
    useEffect(() => {
        if (!isOpen) setHasSaved(false);
    }, [isOpen]);

    // Préparer les données pour le PDF
    const receiptDetails = data ? {
        leaseId: data.leaseId,
        tenantName: data.tenant?.tenant_name || data.tenant?.name || 'Locataire',
        tenantEmail: data.tenant?.email || '',
        tenantPhone: data.tenant?.phone || '',
        tenantAddress: data.property_address || '',
        amount: Number(data.amount) || 0,
        periodMonth: `${String(data.month).padStart(2, '0')}/${data.year}`,
        periodStart: `01/${String(data.month).padStart(2, '0')}/${data.year}`,
        periodEnd: `30/${String(data.month).padStart(2, '0')}/${data.year}`,
        receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,
        ownerName: data.profile?.company_name || data.profile?.full_name || 'Propriétaire',
        ownerAddress: data.profile?.company_address || '',
        ownerNinea: data.profile?.company_ninea || '',
        ownerLogo: data.profile?.logo_url || undefined,
        ownerSignature: data.profile?.signature_url || undefined,
        ownerEmail: data.profile?.company_email || undefined,
        ownerAccountEmail: data.userEmail || undefined,
        propertyAddress: data.property_address || 'Adresse non renseignée',
    } : null;

    // Auto-save silencieuse en arrière-plan
    useEffect(() => {
        const autoSave = async () => {
            if (isOpen && receiptDetails?.leaseId && !hasSaved) {
                setHasSaved(true);
                try {
                    const response = await fetch('/api/save-receipt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(receiptDetails),
                    });
                    if (!response.ok) {
                        console.error('Auto-save quittance échoué:', await response.text());
                    }
                } catch (e) {
                    console.error('Auto-save error:', e);
                }
            }
        };
        autoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, data]);

    if (!isOpen || !data || !receiptDetails) return null;

    const filename = `Quittance_${receiptDetails.tenantName.replace(/\s+/g, '_')}_${String(data.month).padStart(2, '0')}_${data.year}.pdf`;

    const handleSendEmail = async () => {
        if (isSending) return;
        if (!receiptDetails.tenantEmail) {
            toast.error('Aucun email renseigné pour ce locataire.');
            return;
        }
        setIsSending(true);
        try {
            const response = await fetch('/api/send-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiptDetails),
            });
            const result = await response.json();
            if (result.success) {
                toast.success(`Quittance envoyée à ${receiptDetails.tenantEmail} !`, {
                    description: `N° ${receiptDetails.receiptNumber}`,
                });
                onClose();
            } else {
                toast.error('Erreur : ' + (result.error || 'Problème inconnu'));
            }
        } catch {
            toast.error('Erreur technique lors de l\'envoi.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative"
            onClick={onClose}
        >
            {/* Boutons d'actions centrés en haut */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 print:hidden flex gap-2">
                {/* Télécharger PDF */}
                <PDFDownloadLink
                    document={createQuittanceDocument(receiptDetails)}
                    fileName={filename}
                    className="inline-flex items-center gap-1 md:gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none shadow-md rounded-full text-xs md:text-sm px-3 md:px-4 h-9 md:h-10 font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {({ loading }) => (
                        <>
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline">Préparation...</span>
                                    <span className="sm:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="hidden sm:inline">Télécharger PDF</span>
                                    <span className="sm:hidden">PDF</span>
                                </>
                            )}
                        </>
                    )}
                </PDFDownloadLink>

                {/* Envoyer par Email */}
                <Button
                    onClick={(e) => { e.stopPropagation(); handleSendEmail(); }}
                    disabled={isSending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-md gap-1 md:gap-2 rounded-full text-xs md:text-sm px-3 md:px-4 h-9 md:h-10 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <>
                            <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">Envoi...</span>
                        </>
                    ) : (
                        <>
                            <Mail className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Envoyer par Email</span>
                            <span className="sm:hidden">Email</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Fermer (X) en haut à droite */}
            <Button
                onClick={onClose}
                variant="outline"
                className="absolute top-4 right-4 z-50 bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary border-none shadow-md rounded-full h-9 md:h-10 w-9 md:w-10 p-0 print:hidden"
            >
                <X className="w-4 h-4" />
            </Button>

            {/* Contenu principal */}
            <div
                className="relative w-full max-w-4xl bg-card rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-border print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 md:p-8 max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-muted/30 flex justify-center print:max-h-none print:overflow-visible print:p-0 print:bg-white">
                    <ReceiptPreview
                        tenant={{
                            tenant_name: data.tenant?.tenant_name || data.tenant?.name || 'Locataire',
                            address: data.property_address || data.tenant?.address || ''
                        }}
                        profile={{
                            company_name: data.profile?.company_name || data.profile?.full_name || 'Propriétaire',
                            company_address: data.profile?.company_address || '',
                            company_ninea: data.profile?.company_ninea || data.profile?.ninea || undefined,
                            logo_url: data.profile?.logo_url || undefined,
                            signature_url: data.profile?.signature_url || undefined
                        }}
                        amount={data.amount || 0}
                        month={data.month || new Date().getMonth() + 1}
                        year={data.year || new Date().getFullYear()}
                    />
                </div>

                {/* Pied de modal : Fermer sans envoyer */}
                <div className="flex items-center justify-center py-3 border-t border-border bg-card print:hidden">
                    <button
                        onClick={onClose}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-1.5 rounded-lg hover:bg-muted"
                    >
                        Fermer sans envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}
