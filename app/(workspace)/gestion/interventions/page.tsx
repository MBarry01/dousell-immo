import { InterventionsPageClient } from "./InterventionsPageClient";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserTeamContext } from "@/lib/team-context";
import { checkFeatureAccess } from "@/lib/subscription/team-subscription";
import { FeatureLockedState } from "@/components/gestion/FeatureLockedState";
import { markMaintenanceAsViewed } from "@/lib/unread-counts";

export default async function InterventionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    const { teamId } = await getUserTeamContext();

    // ✅ CHECK FEATURE: Interventions
    const access = await checkFeatureAccess(teamId, "manage_interventions");
    if (!access.allowed) {
        return (
            <FeatureLockedState
                title="Gestion des Incidents & Interventions"
                description="Centralisez les demandes de maintenance, assignez des artisans et suivez les interventions en temps réel."
                requiredTier="pro"
            />
        );
    }

    // ✅ CHECK PERMISSION: Maintenance.view
    const { requireTeamPermission } = await import("@/lib/team-permissions.server");
    const permissionCheck = await requireTeamPermission(teamId, "maintenance.view");

    if (!permissionCheck.success) {
        const { PermissionDeniedState } = await import("@/components/gestion/PermissionDeniedState");
        return (
            <PermissionDeniedState
                teamId={teamId}
                permission="maintenance.view"
                permissionLabel="Voir maintenance"
                title="Accès aux Interventions"
            />
        );
    }

    // Récupérer les demandes de maintenance (avec infos artisan, bien et locataire)
    const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select(`
            id, description, status, created_at, photo_urls,
            artisan_name, artisan_phone, artisan_rating, artisan_address,
            quoted_price, quote_url, category, intervention_date, owner_approved,
            tenant_response, tenant_suggested_date, rejection_reason, owner_viewed_at,
            leases (
                tenant_name,
                tenant_email,
                properties (
                    title,
                    images
                )
            )
        `)
        .order('created_at', { ascending: false });

    const maintenanceRequests = maintenanceData || [];

    if (maintenanceError) {
        console.error("Erreur récupération maintenance:", maintenanceError.message);
    }

    // Transformer les demandes de maintenance pour MaintenanceHub
    const formattedRequests = (maintenanceRequests || []).map(req => {
        // @ts-ignore - Supabase join types can be tricky
        const lease = Array.isArray(req.leases) ? req.leases[0] : req.leases;
        // @ts-ignore
        const property = Array.isArray(lease?.properties) ? lease.properties[0] : lease?.properties;

        // Extraire la catégorie de la description si elle existe (format: "description [Catégorie]")
        const categoryMatch = req.description?.match(/\[([^\]]+)\]$/);
        const category = categoryMatch ? categoryMatch[1] : undefined;
        const cleanDescription = category ? req.description.replace(` [${category}]`, '') : req.description;

        return {
            id: req.id,
            description: cleanDescription,
            category: req.category || category,
            status: req.status,
            created_at: req.created_at,
            photo_urls: req.photo_urls,
            // Infos artisan (Make.com)
            artisan_name: req.artisan_name,
            artisan_phone: req.artisan_phone,
            artisan_rating: req.artisan_rating,
            artisan_address: req.artisan_address,
            // Infos devis
            quoted_price: req.quoted_price,
            quote_url: req.quote_url,
            intervention_date: req.intervention_date,
            owner_approved: req.owner_approved,
            // Coordination & Feedback
            tenant_response: req.tenant_response,
            tenant_suggested_date: req.tenant_suggested_date,
            rejection_reason: req.rejection_reason,
            // New/unviewed: only for active (non-terminal) requests without owner_viewed_at
            is_new: !(req as any).owner_viewed_at && !['completed', 'rejected', 'cancelled'].includes(req.status),
            // Infos Bien & Locataire
            property_title: property?.title,
            property_images: property?.images,
            tenant_name: lease?.tenant_name,
            tenant_email: lease?.tenant_email
        };
    });

    // Mark maintenance as viewed AFTER query (so is_new reflects pre-view state)
    markMaintenanceAsViewed();

    return <InterventionsPageClient requests={formattedRequests} />;
}

