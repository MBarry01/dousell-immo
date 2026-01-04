'use client';

import { useState, useEffect } from 'react';
import { X, Download, Mail } from 'lucide-react';
import { ReceiptPreview } from './ReceiptPreview';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { createQuittanceDocument } from '@/components/pdf/QuittancePDF_v2';

interface ReceiptData {
    leaseId?: string; // Pour stockage automatique du PDF
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
    const [hasSaved, setHasSaved] = useState(false); // Eviter double save

    // Préparer les données pour le PDF (variable dérivée stable) - SAFE CHECK
    const receiptDetails = data ? {
        // IDs pour stockage automatique
        leaseId: data.leaseId,

        // Locataire
        tenantName: data.tenant?.tenant_name || data.tenant?.name || 'Locataire',
        tenantEmail: data.tenant?.email || '',
        tenantPhone: data.tenant?.phone || '',
        tenantAddress: data.property_address || '',

        // Montants
        amount: Number(data.amount) || 0,

        // Période
        periodMonth: `${String(data.month).padStart(2, '0')}/${data.year}`,
        periodStart: `01/${String(data.month).padStart(2, '0')}/${data.year}`,
        periodEnd: `30/${String(data.month).padStart(2, '0')}/${data.year}`,

        // Référence
        receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,

        // Propriétaire
        ownerName: data.profile?.company_name || data.profile?.full_name || 'Propriétaire',
        ownerAddress: data.profile?.company_address || '',
        ownerNinea: data.profile?.company_ninea || '',
        ownerLogo: data.profile?.logo_url || undefined,
        ownerSignature: data.profile?.signature_url || undefined,
        ownerEmail: data.profile?.company_email || undefined, // Email de config (priorité)
        ownerAccountEmail: data.userEmail || undefined, // Email du compte (fallback)

        // Propriété
        propertyAddress: data.property_address || 'Adresse non renseignée',
    } : null;

    // Auto-save effect
    useEffect(() => {
        const autoSave = async () => {
            // On ne sauvegarde que si on a un leaseId et que ce n'est pas déjà fait
            if (isOpen && receiptDetails?.leaseId && !hasSaved) {
                console.log("💾 Sauvegarde automatique de la quittance...", receiptDetails.leaseId);
                try {
                    setHasSaved(true); // Optimistic blocking
                    const response = await fetch('/api/save-receipt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(receiptDetails),
                    });

                    if (response.ok) {
                        console.log("✅ Quittance sauvegardée automatiquement");
                    } else {
                        console.error("Erreur sauvegarde auto", await response.text());
                    }
                } catch (e) {
                    console.error("Auto-save error", e);
                }
            }
        };
        autoSave();
    }, [isOpen, data, hasSaved]); // data change = new receipt usually

    if (!isOpen || !data || !receiptDetails) return null;


    // Nom de fichier pour le téléchargement
    const filename = `Quittance_${receiptDetails.tenantName.replace(/\s+/g, '_')}_${String(data.month).padStart(2, '0')}_${data.year}.pdf`;

    const handleSendEmail = async () => {
        if (isSending) return;
        setIsSending(true);

        try {
            console.log("📤 Envoi de la quittance...", receiptDetails);

            // Appeler l'API Next.js interne
            const response = await fetch('/api/send-receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(receiptDetails),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`Quittance envoyée à ${receiptDetails.tenantEmail} !`, {
                    description: `N° ${receiptDetails.receiptNumber}`,
                });
            } else {
                toast.error("Erreur : " + (result.error || "Problème inconnu"));
            }
        } catch (err) {
            console.error("❌ Erreur technique:", err);
            toast.error("Erreur technique lors de l'envoi.");
        } finally {
            setIsSending(false);
        }
    };


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative"
            onClick={onClose}
        >
            {/* Header Actions (Masqué à l'impression) */}
            {/* Boutons d'actions centrés */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 print:hidden flex gap-2">
                {/* Bouton Télécharger PDF avec @react-pdf/renderer */}
                <PDFDownloadLink
                    document={createQuittanceDocument(receiptDetails)}
                    fileName={filename}
                    className="inline-flex items-center gap-1 md:gap-2 bg-white text-black hover:bg-gray-100 border-none shadow-lg rounded-full text-xs md:text-sm px-3 md:px-4 h-9 md:h-10 font-medium transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    {({ loading }) => (
                        <>
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

                {/* Bouton Envoyer par Email */}
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSendEmail();
                    }}
                    disabled={isSending}
                    className="bg-[#F4C430] hover:bg-[#E5B020] text-black border-none shadow-lg gap-1 md:gap-2 rounded-full text-xs md:text-sm px-3 md:px-4 h-9 md:h-10 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <>
                            <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

            {/* Bouton Fermer à droite */}
            <Button
                onClick={onClose}
                variant="outline"
                className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg rounded-full h-9 md:h-10 w-9 md:w-10 p-0 print:hidden"
            >
                <X className="w-4 h-4" />
            </Button>

            <div
                className="relative w-full max-w-4xl bg-gray-900 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none print:bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 md:p-8 max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-gray-100 flex justify-center print:max-h-none print:overflow-visible print:p-0 print:bg-white">
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
            </div>
        </div>
    );
}
