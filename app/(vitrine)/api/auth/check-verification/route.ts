import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cette route permet de vérifier si un utilisateur a confirmé son email
// Utilisée par le modal de confirmation pour polling en temps réel
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "userId est requis" },
            { status: 400 }
        );
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: "Configuration manquante" },
                { status: 500 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Récupérer l'utilisateur via l'API Admin
        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error || !user) {
            return NextResponse.json(
                { verified: false, error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // Vérifier si email_confirmed_at est défini
        const isVerified = !!user.email_confirmed_at;

        return NextResponse.json({
            verified: isVerified,
            email: user.email,
        });
    } catch (error) {
        console.error("Erreur lors de la vérification:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
