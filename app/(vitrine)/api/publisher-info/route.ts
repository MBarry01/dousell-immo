/**
 * GET /api/publisher-info?propertyId=xxx
 * Retourne les infos du publieur (équipe ou propriétaire) pour un bien donné.
 * Utilisé côté client pour afficher le nom/avatar dans le scheduler.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
        return NextResponse.json({ name: "Équipe Dousel", avatar: null });
    }

    try {
        const supabase = createAdminClient();

        // Fetch la propriété pour avoir team_id et owner_id
        const { data: prop } = await supabase
            .from("properties")
            .select("team_id, owner_id")
            .eq("id", propertyId)
            .single();

        if (!prop) {
            return NextResponse.json({ name: "Équipe Dousel", avatar: null });
        }

        // Cas équipe
        if (prop.team_id) {
            const { data: team } = await supabase
                .from("teams")
                .select("name, logo_url")
                .eq("id", prop.team_id)
                .single();

            if (team?.name) {
                return NextResponse.json({
                    name: team.name,
                    avatar: team.logo_url || null,
                    type: "team",
                });
            }
        }

        // Cas propriétaire individuel
        if (prop.owner_id) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("id", prop.owner_id)
                .single();

            if (profile?.full_name) {
                return NextResponse.json({
                    name: profile.full_name,
                    avatar: profile.avatar_url || null,
                    type: "owner",
                });
            }
        }
    } catch (err) {
        console.error("[publisher-info] Erreur:", err);
    }

    // Fallback
    return NextResponse.json({ name: "Équipe Dousel", avatar: null });
}
