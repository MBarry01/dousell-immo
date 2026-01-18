'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Building, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PROPERTY_TEMPLATES, PROPERTY_TYPE_LABELS, type PropertyType } from '../types';
import { getAgencyBranding } from '../actions';

const PROPERTY_ICONS: Record<PropertyType, string> = {
    'chambre': '🛏️',
    'studio': '🏠',
    'f2': '🏢',
    'f3': '🏢',
    'f4': '🏢',
    'villa': '🏡',
    'custom': '⚙️',
};

// Map items to string for the blank form
const getRoomItems = (type: PropertyType) => {
    const rooms = PROPERTY_TEMPLATES[type] || PROPERTY_TEMPLATES['f2'];
    return rooms.map(room => ({
        name: room.name,
        items: room.items.map(item => item.name)
    }));
};

export default function BlankPDFPage() {
    const printRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<PropertyType>('f2');
    const [agencyBranding, setAgencyBranding] = useState<{ name: string | null, logo: string | null } | null>(null);

    useEffect(() => {
        const fetchBranding = async () => {
            const result = await getAgencyBranding();
            if (result && !('error' in result)) {
                setAgencyBranding({
                    name: result.agency_name,
                    logo: result.logo_url
                });
            }
        };
        fetchBranding();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const rooms = getRoomItems(selectedType);

    return (
        <div className="space-y-6">
            {/* Header - Hidden on print */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/etats-lieux" className="text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Formulaire Vierge</h1>
                        <p className="text-sm text-white/60">État des lieux à imprimer</p>
                    </div>
                </div>
                <Button onClick={handlePrint} className="bg-[#F4C430] hover:bg-[#D4A420] text-black">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimer / Télécharger PDF
                </Button>
            </div>

            {/* Type Selector - Hidden on print */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 print:hidden space-y-3">
                <div className="flex items-center gap-2 text-white font-medium">
                    <Building className="w-4 h-4 text-[#F4C430]" />
                    <span>Choisir le type de bien pour le modèle :</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${selectedType === type
                                ? 'bg-[#F4C430] border-[#F4C430] text-black font-medium'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                        >
                            <span>{PROPERTY_ICONS[type]}</span>
                            {PROPERTY_TYPE_LABELS[type]}
                            {selectedType === type && <Check className="w-3 h-3 ml-1" />}
                        </button>
                    ))}
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-sm text-blue-400">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Le formulaire ci-dessous s'adapte automatiquement au type de bien sélectionné ({PROPERTY_TYPE_LABELS[selectedType]}).
                    </p>
                </div>
            </div>

            {/* PDF Content - Blank Professional Template */}
            <div
                id="print-content"
                ref={printRef}
                className="bg-white text-black rounded-xl p-6 print:p-0 print:rounded-none max-w-4xl mx-auto print:max-w-none text-xs print:w-full print:absolute print:top-0 print:left-0"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {/* Agency Header (Visible on print) */}
                <div className="hidden print:flex justify-between items-start border-b border-black pb-4 mb-4">
                    {/* Logo à gauche */}
                    <div className="w-1/3">
                        {agencyBranding?.logo && (
                            <img
                                src={agencyBranding.logo}
                                alt="Logo Agence"
                                className="h-16 w-auto object-contain object-left"
                            />
                        )}
                    </div>

                    {/* Informations à droite */}
                    <div className="w-2/3 text-right">
                        <p className="font-bold text-xl uppercase tracking-tight">
                            {agencyBranding?.name || 'DOUSSEL IMMO'}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                            Gestion Locative & Immobilière
                        </p>
                        <div className="inline-block border border-gray-400 px-3 py-1 mt-1">
                            <p className="font-bold text-sm uppercase">{PROPERTY_TYPE_LABELS[selectedType]}</p>
                        </div>
                    </div>
                </div>

                {/* Title Header */}
                <div className="bg-gray-200 text-center py-2 mb-6 border-y border-gray-400">
                    <h1 className="text-lg font-bold uppercase tracking-widest">
                        État des Lieux et Inventaire
                    </h1>
                </div>

                {/* Property Info - Blank fields */}
                <div className="mb-6 space-y-3 text-sm">
                    <p>
                        <strong>Type :</strong>{' '}
                        <span className="inline-block mr-4">☐ Entrée</span>
                        <span className="inline-block">☐ Sortie</span>
                    </p>
                    <p>
                        <strong>Adresse du bien :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '350px' }}>
                            &nbsp;
                        </span>
                    </p>
                    <p>
                        <strong>Nom du locataire :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '250px' }}>
                            &nbsp;
                        </span>
                    </p>
                    <p>
                        <strong>Date de l'état des lieux :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '150px' }}>
                            &nbsp;
                        </span>
                    </p>
                </div>

                {/* Meter Readings */}
                <div className="mb-4 flex flex-wrap gap-x-6 text-sm">
                    <p>
                        <strong>Compteur électricité :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '80px' }}>
                            &nbsp;
                        </span>{' '}
                        kWh
                    </p>
                    <p>
                        <strong>Compteur eau :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '80px' }}>
                            &nbsp;
                        </span>{' '}
                        m³
                    </p>
                </div>

                {/* Legend */}
                <div className="mb-3 text-xs bg-gray-100 p-2">
                    <strong>Légende :</strong> TB = Très Bon | B = Bon | M = Moyen | D = Dégradé/Absent
                </div>

                {/* Rooms Tables */}
                {rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="mb-4 break-inside-avoid">
                        <h3 className="font-bold bg-gray-200 border border-gray-400 px-2 py-1 uppercase text-xs">
                            {room.name}
                        </h3>
                        <table className="w-full border-collapse border border-gray-400 text-xs">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 px-2 py-1 text-left font-medium" style={{ width: '30%' }}>
                                        Élément
                                    </th>
                                    <th className="border border-gray-400 px-1 py-1 text-center font-medium" style={{ width: '8%' }}>TB</th>
                                    <th className="border border-gray-400 px-1 py-1 text-center font-medium" style={{ width: '8%' }}>B</th>
                                    <th className="border border-gray-400 px-1 py-1 text-center font-medium" style={{ width: '8%' }}>M</th>
                                    <th className="border border-gray-400 px-1 py-1 text-center font-medium" style={{ width: '8%' }}>D</th>
                                    <th className="border border-gray-400 px-2 py-1 text-left font-medium">
                                        Commentaires
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {room.items.map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                        <td className="border border-gray-400 px-2 py-1">{item}</td>
                                        <td className="border border-gray-400 px-1 py-1 text-center">☐</td>
                                        <td className="border border-gray-400 px-1 py-1 text-center">☐</td>
                                        <td className="border border-gray-400 px-1 py-1 text-center">☐</td>
                                        <td className="border border-gray-400 px-1 py-1 text-center">☐</td>
                                        <td className="border border-gray-400 px-2 py-1">&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}

                {/* Inventaire Section */}
                <div className="mb-4 break-inside-avoid">
                    <h3 className="font-bold uppercase mb-2 text-sm">Inventaire du mobilier :</h3>
                    <table className="w-full border-collapse border border-gray-400 text-xs">
                        <tbody>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <tr key={i}>
                                    <td className="border border-gray-400 px-2 py-2">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Commentaires Contradictoires */}
                <div className="mb-4">
                    <h3 className="font-bold uppercase mb-2 text-sm">Commentaires Contradictoires :</h3>
                    <div className="border border-gray-400 min-h-[50px] p-2">&nbsp;</div>
                </div>

                {/* Keys and Final Info */}
                <div className="mb-4 space-y-2 text-sm">
                    <p>
                        <strong>Clefs remises au nombre de :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '40px' }}>
                            &nbsp;
                        </span>
                    </p>
                    <p>
                        <strong>Fait à :</strong>{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '120px' }}>
                            &nbsp;
                        </span>
                        , le{' '}
                        <span className="border-b border-black inline-block" style={{ minWidth: '120px' }}>
                            &nbsp;
                        </span>
                    </p>
                </div>

                {/* Signatures Section */}
                <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-gray-400">
                    <div className="text-center">
                        <p className="font-bold mb-1 text-sm">Le Bailleur (ou son mandataire)</p>
                        <p className="text-xs text-gray-500 mb-2">Lu et approuvé</p>
                        <div className="border border-gray-400 h-20">&nbsp;</div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-1 text-sm">Le(s) Locataire(s)</p>
                        <p className="text-xs text-gray-500 mb-2">Lu et approuvé</p>
                        <div className="border border-gray-400 h-20">&nbsp;</div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-2 border-t border-gray-200 text-center text-xs text-gray-400">
                    <span>Formulaire Doussel Immo - {PROPERTY_TYPE_LABELS[selectedType]}</span>
                </div>
            </div>
        </div>
    );
}
