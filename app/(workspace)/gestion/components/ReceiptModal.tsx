'use client';

import { useState, useEffect } from 'react';
import { Mail, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BlobProvider } from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

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
    balances?: {
        previousBalanceDate?: string;
        previousBalanceAmount?: number;
        currentBalanceDate?: string;
        currentBalanceAmount?: number;
        expectedAls?: number;
    };
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
    const [isSending, setIsSending] = useState(false);
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
        balances: data.balances,
    } : null;

    // (L'auto-save vers /api/save-receipt a été retiré car la route n'existe pas et causait une erreur 404 en console)

    if (!data || !receiptDetails) return null;

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-none md:max-w-3xl w-full h-[100dvh] md:h-auto p-0 overflow-hidden border-none bg-transparent shadow-none flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">Aperçu Quittance</DialogTitle>

                <BlobProvider document={createQuittanceDocument(receiptDetails)}>
                    {({ url, loading, error }) => (
                        /* Carte modale style premium */
                        <div
                            className="flex flex-col w-full h-full md:h-auto md:max-h-[85vh] bg-background md:bg-card md:rounded-2xl shadow-2xl md:border md:border-border overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ── En-tête ── */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 bg-background/50 backdrop-blur-md">
                                <Button
                                    onClick={handleSendEmail}
                                    disabled={isSending}
                                    size="sm"
                                    className="gap-2 h-9 px-3 font-semibold disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Envoi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            <span>Envoyer par Email</span>
                                        </>
                                    )}
                                </Button>
                                {url && (
                                    <a
                                        href={url}
                                        download={filename}
                                        className="inline-flex items-center gap-2 h-9 px-3 text-sm font-semibold rounded-md border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Télécharger</span>
                                    </a>
                                )}
                            </div>

                            {/* ── Aperçu du document ── */}
                            <div className="relative bg-muted/30 flex-1 md:h-[70vh] min-h-[50vh]">
                                {loading && (
                                    <div className="flex items-center justify-center h-full gap-3 text-muted-foreground text-sm">
                                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Génération du document…
                                    </div>
                                )}
                                {(error || (!loading && !url)) && (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                        Aperçu indisponible — utilisez le bouton Télécharger.
                                    </div>
                                )}
                                {url && (
                                    <iframe
                                        src={`${url}#view=FitH&pagemode=none&scrollbar=0&toolbar=0&statusbar=0&messages=0&navpanes=0`}
                                        title="Aperçu quittance"
                                        className="w-full h-full border-none bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                    />
                                )}
                            </div>

                            {/* ── Pied de carte ── */}
                            <div className="flex items-center justify-center py-2.5 border-t border-border bg-card shrink-0">
                                <button
                                    onClick={onClose}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-1.5 rounded-lg hover:bg-muted"
                                >
                                    Fermer sans envoyer
                                </button>
                            </div>
                        </div>
                    )}
                </BlobProvider>
            </DialogContent>
        </Dialog>
    );
}
