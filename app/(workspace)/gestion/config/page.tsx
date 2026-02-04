import { Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ConfigTabs } from './config-tabs';

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
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <Link
                    href="/gestion"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </Link>
                <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/10 text-primary-foreground">
                    <Settings className="w-6 h-6 animate-pulse-slow" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuration</h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm italic">Gérez votre identité visuelle et votre abonnement</p>
                </div>
            </div>

            {/* Interface par onglets */}
            <ConfigTabs brandingData={brandingData} />
        </div>
    );
}
