'use client';

import { MaintenanceHub } from "@/app/(workspace)/gestion/components/MaintenanceHub";
import { useTheme } from "../theme-provider";

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'open' | 'artisan_found' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed';
    created_at: string;
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    artisan_address?: string;
    quoted_price?: number;
    intervention_date?: string;
    owner_approved?: boolean;
}

interface InterventionsPageClientProps {
    requests: MaintenanceRequest[];
}

export function InterventionsPageClient({ requests }: InterventionsPageClientProps) {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {/* Header */}
            <div
                className={`border-b ${isDark
                    ? 'border-slate-800 bg-slate-900/50'
                    : 'border-gray-200 bg-white/50'
                    }`}
            >
                <div className="w-full mx-auto px-4 md:px-6 py-4">
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Interventions & Maintenance
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Gérez les demandes d'intervention de vos locataires
                    </p>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                <div className="w-full">
                    <MaintenanceHub requests={requests} />
                </div>
            </div>
        </div>
    );
}
