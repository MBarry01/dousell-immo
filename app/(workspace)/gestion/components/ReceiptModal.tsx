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

    // Reset hasSaved quand la modal se ferme
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
        /* Overlay */
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative"
            onClick={onClose}
        >
            {/* Carte modale — hauteur limitée à 90vh pour rester visible */}
            <div
                className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:bg-white print:max-h-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── En-tête de la carte ── */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0 print:hidden">
                    {/* Boutons d'action */}
                    <div className="flex items-center gap-2">
                        <PDFDownloadLink
                            document={createQuittanceDocument(receiptDetails)}
                            fileName={filename}
                            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm px-3 h-9 font-medium transition-colors"
                        >
                            {({ loading }) => loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Préparation...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Télécharger PDF</span>
                                </>
                            )}
                        </PDFDownloadLink>

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
                    </div>

                    {/* Bouton fermer */}
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* ── Aperçu du document (scrollable) ── */}
                <div className="flex-1 overflow-y-auto bg-muted/30 flex justify-center p-4 print:p-0 print:overflow-visible print:bg-white">
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

                {/* ── Pied de carte ── */}
                <div className="flex items-center justify-center py-2.5 border-t border-border bg-card shrink-0 print:hidden">
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
