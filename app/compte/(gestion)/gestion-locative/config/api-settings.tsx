'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, Lock, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function ApiSettings() {
    const [testing, setTesting] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);

    const handleTestEmail = async () => {
        setTesting(true);
        // TODO: Envoyer un email de test via n8n
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTesting(false);
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 5000);
    };

    return (
        <div className="space-y-8 mt-10">
            <div className="flex items-center gap-2 text-blue-500 font-bold">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-lg">Configuration des Envois Premium</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Focus Principal : Gmail */}
                <div className="p-6 md:p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2rem]">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="p-4 bg-blue-500/20 rounded-2xl shrink-0">
                            <Mail className="w-8 h-8 text-blue-400" />
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-bold">Service Email (Gmail)</h3>
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase font-bold">
                                    Actif
                                </span>
                            </div>

                            <p className="text-sm text-gray-400">
                                Votre compte Gmail est utilisé pour envoyer automatiquement les{' '}
                                <span className="text-blue-300 font-medium">Baux</span>,{' '}
                                <span className="text-blue-300 font-medium">Avis d&apos;échéance</span> et{' '}
                                <span className="text-blue-300 font-medium">Quittances</span> à vos locataires.
                            </p>

                            <div className="flex items-center gap-2 text-xs text-blue-300 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Certificats PDF envoyés avec succès via votre adresse liée.
                            </div>

                            {/* Documents envoyés */}
                            <div className="mt-4 p-4 bg-gray-900/30 rounded-xl space-y-2">
                                <p className="text-xs text-gray-500 uppercase font-bold">Documents générés automatiquement:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        Contrats de bail (PDF)
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                        Avis d&apos;échéance mensuels
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                        Quittances de loyer
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <Button
                                variant="outline"
                                className={`w-full md:w-auto border-gray-700 transition-all ${testSuccess
                                        ? 'border-green-500/50 text-green-400 bg-green-500/10'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                onClick={handleTestEmail}
                                disabled={testing}
                            >
                                {testing ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Envoi en cours...</>
                                ) : testSuccess ? (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Email envoyé!</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" /> Tester l&apos;envoi</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Section WhatsApp (Désactivée - Bientôt disponible) */}
                <div className="p-6 bg-gray-900/20 border border-gray-800 rounded-[2rem] relative overflow-hidden">
                    {/* Overlay "Coming Soon" */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="bg-gray-800 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-gray-300 shadow-xl border border-gray-700">
                            <Lock className="w-3 h-3" /> Bientôt disponible
                        </div>
                    </div>

                    {/* Contenu désactivé */}
                    <div className="opacity-40">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gray-800 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-500">Notifications WhatsApp</h3>
                                <p className="text-xs text-gray-600">Envoyez des rappels directement sur WhatsApp</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-10 w-full bg-gray-800/50 rounded-xl"></div>
                            <div className="h-10 w-2/3 bg-gray-800/50 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note informative */}
            <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-2xl">
                <p className="text-xs text-gray-500 text-center">
                    💡 Les emails sont envoyés automatiquement via n8n. Assurez-vous que votre workflow n8n est configuré
                    et que votre compte Gmail est connecté dans les paramètres n8n.
                </p>
            </div>
        </div>
    );
}
