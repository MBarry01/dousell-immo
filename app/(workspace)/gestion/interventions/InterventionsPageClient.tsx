'use client';

import { MaintenanceHub } from '../components/MaintenanceHub';
import { useTheme } from "@/components/theme-provider";
import { InterventionsTour } from '@/components/gestion/tours/InterventionsTour';

interface MaintenanceRequest {
    id: string;
    description: string;
    category?: string;
    status: 'submitted' | 'open' | 'artisan_found' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
    created_at: string;
    artisan_name?: string;
    artisan_phone?: string;
    artisan_rating?: number;
    artisan_address?: string;
    quoted_price?: number;
    intervention_date?: string;
    owner_approved?: boolean;
    tenant_response?: 'confirmed' | 'reschedule_requested';
    tenant_suggested_date?: string;
    rejection_reason?: string;
    photo_urls?: string[];
    property_title?: string;
    property_images?: string[];
    tenant_name?: string;
    tenant_email?: string;
}

interface InterventionsPageClientProps {
    requests: MaintenanceRequest[];
}

export function InterventionsPageClient({ requests }: InterventionsPageClientProps) {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <InterventionsTour />
            {/* Header */}
            <div
                id="tour-intervention-stats"
                className={`border-b ${isDark
                    ? 'border-slate-800 bg-slate-900/50'
                    : 'border-gray-200 bg-white/50'
                    }`}
            >
                <div className="w-full mx-auto px-4 md:px-6 py-6 text-left">
                    <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Interventions & Maintenance
                    </h1>
                    <p className={`text-sm md:text-base mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Gérez les demandes d'intervention de vos locataires
                    </p>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                <div id="tour-intervention-list" className="w-full">
                    <MaintenanceHub requests={requests} />
                </div>
            </div>
        </div>
    );
}
