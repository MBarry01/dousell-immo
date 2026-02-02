import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    console.log("🚀 [API START] POST /api/branding/upload");
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;

        console.log(`📂 [API] File received: ${file?.name} (${file?.size} bytes), Type: ${type}`);

        if (!file || !type) {
            console.error("❌ [API ERROR] Missing file or type");
            return NextResponse.json(
                { success: false, error: "Fichier ou type manquant" },
                { status: 400 }
            );
        }

        // Validation basique
        if (!["logo", "signature"].includes(type)) {
            console.error("❌ [API ERROR] Invalid type:", type);
            return NextResponse.json(
                { success: false, error: "Type invalide" },
                { status: 400 }
            );
        }

        if (file.size > 2 * 1024 * 1024) {
            console.error("❌ [API ERROR] File too large");
            return NextResponse.json(
                { success: false, error: "Fichier trop volumineux (max 2MB)" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        let publicUrl = "";

        if (user) {
            console.log("👤 [API] Authenticated user:", user.id);
            // CAS AUTHENTIFIÉ : Mise à jour de l'équipe

            // Essai de récupération du contexte d'équipe
            let teamId = null;
            try {
                const { data: memberData } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (memberData) {
                    teamId = memberData.team_id;
                } else {
                    // Fallback: Check if he created any team
                    const { data: teamData } = await supabase
                        .from('teams')
                        .select('id')
                        .eq('created_by', user.id)
                        .limit(1)
                        .maybeSingle();
                    if (teamData) teamId = teamData.id;
                }
            } catch (e) {
                console.error("❌ [API ERROR] Team lookup failed:", e);
            }

            console.log("🏢 [API] Team ID found:", teamId);

            if (!teamId) {
                return NextResponse.json(
                    { success: false, error: "Aucune équipe trouvée pour cet utilisateur" },
                    { status: 404 }
                );
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `teams/${teamId}/${type}_${Date.now()}.${fileExt}`;

            console.log("⬆️ [API] Uploading to bucket with name:", fileName);

            const { error: uploadError } = await supabase.storage
                .from("branding")
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                console.error("❌ [API ERROR] Storage upload failed:", uploadError);
                return NextResponse.json(
                    { success: false, error: uploadError.message },
                    { status: 500 }
                );
            }

            const {
                data: { publicUrl: url },
            } = supabase.storage.from("branding").getPublicUrl(fileName);
            publicUrl = url;
            console.log("🌐 [API] Public URL generated:", publicUrl);

            // Mise à jour de la table TEAMS
            const updateField = type === "logo" ? "logo_url" : "signature_url";
            const { error: dbError } = await supabase
                .from("teams")
                .update({ [updateField]: publicUrl })
                .eq("id", teamId);

            if (dbError) {
                console.error("❌ [API ERROR] Database update failed:", dbError);
                return NextResponse.json(
                    { success: false, error: dbError.message },
                    { status: 500 }
                );
            }
        } else {
            console.log("🕵️ [API] Anonymous upload (Onboarding)");
            // CAS NON-AUTHENTIFIÉ (Onboarding)
            // Utilisation du Service Role pour bypasser le RLS
            const adminSupabase = createAdminClient();

            // ID aléatoire pour le dossier temporaire
            const randomId = crypto.randomUUID();
            const fileExt = file.name.split(".").pop();
            const fileName = `onboarding/${randomId}/${type}.${fileExt}`;

            const { error: uploadError } = await adminSupabase.storage
                .from("branding")
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type,
                });

            if (uploadError) {
                console.error("❌ [API ERROR] Admin upload failed:", uploadError);
                return NextResponse.json(
                    { success: false, error: "Erreur upload (Admin): " + uploadError.message },
                    { status: 500 }
                );
            }

            const {
                data: { publicUrl: url },
            } = adminSupabase.storage.from("branding").getPublicUrl(fileName);
            publicUrl = url;
        }

        console.log("✅ [API SUCCESS] Upload complete");
        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error("🔥 [API CRITICAL ERROR]:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Erreur serveur interne" },
            { status: 500 }
        );
    }
}
