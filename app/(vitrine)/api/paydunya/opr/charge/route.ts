import { chargeOnsiteInvoice } from "@/lib/paydunya";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Vérifier l'authentification
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return Response.json(
                { error: "Non authentifié" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { token, code } = body;

        if (!token || !code) {
            return Response.json(
                { error: "Token et code de confirmation requis" },
                { status: 400 }
            );
        }

        // Confirmer le paiement via l'API PayDunya
        const result = await chargeOnsiteInvoice(token, code);

        // Si succès, on peut idéalement mettre à jour la base de données ici,
        // mais le Webhook est la source de vérité la plus fiable.
        // Cependant, pour une expérience utilisateur fluide, on renvoie le succès.

        return Response.json({
            success: true,
            receipt_url: result.invoice_data?.receipt_url,
            message: result.response_text
        });

    } catch (error) {
        console.error("Erreur PayDunya OPR Charge:", error);
        return Response.json(
            {
                error: error instanceof Error ? error.message : "Erreur lors de la confirmation du paiement",
            },
            { status: 500 }
        );
    }
}
