import { RentalStats } from "./components/RentalStats";
import { TenantList } from "./components/TenantList";
import { AddTenantButton } from "./components/AddTenantButton";
import { MaintenanceHub } from "./components/MaintenanceHub";
import { LayoutDashboard, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GestionLocativePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // ========================================
    // RÉCUPÉRATION DES VRAIES DONNÉES SUPABASE
    // ========================================

    // 1. Récupérer tous les baux du propriétaire (colonnes explicites)
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, tenant_phone, tenant_email, monthly_amount, billing_day, status, created_at')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (leasesError) {
        console.error("Erreur récupération baux:", leasesError.message);
    }

    // 2. Récupérer les transactions de loyer pour calculer les stats
    const { data: transactions, error: transError } = await supabase
        .from('rental_transactions')
        .select('*, leases!inner(owner_id)')
        .eq('leases.owner_id', user.id);

    if (transError) {
        console.error("Erreur récupération transactions:", transError.message);
    }

    // 3. Récupérer les demandes de maintenance (colonnes de base seulement)
    const { data: maintenanceRequests, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, description, status, quote_amount, created_at, lease_id')
        .order('created_at', { ascending: false });

    if (maintenanceError) {
        console.error("Erreur récupération maintenance:", maintenanceError.message);
    }

    // ========================================
    // CALCUL DES STATISTIQUES
    // ========================================

    const paidTransactions = transactions?.filter(t => t.status === 'paid') || [];
    const pendingTransactions = transactions?.filter(t => t.status === 'pending') || [];
    const overdueTransactions = transactions?.filter(t => t.status === 'overdue') || [];

    const totalCollected = paidTransactions.reduce((acc, t) => acc + Number(t.amount_due || 0), 0);
    const totalPending = pendingTransactions.reduce((acc, t) => acc + Number(t.amount_due || 0), 0);
    const overdueCount = overdueTransactions.length;

    const stats = {
        collected: totalCollected.toLocaleString('fr-FR'),
        pending: totalPending.toLocaleString('fr-FR'),
        overdue: overdueCount.toString()
    };

    // ========================================
    // FORMATAGE DES DONNÉES POUR LES COMPOSANTS
    // ========================================

    // Transformer les baux pour TenantList
    const formattedTenants = (leases || []).map(lease => {
        // Trouver la dernière transaction pour ce bail
        const leaseTransactions = transactions?.filter(t => t.lease_id === lease.id) || [];
        const latestTransaction = leaseTransactions[0];

        return {
            id: lease.id,
            name: lease.tenant_name,
            property: 'Adresse non renseignée', // TODO: Ajouter property_address à la table leases
            phone: lease.tenant_phone,
            email: lease.tenant_email,
            rentAmount: lease.monthly_amount,
            status: latestTransaction?.status || 'pending',
            dueDate: lease.billing_day
        };
    });

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
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
            {/* En-tête Dynamique */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                        <LayoutDashboard className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestion Locative</h1>
                        <p className="text-gray-400 text-sm italic">Votre assistant immobilier Premium</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/compte/gestion-locative/config"
                        className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                        title="Configuration"
                    >
                        <Settings className="w-5 h-5 text-gray-400" />
                    </Link>
                    <AddTenantButton ownerId={user.id} />
                </div>
            </div>

            {/* Statistiques Financières - Données réelles */}
            <RentalStats stats={stats} />

            {/* Section Principale : Grille 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Liste des locataires sur 2 colonnes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Mes Locataires & Paiements</h2>
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                            {leases?.length || 0} bail{(leases?.length || 0) > 1 ? 's' : ''} actif{(leases?.length || 0) > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="bg-gray-900/20 border border-gray-800 rounded-[2rem] p-2 overflow-hidden">
                        <TenantList tenants={formattedTenants} />
                    </div>
                </div>

                {/* Hub Maintenance sur 1 colonne */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/20 border border-gray-800 rounded-[2rem] p-4">
                        <MaintenanceHub requests={formattedRequests} />
                    </div>
                </div>
            </div>
        </div>
    );
}
