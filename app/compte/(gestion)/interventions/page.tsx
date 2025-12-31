import { MaintenanceHub } from "../gestion-locative/components/MaintenanceHub";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { RentalTour } from "@/components/onboarding/RentalTour";

export default async function InterventionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Récupérer les demandes de maintenance (avec infos artisan)
    const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, description, status, created_at, lease_id, artisan_name, artisan_phone, artisan_rating, artisan_address, quoted_price, intervention_date, owner_approved')
        .order('created_at', { ascending: false });

    const maintenanceRequests = maintenanceData || [];

    if (maintenanceError) {
        console.error("Erreur récupération maintenance:", maintenanceError.message);
    }

    // Transformer les demandes de maintenance pour MaintenanceHub
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
            created_at: req.created_at,
            // Infos artisan (Make.com)
            artisan_name: req.artisan_name,
            artisan_phone: req.artisan_phone,
            artisan_rating: req.artisan_rating,
            artisan_address: req.artisan_address,
            // Infos devis
            quoted_price: req.quoted_price,
            intervention_date: req.intervention_date,
            owner_approved: req.owner_approved
        };
    });

    return (
        <div className="min-h-screen bg-slate-950">
            <RentalTour page="interventions" />

            {/* Header */}
            <div id="tour-intervention-stats" className="border-b border-slate-800 bg-slate-900/50">
                <div className="w-full mx-auto px-4 md:px-6 py-4">
                    <h1 className="text-2xl font-bold text-white">Interventions & Maintenance</h1>
                    <p className="text-sm text-slate-400 mt-1">Gérez les demandes d'intervention de vos locataires</p>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="w-full mx-auto px-4 md:px-6 py-6">
                <div id="tour-intervention-list" className="max-w-4xl mx-auto">
                    <MaintenanceHub requests={formattedRequests} />
                </div>
            </div>
        </div>
    );
}
