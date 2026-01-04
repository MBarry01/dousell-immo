/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface ReceiptPreviewProps {
    tenant: {
        tenant_name: string;
        address: string;
    };
    profile: {
        company_name: string;
        company_address: string;
        company_ninea?: string;
        logo_url?: string;
        signature_url?: string;
    };
    amount: string | number;
    month: string | number;
    year?: string | number;
}

export function ReceiptPreview({ tenant, profile, amount, month, year = 2025 }: ReceiptPreviewProps) {
    const formattedAmount = Number(amount).toLocaleString('fr-FR');
    const today = new Date();
    const currentYear = year || today.getFullYear();
    const todayFormatted = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div
            id="printable-area"
            className="bg-white text-black p-12 font-sans text-[10pt] leading-snug w-[210mm] min-h-[297mm]"
        >

            {/* 1. EN-TETE : DISCRET ET PRO */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-1">
                    {profile?.logo_url && (
                        <img src={profile.logo_url} className="h-10 w-auto object-contain mb-2" alt="Logo" />
                    )}
                    <p className="font-bold text-xs uppercase text-gray-500">{profile?.company_name || "BARAKA IMMO"}</p>
                    <p className="text-[9pt] text-gray-600 max-w-[200px] leading-tight">{profile?.company_address}</p>
                    <p className="text-[8pt] text-gray-400">NINEA : {profile?.company_ninea || "Non renseigné"}</p>
                </div>
                <div className="text-right text-[8pt] text-gray-500">
                    Document transmis le {todayFormatted}
                </div>
            </div>

            {/* 2. TITRE : FIN ET SOBRE */}
            <div className="text-center mb-10">
                <h2 className="text-base font-medium tracking-[0.2em] uppercase border-b border-gray-200 pb-2 text-gray-800">
                    Quittance de loyer
                </h2>
                <p className="text-[9pt] text-gray-400 mt-1 italic">Période du 01/{String(month).padStart(2, '0')}/{currentYear} au 30/{String(month).padStart(2, '0')}/{currentYear}</p>
            </div>

            {/* 3. BLOC REFERENCES : ALIGNÉ ET PROPRE */}
            <div className="flex justify-end mb-16">
                <div className="w-[60%] border-l-4 border-gray-100 pl-4 py-2">
                    <p className="text-[8pt] font-semibold text-gray-400 uppercase tracking-widest mb-2">Destinataire</p>
                    <p className="font-semibold text-gray-500 mb-1">{tenant.tenant_name}</p>
                    <p className="text-gray-600 leading-tight text-[9pt]">
                        Logement situé au :<br />
                        {tenant.address || "Adresse non renseignée"}
                    </p>
                </div>
            </div>

            {/* 4. TABLEAU : STYLE ADMINISTRATIF (LIGNES FINES) */}
            <div className="mb-16">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-[8pt] text-gray-500 uppercase">
                            <th className="text-left py-2 font-medium italic">Désignation</th>
                            <th className="text-right py-2 font-medium italic">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10pt]">
                        <tr className="border-b border-gray-100">
                            <td className="py-4 text-gray-700 font-medium">Loyer principal et charges provisionnelles</td>
                            <td className="py-4 text-right text-gray-500 font-bold">{formattedAmount} FCFA</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold">
                            <td className="py-3 px-2 uppercase text-gray-700 text-[9pt]">Total net à payer</td>
                            <td className="py-3 px-2 text-right text-gray-500 text-base">{formattedAmount} FCFA</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 5. CADRE DE VALIDATION : INTÉGRÉ ET SOBRE */}
            <div className="flex justify-end mt-16 signature-block">
                <div className="border border-gray-200 p-3 w-52 rounded-sm bg-gray-50/50">
                    <p className="text-[7pt] font-bold text-gray-400 uppercase mb-2 text-center tracking-wide">Validation</p>
                    <p className="text-[8pt] mb-2">Acquittée le : <span className="font-bold text-gray-500">{todayFormatted}</span></p>
                    <div className="mt-2 flex flex-col items-center">
                        {profile?.signature_url ? (
                            <img src={profile.signature_url} className="h-12 mix-blend-multiply opacity-80" alt="Signature" />
                        ) : (
                            <div className="h-12 flex items-center justify-center text-gray-300 italic text-[7pt]">Cachet</div>
                        )}
                        <p className="text-[7pt] font-bold mt-1 text-gray-600">{profile?.company_name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
