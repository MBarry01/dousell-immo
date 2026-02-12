'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createInventoryReport, getLeasesForInventory } from '../actions';
import { PropertyType, PROPERTY_TYPE_LABELS } from '../types';
import { useTheme } from "@/components/theme-provider";

type Lease = {
    id: string;
    tenant_name: string;
    property_address: string;
    status: string;
};

const PROPERTY_ICONS: Record<PropertyType, string> = {
    'chambre': '🛏️',
    'studio': '🏠',
    'f2': '🏢',
    'f3': '🏢',
    'f4': '🏢',
    'villa': '🏡',
    'custom': '⚙️',
};

export default function NewInventoryReportPage() {
    const { isDark } = useTheme();
    const router = useRouter();
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
    const [reportType, setReportType] = useState<'entry' | 'exit'>('entry');
    const [propertyType, setPropertyType] = useState<PropertyType>('studio');

    useEffect(() => {
        loadLeases();
    }, []);

    const loadLeases = async () => {
        const result = await getLeasesForInventory();
        if (result.error) {
            toast.error(result.error);
        } else {
            setLeases(result.data);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!selectedLeaseId) {
            toast.error('Veuillez sélectionner un bail');
            return;
        }

        setCreating(true);
        const result = await createInventoryReport({
            leaseId: selectedLeaseId,
            type: reportType,
            propertyType: propertyType
        });

        if (result.error) {
            toast.error(result.error);
            setCreating(false);
        } else if (result.data) {
            toast.success('État des lieux créé !');
            router.push(`/compte/etats-lieux/${result.data.id}`);
        }
    };

    const selectedLease = leases.find(l => l.id === selectedLeaseId);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-[#F4C430] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/etats-lieux" className={`transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nouvel État des Lieux</h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Sélectionnez le bail et le type de bien</p>
                </div>
            </div>

            {/* Step 1: Select Lease */}
            <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Home className="w-4 h-4 text-[#F4C430]" />
                    1. Sélectionner le bail
                </h2>

                {leases.length === 0 ? (
                    <div className={`rounded-lg p-4 text-center ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Aucun bail trouvé</p>
                        <Link href="/gestion-locative" className="text-[#F4C430] text-sm hover:underline mt-2 block">
                            Créer un bail
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {leases.map((lease) => (
                            <button
                                key={lease.id}
                                onClick={() => setSelectedLeaseId(lease.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedLeaseId === lease.id
                                    ? 'bg-[#F4C430]/10 border-[#F4C430] text-white'
                                    : isDark
                                        ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400'
                                    }`}
                            >
                                <p className="font-medium">{lease.property_address || 'Adresse non renseignée'}</p>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{lease.tenant_name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 2: Select Property Type */}
            <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Building className="w-4 h-4 text-[#F4C430]" />
                    2. Type de bien
                </h2>
                <p className={`text-xs -mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Le formulaire s'adapte automatiquement au type de bien
                </p>

                <div className="grid grid-cols-3 gap-2">
                    {(['chambre', 'studio', 'f2', 'f3', 'villa'] as PropertyType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setPropertyType(type)}
                            className={`p-3 rounded-lg border text-center transition-all ${propertyType === type
                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                : isDark
                                    ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                        >
                            <span className="text-xl block mb-1">{PROPERTY_ICONS[type]}</span>
                            <span className="text-xs font-medium">{PROPERTY_TYPE_LABELS[type]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 3: Select Entry/Exit Type */}
            <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>3. Type d'état des lieux</h2>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setReportType('entry')}
                        className={`p-4 rounded-xl border text-center transition-all ${reportType === 'entry'
                            ? 'bg-blue-500/20 border-blue-500 text-white'
                            : isDark
                                ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                    >
                        <span className="text-2xl block mb-2">🔑</span>
                        <span className="font-medium">Entrée</span>
                        <p className="text-xs mt-1 opacity-70">Remise des clés</p>
                    </button>

                    <button
                        onClick={() => setReportType('exit')}
                        className={`p-4 rounded-xl border text-center transition-all ${reportType === 'exit'
                            ? 'bg-orange-500/20 border-orange-500 text-white'
                            : isDark
                                ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                            }`}
                    >
                        <span className="text-2xl block mb-2">🚪</span>
                        <span className="font-medium">Sortie</span>
                        <p className="text-xs mt-1 opacity-70">Départ du locataire</p>
                    </button>
                </div>
            </div>

            {/* Summary & Create */}
            {selectedLease && (
                <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-xl p-4">
                    <p className="text-sm text-[#F4C430] mb-1">Récapitulatif</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedLease.property_address}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {selectedLease.tenant_name} • {PROPERTY_TYPE_LABELS[propertyType]} • {reportType === 'entry' ? "Entrée" : 'Sortie'}
                    </p>
                </div>
            )}

            <Button
                onClick={handleCreate}
                disabled={!selectedLeaseId || creating}
                className="w-full h-12 bg-[#F4C430] hover:bg-[#D4A420] text-black font-semibold"
            >
                {creating ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                    </>
                ) : (
                    <>
                        Commencer l'état des lieux
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </div>
    );
}
