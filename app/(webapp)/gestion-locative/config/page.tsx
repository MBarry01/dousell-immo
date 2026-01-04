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
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_phone, company_email, company_ninea, logo_url, signature_url')
        .eq('id', user.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-10">
            {/* Header avec retour */}
            <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                <Link
                    href="/gestion-locative"
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

            {/* Formulaire de configuration - Données pré-remplies */}
            <ConfigForm initialData={profile} />

            {/* Section API / Envois automatiques */}
            <ApiSettings profile={profile} />
        </div>
    );
}
