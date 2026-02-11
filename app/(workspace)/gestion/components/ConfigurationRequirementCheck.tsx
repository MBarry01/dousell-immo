'use client';

import React from 'react';
import { AlertCircle, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface ProfileData {
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    company_phone?: string | null;
    company_address?: string | null;
    address?: string | null;
}

interface ConfigurationRequirementCheckProps {
    profile: ProfileData | null;
    children: React.ReactNode;
    isDark?: boolean;
}

export function ConfigurationRequirementCheck({
    profile,
    children,
    isDark = false
}: ConfigurationRequirementCheckProps) {
    const router = useRouter();

    const hasName = !!(profile?.full_name || profile?.company_name);
    // On vérifie phone (profil perso) OR company_phone (profil team)
    const hasPhone = !!(profile?.phone || profile?.company_phone);
    const hasAddress = !!(profile?.company_address || profile?.address);

    console.log("[ConfigurationRequirementCheck] Status:", { hasName, hasPhone, hasAddress, profile });

    const isComplete = hasName && hasPhone && hasAddress;

    if (isComplete) {
        return <>{children}</>;
    }

    const missingFields = [];
    if (!hasName) missingFields.push("Nom ou Raison sociale");
    if (!hasPhone) missingFields.push("Numéro de téléphone");
    if (!hasAddress) missingFields.push("Adresse physique");

    return (
        <div className={`p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex flex-col items-center text-center space-y-4 py-4`}>
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'
                    }`}>
                    <AlertCircle className="h-8 w-8" />
                </div>

                <DialogHeader className="space-y-2">
                    <DialogTitle className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Accès Restreint : Profil Incomplet
                    </DialogTitle>
                    <DialogDescription className={`text-sm max-w-[320px] mx-auto text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Pour générer des documents légaux conformes, vous devez d'abord renseigner vos informations obligatoires dans les paramètres.
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-200'
                }`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    Informations manquantes :
                </p>
                <ul className="space-y-2">
                    {missingFields.map((field, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{field}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pt-2">
                <Button
                    onClick={() => router.push('/gestion/config?tab=branding')}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl shadow-lg ring-offset-background transition-all active:scale-[0.98] group"
                >
                    <Settings className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    Compléter mon profil
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            <p className={`text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Cette étape est obligatoire pour la validité juridique de vos contrats et quittances.
            </p>
        </div>
    );
}
