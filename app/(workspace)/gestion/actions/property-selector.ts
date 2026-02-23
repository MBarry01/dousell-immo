"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";

export type VacantProperty = {
    id: string;
    title: string;
    price: number;
    address: string;
    city?: string;
    images?: string[];
};

/**
 * Récupère les biens vacants de l'équipe pour le sélecteur intelligent
 * (status = 'disponible' ou pas de bail actif)
 */
export async function getVacantTeamProperties(): Promise<{
    success: boolean;
    data?: VacantProperty[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Récupérer le contexte équipe standardisé
        const context = await getUserTeamContext();
        if (!context) return { success: false, error: "Non autorisé" };
        const { teamId } = context;
        await requireTeamPermission('properties.view');

        // Récupérer les biens de l'équipe qui sont disponibles (pas loués)
        const { data: properties, error } = await supabase
            .from("properties")
            .select(`
        id,
        title,
        price,
        location,
        images,
        status
      `)
            .eq("team_id", teamId)
            .in("status", ["disponible", "preavis"]) // Vacants ou en préavis
            .order("title", { ascending: true });

        if (error) {
            console.error("Error fetching vacant properties:", error);
            return { success: false, error: error.message };
        }

        // Mapper les données
        const vacantProperties: VacantProperty[] = (properties || []).map((p) => ({
            id: p.id,
            title: p.title || "Bien sans nom",
            price: p.price || 0,
            address: p.location?.address || `${p.location?.district || ""}, ${p.location?.city || ""}`.trim() || "Adresse non renseignée",
            city: p.location?.city,
            images: p.images,
        }));

        return { success: true, data: vacantProperties };
    } catch (error) {
        console.error("Error in getVacantTeamProperties:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}

/**
 * Récupère TOUS les biens de l'équipe (pour l'auto-matching import)
 * Inclut les biens loués aussi car on peut avoir plusieurs locataires
 */
export async function getAllTeamProperties(): Promise<{
    success: boolean;
    data?: VacantProperty[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Récupérer le contexte équipe standardisé
        const context = await getUserTeamContext();
        if (!context) return { success: false, error: "Non autorisé" };
        const { teamId } = context;
        await requireTeamPermission('properties.view');

        const { data: properties, error } = await supabase
            .from("properties")
            .select(`id, title, price, location, images`)
            .eq("team_id", teamId)
            .order("title", { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        const allProperties: VacantProperty[] = (properties || []).map((p) => ({
            id: p.id,
            title: p.title || "Bien sans nom",
            price: p.price || 0,
            address: p.location?.address || `${p.location?.district || ""}, ${p.location?.city || ""}`.trim() || "",
            city: p.location?.city,
            images: p.images,
        }));

        return { success: true, data: allProperties };
    } catch (error) {
        console.error("Error in getAllTeamProperties:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
