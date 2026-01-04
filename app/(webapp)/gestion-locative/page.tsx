import { RentalStats } from "./components/RentalStats";
import { getRentalStats } from "./actions";
import { GestionLocativeClient } from "./components/GestionLocativeClient";
import { AddTenantButton } from "./components/AddTenantButton";
import { MaintenanceHub } from "./components/MaintenanceHub";
import { LegalAlertsWidget } from "./components/LegalAlertsWidget";
import { DocumentGeneratorDialog } from "./components/DocumentGeneratorDialog";
import { ThemedContent, ThemedWidget } from "./components/ThemedContent";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLeasesByOwner, getRentalTransactions, getOwnerProfileForReceipts } from "@/services/rentalService.cached";
import { getLeaseAlerts } from "@/app/(webapp)/documents-legaux/actions";

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
    // RÉCUPÉRATION OPTIMISÉE - PARALLÉLISATION
    // ========================================

    // Étape 1 : Lancer toutes les requêtes indépendantes EN PARALLÈLE
    const [
        profile,
        allLeases,
        earliestLeaseResult,
        maintenanceResult,
        stats,
        legalAlerts
    ] = await Promise.all([
        // Profil pour les infos de quittance (AVEC CACHE)
        getOwnerProfileForReceipts(user.id),
        // Tous les baux du propriétaire (AVEC CACHE)
        getLeasesByOwner(user.id, "all"),
        // Date du premier bail
        supabase
            .from('leases')
            .select('start_date')
            .eq('owner_id', user.id)
            .order('start_date', { ascending: true })
            .limit(1)
            .single(),
        // Demandes de maintenance (aperçu)
        supabase
            .from('maintenance_requests')
            .select('id, description, status, created_at, lease_id, artisan_name, artisan_phone, artisan_rating, artisan_address, quoted_price, intervention_date, owner_approved')
            .order('created_at', { ascending: false })
            .neq('status', 'completed')
            .limit(5),
        // Statistiques
        getRentalStats(),
        // Alertes juridiques
        getLeaseAlerts()
    ]);

    // Extraire les données des résultats
    const earliestLease = earliestLeaseResult.data;
    const maintenanceRequests = maintenanceResult.data || [];

    if (maintenanceResult.error) {
        console.error("Erreur récupération maintenance:", maintenanceResult.error.message);
    }

    // Filtrer les baux côté client selon le statut
    const filteredLeases = isViewingTerminated
        ? allLeases.filter(l => l.status === 'terminated')
        : allLeases.filter(l => !l.status || l.status === 'active' || l.status === 'pending');

    const minDateStr = earliestLease?.start_date || new Date().toISOString();

    // Étape 2 : Récupérer les transactions (dépend des leases filtrés)
    const leaseIds = filteredLeases.map(l => l.id);
    const rawTransactions = await getRentalTransactions(leaseIds);

    // Polyfill pour amount_paid
    const transactions = rawTransactions.map(t => ({
        ...t,
        amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
    }));

    // Transformer les demandes de maintenance pour MaintenanceHub
    const formattedRequests = (maintenanceRequests || []).map(req => {
        const categoryMatch = req.description?.match(/\[([^\]]+)\]$/);
        const category = categoryMatch ? categoryMatch[1] : undefined;
        const cleanDescription = category ? req.description.replace(` [${category}]`, '') : req.description;

        return {
            id: req.id,
            description: cleanDescription,
            category: category,
            status: req.status,
            created_at: req.created_at,
            artisan_name: req.artisan_name,
            artisan_phone: req.artisan_phone,
            artisan_rating: req.artisan_rating,
            artisan_address: req.artisan_address,
            quoted_price: req.quoted_price,
            intervention_date: req.intervention_date,
            owner_approved: req.owner_approved
        };
    });

    return (
        <ThemedContent
            isViewingTerminated={isViewingTerminated}
            filterSection={
                !isViewingTerminated && (
                    <>
                        <DocumentGeneratorDialog
                            leases={filteredLeases}
                            userEmail={user.email}
                            profile={profile}
                        />
                        <AddTenantButton ownerId={user.id} profile={profile} />
                    </>
                )
            }
        >
            {/* Table des locataires - Pleine largeur */}
            <div className="mb-6">
                <GestionLocativeClient
                    leases={filteredLeases || []}
                    transactions={transactions || []}
                    profile={profile}
                    userEmail={user.email}
                    ownerId={user.id}
                    isViewingTerminated={isViewingTerminated}
                    minDate={minDateStr}
                />
            </div>

            {/* Widgets Dashboard - Vue d'ensemble */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                {/* Interventions - Aperçu */}
                <ThemedWidget
                    title="Interventions Récentes"
                    linkHref="/interventions"
                    linkText="Voir tout"
                >
                    <MaintenanceHub requests={formattedRequests} />
                </ThemedWidget>

                {/* Alertes Juridiques */}
                <ThemedWidget
                    title="Alertes Juridiques"
                    linkHref="/documents-legaux"
                    linkText="Voir tout"
                >
                    <LegalAlertsWidget alerts={legalAlerts} />
                </ThemedWidget>
            </div>
        </ThemedContent>
    );
}
