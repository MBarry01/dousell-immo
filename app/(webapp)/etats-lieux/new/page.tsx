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
    'appartement': '🏢',
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
    const [propertyType, setPropertyType] = useState<PropertyType>('appartement');
    const [roomsCount, setRoomsCount] = useState(1);

    useEffect(() => {
        const loadLeases = async () => {
            const result = await getLeasesForInventory();
            if (result.error) {
                toast.error(result.error);
            } else {
                setLeases(result.data);
            }
            setLoading(false);
        };

        loadLeases();
    }, []);

    const handleCreate = async () => {
        if (!selectedLeaseId) {
            toast.error('Veuillez sélectionner un bail');
            return;
        }

        setCreating(true);
        const result = await createInventoryReport({
            leaseId: selectedLeaseId,
            type: reportType,
            propertyType: propertyType,
            roomsCount: roomsCount
        });

        if (result.error) {
            toast.error(result.error);
            setCreating(false);
        } else if (result.data) {
            toast.success('État des lieux créé !');
            router.push(`/etats-lieux/${result.data.id}`);
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
                    Le formulaire s&apos;adapte automatiquement au type de bien
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(['chambre', 'studio', 'appartement', 'villa'] as PropertyType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setPropertyType(type);
                                if (type !== 'appartement' && type !== 'villa') setRoomsCount(1);
                            }}
                            className={`p-3 rounded-xl border text-center transition-all shadow-sm ${propertyType === type
                                ? 'bg-primary border-primary text-primary-foreground font-semibold ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                                : isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-2xl block mb-1.5">{PROPERTY_ICONS[type]}</span>
                            <span className="text-xs">{PROPERTY_TYPE_LABELS[type]}</span>
                        </button>
                    ))}
                </div>

                {/* Number of rooms selector (only for adaptable types) */}
                {(propertyType === 'appartement' || propertyType === 'villa') && (
                    <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div>
                            <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Nombre de chambres</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Pièces générées dans l&apos;état des lieux</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${isDark ? 'border-slate-600 hover:bg-slate-700 text-white' : 'border-gray-300 hover:bg-gray-200 text-gray-700'}`}
                            >-</button>
                            <span className={`w-4 text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{roomsCount}</span>
                            <button
                                onClick={() => setRoomsCount(Math.min(10, roomsCount + 1))}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${isDark ? 'border-slate-600 hover:bg-slate-700 text-white' : 'border-gray-300 hover:bg-gray-200 text-gray-700'}`}
                            >+</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 3: Select Entry/Exit Type */}
            <div className={`border rounded-xl p-5 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h2 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>3. Type d&apos;état des lieux</h2>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setReportType('entry')}
                        className={`p-4 rounded-xl border text-center transition-all shadow-sm ${reportType === 'entry'
                            ? 'bg-primary border-primary text-primary-foreground font-semibold ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                            : isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-3xl block mb-2">🔑</span>
                        <span className="font-medium">Entrée</span>
                        <p className={`text-xs mt-1 transition-colors ${reportType === 'entry' ? 'text-primary-foreground/80' : isDark ? 'text-slate-500' : 'text-gray-500'}`}>Remise des clés</p>
                    </button>

                    <button
                        onClick={() => setReportType('exit')}
                        className={`p-4 rounded-xl border text-center transition-all shadow-sm ${reportType === 'exit'
                            ? 'bg-primary border-primary text-primary-foreground font-semibold ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
                            : isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-3xl block mb-2">🚪</span>
                        <span className="font-medium">Sortie</span>
                        <p className={`text-xs mt-1 transition-colors ${reportType === 'exit' ? 'text-primary-foreground/80' : isDark ? 'text-slate-500' : 'text-gray-500'}`}>Départ du locataire</p>
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
                        Commencer l&apos;état des lieux
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </div>
    );
}
