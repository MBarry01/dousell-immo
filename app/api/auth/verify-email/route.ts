import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-confirmation";

// API endpoint pour vérifier un token d'email
// Appelé par la page de vérification avec un POST
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token manquant" },
                { status: 400 }
            );
        }

        console.log("🔍 API Verify Email - Token reçu");

        const result = await verifyEmailToken(token);

        if (!result.success) {
            console.error("❌ Échec de la vérification:", result.error);
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        console.log("✅ Email vérifié avec succès via API");

        return NextResponse.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error("❌ Erreur inattendue:", error);
        return NextResponse.json(
            { success: false, error: "Erreur serveur" },
            { status: 500 }
        );
    }
}
