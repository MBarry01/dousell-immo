'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getInventoryReportById, getAgencyBranding } from '../../actions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../../theme-provider';

interface PDFPageProps {
    reportId: string;
}

// ... (CONDITION_MAP can be kept inside or outside, assuming it was outside in previous version)
const CONDITION_MAP: Record<string, { short: string; label: string }> = {
    'bon': { short: 'TB', label: 'Très Bon' },
    'moyen': { short: 'B', label: 'Bon' },
    'mauvais': { short: 'M', label: 'Moyen' },
    'absent': { short: 'D', label: 'Dégradé/Absent' },
};

export function PDFPreview({ reportId }: PDFPageProps) {
    const { isDark } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [agencyBranding, setAgencyBranding] = useState<{ name: string | null, logo: string | null } | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [reportId]);

    const loadData = async () => {
        const [reportResult, brandingResult] = await Promise.all([
            getInventoryReportById(reportId),
            getAgencyBranding()
        ]);

        if (reportResult.error) {
            toast.error(reportResult.error);
            router.push('/etats-lieux');
            return;
        }

        if (reportResult.data?.status !== 'signed') {
            toast.error('Le rapport doit être signé avant de générer le PDF');
            router.push(`/compte/etats-lieux/${reportId}/sign`);
            return;
        }

        if (brandingResult && !('error' in brandingResult)) {
            setAgencyBranding({
                name: brandingResult.agency_name,
                logo: brandingResult.logo_url
            });
        }

        setReport(reportResult.data);
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const getCityFromAddress = (address: string | undefined) => {
        if (!address) return null;
        // Try comma split first (Standard format: Address, City)
        if (address.includes(',')) {
            const part = address.split(',').pop()?.trim();
            if (part && part.length > 2) return part;
        }

        // Contextual Fallbacks for Senegal
        const lower = address.toLowerCase();
        if (lower.includes('dakar')) return 'Dakar';
        if (lower.includes('saly')) return 'Saly';
        if (lower.includes('thies') || lower.includes('thiès')) return 'Thiès';
        if (lower.includes('saint-louis')) return 'Saint-Louis';
        if (lower.includes('mbour')) return 'Mbour';

        return null;
    };

    if (!report) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    const reportDate = report?.report_date ? new Date(report.report_date) : new Date();
    const signedDate = report?.signed_at ? new Date(report.signed_at) : new Date();

    const hasPhotos = report?.rooms?.some((r: any) => r.items?.some((i: any) => i.photos?.length > 0));

    return (
        <div className={`min-h-screen p-6 print:p-0 print:bg-white ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-content, #printable-content * {
                        visibility: visible;
                    }
                    #printable-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                        padding: 15mm !important; /* Standard A4 Matrix */
                    }
                    /* Ensure images are printed */
                    img {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            {/* Header Actions - Hidden on print */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link href="/etats-lieux" className={`flex items-center gap-2 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                    <ArrowLeft className="w-4 h-4" /> Retour
                </Link>
                <Button onClick={handlePrint} className="bg-[#F4C430] hover:bg-[#D4A420] text-black">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimer / Enregistrer PDF
                </Button>
            </div>

            {/* A4 Page Preview */}
            <div
                id="printable-content"
                ref={printRef}
                className="bg-white text-black rounded-xl p-8 print:p-6 print:rounded-none max-w-4xl mx-auto print:max-w-none text-sm shadow-2xl print:shadow-none"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {/* Agency Header - Realigned Right */}
                <div className="hidden print:flex justify-between items-start border-b border-black pb-4 mb-4">
                    {/* Logo (Left) */}
                    <div className="w-1/3">
                        {agencyBranding?.logo && (
                            <img
                                src={agencyBranding.logo}
                                alt="Logo Agence"
                                className="h-16 w-auto object-contain object-left"
                            />
                        )}
                    </div>

                    {/* Agency Name & Type (Right) */}
                    <div className="w-2/3 text-right">
                        <p className="font-bold text-xl uppercase tracking-tight">
                            {agencyBranding?.name || 'DOUSSEL IMMO'}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                            Gestion Locative & Immobilière
                        </p>
                        <div className="inline-block border border-gray-400 px-3 py-1 mt-1">
                            <p className="font-bold text-sm uppercase">
                                {report?.type === 'entry' ? "État des Lieux d'Entrée" : "État des Lieux de Sortie"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Document Subtitle (Replaces old Title Header) */}
                <div className="bg-gray-100 text-center py-2 mb-6 border-y border-gray-300">
                    <h2 className="font-bold uppercase tracking-wide text-xs">
                        Constat contradictoire de l'état du logement
                    </h2>
                </div>

                {/* Property Description */}
                <p className="font-semibold mb-4 text-sm">
                    {report?.type === 'entry' ? "ENTRÉE" : "SORTIE"} du locataire pour le logement sis à :<br />
                    <span className="font-normal">{report?.lease?.property_address}</span>
                </p>

                {/* Date and Info Row */}
                <div className="mb-6 space-y-2">
                    <p>
                        <strong>Date du constat :</strong>{' '}
                        <span className="border-b border-black inline-block min-w-[200px]">
                            {format(reportDate, 'd MMMM yyyy', { locale: fr })}
                        </span>
                    </p>

                    <p>
                        <strong>Locataire :</strong>{' '}
                        <span className="border-b border-black inline-block min-w-[200px]">
                            {report?.lease?.tenant_name}
                        </span>
                    </p>
                </div>

                {/* Meter Readings */}
                <div className="mb-6 flex flex-wrap gap-x-8 gap-y-2">
                    <p>
                        <strong>Relevé compteur électricité :</strong>{' '}
                        <span className="border-b border-black inline-block min-w-[80px] text-center">
                            {report?.meter_readings?.electricity || '______'}
                        </span>{' '}
                        kWh
                    </p>
                    <p>
                        <strong>Relevé compteur eau :</strong>{' '}
                        <span className="border-b border-black inline-block min-w-[80px] text-center">
                            {report?.meter_readings?.water || '______'}
                        </span>{' '}
                        m³
                    </p>
                </div>

                {/* Legend */}
                <div className="mb-4 text-xs bg-gray-50 p-2 rounded">
                    <strong>Légende :</strong> TB = Très Bon | B = Bon | M = Moyen | D = Dégradé/Absent
                </div>

                {/* Rooms Tables */}
                {report?.rooms?.map((room: any, roomIndex: number) => (
                    <div key={roomIndex} className="mb-6 break-inside-avoid">
                        <h3 className="font-bold bg-gray-100 border border-gray-300 px-3 py-2 uppercase text-sm">
                            {room.name}
                        </h3>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-2 py-1 text-left font-medium w-1/3">
                                        Élément
                                    </th>
                                    <th className="border border-gray-300 px-1 py-1 text-center font-medium w-8">TB</th>
                                    <th className="border border-gray-300 px-1 py-1 text-center font-medium w-8">B</th>
                                    <th className="border border-gray-300 px-1 py-1 text-center font-medium w-8">M</th>
                                    <th className="border border-gray-300 px-1 py-1 text-center font-medium w-8">D</th>
                                    <th className="border border-gray-300 px-2 py-1 text-left font-medium">
                                        Commentaires
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {room.items?.map((item: any, itemIndex: number) => {
                                    const conditionData = CONDITION_MAP[item.condition] || { short: '' };
                                    return (
                                        <tr key={itemIndex}>
                                            <td className="border border-gray-300 px-2 py-1">{item.name}</td>
                                            <td className="border border-gray-300 px-1 py-1 text-center">
                                                {conditionData.short === 'TB' ? '✓' : ''}
                                            </td>
                                            <td className="border border-gray-300 px-1 py-1 text-center">
                                                {conditionData.short === 'B' ? '✓' : ''}
                                            </td>
                                            <td className="border border-gray-300 px-1 py-1 text-center">
                                                {conditionData.short === 'M' ? '✓' : ''}
                                            </td>
                                            <td className="border border-gray-300 px-1 py-1 text-center">
                                                {conditionData.short === 'D' ? '✓' : ''}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600">
                                                {item.comment || ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* Commentaires Contradictoires */}
                <div className="mb-6">
                    <h3 className="font-bold uppercase mb-2">Commentaires Contradictoires :</h3>
                    <div className="border border-gray-300 min-h-[60px] p-2 text-sm">
                        {report?.general_comments || ''}
                    </div>
                </div>

                {/* Signatures Section - Atomic Block to prevent splitting */}
                <div className="mt-8 pt-4 break-inside-avoid bg-white">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <p className="mb-4 font-bold">
                                Clefs remises au nombre de : <span className="border-b border-black inline-block w-16"></span>
                            </p>
                            <p className="font-bold">
                                Fait à : <span className="border-b border-black inline-block w-32 px-2 text-center">{getCityFromAddress(report?.lease?.property_address) || '....................'}</span>
                                , le {format(new Date(), 'd MMMM yyyy', { locale: fr })}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-black my-4"></div>

                    <div className="grid grid-cols-2 gap-16 mt-8">
                        <div className="text-center">
                            <p className="font-bold mb-4">Le Bailleur (ou son mandataire)</p>
                            <div className="h-32 border border-gray-200 rounded flex flex-col items-center justify-center bg-gray-50 relative">
                                <p className="text-[10px] text-gray-400 absolute top-2">Lu et approuvé</p>
                                {report?.owner_signature ? (
                                    <img src={report.owner_signature} alt="Signature Proprio" className="h-full w-auto object-contain p-2" />
                                ) : (
                                    <p className="text-xs text-gray-400 italic mt-4">(En attente)</p>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold mb-4">Le(s) Locataire(s)</p>
                            <div className="h-32 border border-gray-200 rounded flex flex-col items-center justify-center bg-gray-50 relative">
                                <p className="text-[10px] text-gray-400 absolute top-2">Lu et approuvé</p>
                                {report?.tenant_signature ? (
                                    <img src={report.tenant_signature} alt="Signature Locataire" className="h-full w-auto object-contain p-2" />
                                ) : (
                                    <p className="text-xs text-gray-400 italic mt-4">(En attente)</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photo Appendix */}
                {hasPhotos && (
                    <div className="break-before-page mt-8">
                        <h2 className="text-sm font-bold uppercase border-b border-black pb-2 mb-4">
                            Annexe : Photos de l'État des Lieux
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {report?.rooms?.map((room: any) =>
                                room.items?.map((item: any) =>
                                    item.photos?.map((photoUrl: string, index: number) => (
                                        <div key={`${room.name}-${item.name}-${index}`} className="border border-gray-200 p-2 break-inside-avoid bg-white">
                                            <div className="aspect-video w-full bg-gray-50 mb-2 overflow-hidden flex items-center justify-center rounded">
                                                <img
                                                    src={photoUrl}
                                                    alt={`${item.name} - ${room.name}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="px-1">
                                                <p className="text-xs font-bold truncate">{room.name} - {item.name}</p>
                                                <p className="text-[10px] text-gray-500">Photo n°{index + 1}</p>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                    <span>Document généré par {agencyBranding?.name || 'Doussel Immo'}</span>
                    <span>Réf: {report?.id?.slice(0, 8)}</span>
                </div>
            </div>

            {/* Success Banner - Hidden on print */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 print:hidden">
                <Check className="w-5 h-5 text-emerald-400" />
                <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    État des lieux signé. Cliquez sur "Imprimer" puis "Enregistrer en PDF" pour télécharger.
                </p>
            </div>
        </div>
    );
}
