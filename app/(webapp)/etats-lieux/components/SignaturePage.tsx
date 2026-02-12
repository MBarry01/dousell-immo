'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Check, Download, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getInventoryReportById, signInventoryReport, getOwnerSignature } from '../actions';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { useTheme } from '@/components/workspace/providers/theme-provider';

interface SignaturePageProps {
    reportId: string;
}

export function SignaturePage({ reportId }: SignaturePageProps) {
    const { isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [savedOwnerSignature, setSavedOwnerSignature] = useState<string | null>(null);

    const [ownerSignature, setOwnerSignature] = useState('');
    const [tenantSignature, setTenantSignature] = useState('');

    useEffect(() => {
        loadReport();
    }, [reportId]);

    const loadReport = async () => {
        // Fetch report and owner's saved signature in parallel
        const [reportResult, signatureResult] = await Promise.all([
            getInventoryReportById(reportId),
            getOwnerSignature()
        ]);

        if (reportResult.error) {
            toast.error(reportResult.error);
            router.push('/etats-lieux');
            return;
        }

        setReport(reportResult.data);

        // If report already has signatures, use them
        if (reportResult.data?.owner_signature) {
            setOwnerSignature(reportResult.data.owner_signature);
        } else if (signatureResult.signature_url) {
            // Otherwise use saved signature from profile
            setOwnerSignature(signatureResult.signature_url);
            setSavedOwnerSignature(signatureResult.signature_url);
        }

        setTenantSignature(reportResult.data?.tenant_signature || '');
        setLoading(false);
    };

    const handleSign = async () => {
        if (!ownerSignature || !tenantSignature) {
            toast.error('Les deux signatures sont requises');
            return;
        }

        setSaving(true);

        const result = await signInventoryReport(reportId, {
            owner_signature: ownerSignature,
            tenant_signature: tenantSignature
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('État des lieux signé !');
            router.push(`/compte/etats-lieux/${reportId}/pdf`);
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    const isAlreadySigned = report?.status === 'signed';

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/compte/etats-lieux/${reportId}`} className={`transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Signatures</h1>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {report?.lease?.property_address} • {report?.lease?.tenant_name}
                    </p>
                </div>
            </div>

            {isAlreadySigned ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                    <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Document signé</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Cet état des lieux a été signé le {new Date(report.signed_at).toLocaleDateString('fr-FR')}
                    </p>
                    <Button asChild className="bg-[#F4C430] hover:bg-[#D4A420] text-black">
                        <Link href={`/compte/etats-lieux/${reportId}/pdf`}>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger le PDF
                        </Link>
                    </Button>
                </div>
            ) : (
                <>
                    {/* Info */}
                    <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-xl p-4">
                        <p className="text-sm text-[#F4C430]">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Votre signature est pré-remplie. Le locataire signe sur place lors de l'état des lieux.
                        </p>
                    </div>

                    {/* Owner Signature */}
                    <div className={`border rounded-xl p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                        {savedOwnerSignature && ownerSignature === savedOwnerSignature && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3 bg-emerald-500/10 rounded-lg px-3 py-2">
                                <UserCheck className="w-4 h-4" />
                                ✅ Signature importée depuis votre configuration
                            </div>
                        )}
                        <SignatureCanvas
                            label="✍️ Signature du Propriétaire (ou mandataire)"
                            existingSignature={ownerSignature}
                            onSave={setOwnerSignature}
                        />
                    </div>

                    {/* Tenant Signature */}
                    <div className={`border rounded-xl p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-2 text-blue-400 text-sm mb-3 bg-blue-500/10 rounded-lg px-3 py-2">
                            <FileText className="w-4 h-4" />
                            👇 Passez l'appareil au locataire pour signature
                        </div>
                        <SignatureCanvas
                            label="✍️ Signature du Locataire"
                            existingSignature={tenantSignature}
                            onSave={setTenantSignature}
                        />
                    </div>

                    {/* Sign Button */}
                    <Button
                        onClick={handleSign}
                        disabled={saving || !ownerSignature || !tenantSignature}
                        className="w-full h-12 bg-[#F4C430] hover:bg-[#D4A420] text-black font-semibold"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Validation...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Valider et Générer le PDF
                            </>
                        )}
                    </Button>
                </>
            )}
        </div>
    );
}
