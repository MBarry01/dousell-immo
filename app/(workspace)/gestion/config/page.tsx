import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ConfigForm } from './config-form';
import { ApiSettings } from './api-settings';

export default async function ConfigPremiumPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Récupérer les données de branding existantes
    // Récupérer le nom de l'utilisateur pour les emails
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // Récupérer les données de l'équipe (Agence)
    let teamData = null;

    // 1. Chercher via membership
    const { data: member } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (member) {
        const { data: team } = await supabase
            .from('teams')
            .select('*')
            .eq('id', member.team_id)
            .single();
        teamData = team;
    } else {
        // 2. Fallback: Chercher via ownership direct (si pas encore migré)
        const { data: team } = await supabase
            .from('teams')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        teamData = team;
    }

    // Mapper les données pour le formulaire (teams -> BrandingData)
    const brandingData = teamData ? {
        full_name: profile?.full_name,
        company_name: teamData.name,
        company_address: teamData.company_address,
        company_phone: teamData.company_phone,
        company_email: teamData.company_email,
        company_ninea: teamData.company_ninea,
        logo_url: teamData.logo_url,
        signature_url: teamData.signature_url
    } : null;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-10">
            {/* Header avec retour */}
            <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                <Link
                    href="/gestion"
                    className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Configuration Premium</h1>
                    <p className="text-gray-400 text-sm">Personnalisez l&apos;apparence de vos documents officiels</p>
                </div>
            </div>

            {/* Formulaire de configuration */}
            <ConfigForm initialData={brandingData} />

            {/* Section API / Envois automatiques */}
            <ApiSettings profile={brandingData} />
        </div>
    );
}
