'use client';

import { LayoutDashboard, ArrowRight, Wallet, Bell, FileText, Clock, Wrench } from 'lucide-react';
import Link from 'next/link';

interface GestionLocativeWidgetProps {
    activeLeases?: number;
    pendingPayments?: number;
    maintenanceRequests?: number;
}

export function GestionLocativeWidget({
    activeLeases = 3,
    pendingPayments = 2,
    maintenanceRequests = 1
}: GestionLocativeWidgetProps) {
    const stats = {
        baux: activeLeases,
        attente: pendingPayments,
        pannes: maintenanceRequests
    };

    return (
        <Link href="/compte/gestion-locative" className="block group mb-8">
            {/* Dégradé bleu nuit profond - plus élégant et moins agressif */}
            <div className="relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-gray-900 via-blue-950 to-slate-900 text-white shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-[1.01] active:scale-95 border border-blue-800/30">

                {/* Cercles de décoration subtils */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                <div className="relative z-10">
                    {/* Header du Widget */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-950/50 rounded-2xl backdrop-blur-md border border-blue-800/50">
                            <LayoutDashboard className="w-6 h-6 text-blue-200" />
                        </div>
                        <div className="flex flex-col items-end">
                            {/* Badge Premium légèrement moins saturé */}
                            <span className="text-[10px] font-black bg-yellow-500/90 text-blue-950 px-3 py-1 rounded-full uppercase tracking-tighter mb-1 shadow-sm">
                                Premium
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-blue-300/80">
                                <span className="w-1.5 h-1.5 bg-green-500/80 rounded-full animate-pulse"></span>
                                Système Actif
                            </div>
                        </div>
                    </div>

                    {/* Titre et description */}
                    <div className="space-y-1 mb-6">
                        <h3 className="text-2xl font-extrabold tracking-tight text-white">Gestion Locative</h3>
                        <p className="text-blue-200/70 text-sm font-medium">Automatisez vos revenus fonciers & quittances.</p>
                    </div>

                    {/* Cartes de stats - tons plus sombres */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-black/20 border border-blue-800/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-blue-300 text-xs mb-1">
                                <FileText className="w-3 h-3" /> Baux
                            </div>
                            <div className="text-xl font-bold">{stats.baux}</div>
                        </div>
                        <div className="bg-black/20 border border-blue-800/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-yellow-300/80 text-xs mb-1">
                                <Clock className="w-3 h-3" /> En attente
                            </div>
                            <div className="text-xl font-bold">{stats.attente}</div>
                        </div>
                        <div className="bg-black/20 border border-blue-800/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-orange-300/80 text-xs mb-1">
                                <Wrench className="w-3 h-3" /> Pannes
                            </div>
                            <div className="text-xl font-bold">{stats.pannes}</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-blue-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="w-7 h-7 rounded-full bg-blue-900 border-2 border-blue-950 flex items-center justify-center text-blue-200">
                                    <Wallet className="w-3 h-3" />
                                </div>
                                <div className="w-7 h-7 rounded-full bg-indigo-900 border-2 border-blue-950 flex items-center justify-center text-blue-200">
                                    <Bell className="w-3 h-3" />
                                </div>
                            </div>
                            <span className="text-xs text-blue-300/80 font-semibold tracking-wide">Tableau de bord intelligent</span>
                        </div>
                        <div className="p-2 bg-blue-950 text-blue-200 rounded-full group-hover:bg-blue-900 group-hover:text-white transition-all group-hover:translate-x-1">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
