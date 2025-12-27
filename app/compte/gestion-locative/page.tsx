import { RentalStats } from "./components/RentalStats";
import { getRentalStats } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";
import { MaintenanceHub } from "./components/MaintenanceHub";
import { LayoutDashboard, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GestionLocativePage({
    searchParams,
}: {
    searchParams?: Promise<{ view?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Unwrap searchParams (Next.js 15+)
    const params = await searchParams;

    // Déterminer le statut à afficher (actifs ou résiliés)
    const viewMode = params?.view === 'terminated' ? 'terminated' : 'active';
    const isViewingTerminated = viewMode === 'terminated';

    // ========================================
    // RÉCUPÉRATION DES VRAIES DONNÉES SUPABASE
    // ========================================

    // 0. Récupérer le profil pour les infos de quittance (Branding)
    // IMPORTANT: On récupère TOUS les champs nécessaires pour le fallback intelligent
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name')
        .eq('id', user.id)
        .maybeSingle();

    // 1. Récupérer tous les baux du propriétaire (colonnes explicites)
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, tenant_phone, tenant_email, property_address, monthly_amount, billing_day, start_date, status, created_at')
        .eq('owner_id', user.id)
        // TEMPORAIRE: Afficher TOUS les baux pour diagnostic
        // .eq('status', viewMode) // Dynamique: 'active' ou 'terminated'
        .order('created_at', { ascending: false });

    // Filtrer côté client selon le statut
    const filteredLeases = isViewingTerminated
        ? (leases || []).filter(l => l.status === 'terminated')
        : (leases || []).filter(l => !l.status || l.status === 'active' || l.status === 'pending');

    if (leasesError) {
        console.error("Erreur récupération baux:", leasesError.message);
    }

    // 2. Récupérer TOUTES les transactions de loyer (pour tous les mois)
    const { data: transactions, error: transError } = await supabase
        .from('rental_transactions')
        .select('id, lease_id, period_month, period_year, status, amount_due, paid_at, period_start, period_end')
        .in('lease_id', (filteredLeases || []).map(l => l.id))
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

    if (transError) {
        console.error("Erreur récupération transactions:", transError.message);
    }

    // 3. Récupérer les demandes de maintenance (colonnes de base seulement)
    const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, description, status, quote_amount, created_at, lease_id')
        .order('created_at', { ascending: false });

    const maintenanceRequests = maintenanceData || [];

    if (maintenanceError) {
        console.error("Erreur récupération maintenance:", maintenanceError.message);
    }

    // ========================================
    // CALCUL DES STATISTIQUES (MODE RÉEL)
    // ========================================
    const stats = await getRentalStats();

    // Transformer les demandes de maintenance pour MaintenanceHub
    // Note: category n'existe pas encore dans la table
    const formattedRequests = (maintenanceRequests || []).map(req => {
        // Extraire la catégorie de la description si elle existe (format: "description [Catégorie]")
        const categoryMatch = req.description?.match(/\[([^\]]+)\]$/);
        const category = categoryMatch ? categoryMatch[1] : undefined;
        const cleanDescription = category ? req.description.replace(` [${category}]`, '') : req.description;

        return {
            id: req.id,
            description: cleanDescription,
            category: category,
            status: req.status,
            quote_amount: req.quote_amount,
            created_at: req.created_at
        };
    });

    return (
        <div className="min-h-screen bg-slate-950 print:hidden">
            {/* Header Enterprise - Ligne unique */}
            <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-white tracking-tight">Gestion Locative</h1>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                                <Link
                                    href="/compte/gestion-locative"
                                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                                        !isViewingTerminated
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Actifs
                                </Link>
                                <Link
                                    href="/compte/gestion-locative?view=terminated"
                                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                                        isViewingTerminated
                                            ? 'bg-orange-500/10 text-orange-400'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Résiliés
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/compte/gestion-locative/config"
                                className="p-2 hover:bg-slate-900 rounded-lg transition-colors"
                                title="Configuration"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                            </Link>
                            {!isViewingTerminated && <AddTenantButton ownerId={user.id} />}
                        </div>
                    </div>
                </div>
            </div>


            {/* Contenu principal */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Table des locataires - 2/3 */}
                    <div className="lg:col-span-2">
                        <GestionLocativeClient
                            leases={filteredLeases || []}
                            transactions={transactions || []}
                            profile={profile}
                            userEmail={user.email}
                            isViewingTerminated={isViewingTerminated}
                        />
                    </div>

                    {/* Hub Maintenance - 1/3 */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                            <MaintenanceHub requests={formattedRequests} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
