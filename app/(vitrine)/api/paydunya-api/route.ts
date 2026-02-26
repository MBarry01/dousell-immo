import { createPayDunyaInvoice, getPayDunyaConfig } from "@/lib/paydunya";
import { createClient } from "@/utils/supabase/server";
import { getBaseUrl } from "@/lib/utils";

/**
 * PSR API Endpoint
 * Returns a token for the PayDunya JavaScript SDK popup payment.
 * 
 * Expected response format:
 * { "success": true, "mode": "test", "token": "xxx" }
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Authentification requise
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return Response.json(
                { success: false, error: "Non authentifié" },
                { status: 401 }
            );
        }

        // Récupérer les paramètres depuis l'URL
        const url = new URL(request.url);
        const serviceType = url.searchParams.get("serviceType");
        const description = url.searchParams.get("description") || "Paiement Dousel";
        const amountStr = url.searchParams.get("amount");
        const propertyId = url.searchParams.get("propertyId");
        const fullName = url.searchParams.get("fullName") || "";
        const email = url.searchParams.get("email") || user.email || "";
        const phone = url.searchParams.get("phone") || "";

        if (!serviceType) {
            return Response.json(
                { success: false, error: "Type de service requis" },
                { status: 400 }
            );
        }

        let amount = 0;
        let customData: Record<string, unknown> = {};

        if (serviceType === "rent_payment") {
            // Paiement de loyer - montant dynamique
            amount = Number(amountStr);
            if (!amount || amount <= 0) {
                return Response.json(
                    { success: false, error: "Montant invalide" },
                    { status: 400 }
                );
            }
            customData = {
                lease_id: propertyId,
                type: "rent_payment",
                user_id: user.id,
            };
        } else {
            // Autres services - récupérer le prix depuis la DB
            const { data: service, error: serviceError } = await supabase
                .from("services")
                .select("*")
                .eq("code", serviceType)
                .single();

            if (serviceError || !service) {
                return Response.json(
                    { success: false, error: "Service invalide" },
                    { status: 400 }
                );
            }
            amount = service.price;
            customData = {
                property_id: propertyId || null,
                type: "listing_payment",
                service_code: service.code,
                user_id: user.id,
            };
        }

        const config = getPayDunyaConfig();
        const baseUrl = getBaseUrl();
        const callbackUrl = process.env.PAYDUNYA_CALLBACK_URL || `${baseUrl}/api/paydunya/webhook`;

        // Créer le checkout invoice
        const invoice = await createPayDunyaInvoice({
            invoice: {
                items: [
                    {
                        name: description,
                        quantity: 1,
                        unit_price: amount,
                        total_price: amount,
                        description: description,
                    },
                ],
                total_amount: amount,
                description,
                customer: {
                    name: fullName,
                    email: email,
                    phone: phone,
                },
            },
            store: {
                name: "Dousel",
                tagline: "Votre partenaire immobilier à Dakar",
                phone: "+221 77 138 52 81",
                website_url: baseUrl,
            },
            actions: {
                cancel_url: `${baseUrl}/compte/deposer?payment=canceled`,
                return_url: `${baseUrl}/compte/deposer?payment=success`,
                callback_url: callbackUrl,
            },
            custom_data: customData,
        });

        // Retourner le format attendu par le SDK PSR
        return Response.json({
            success: true,
            mode: config.mode,
            token: invoice.token,
        });
    } catch (error) {
        console.error("Erreur API PSR:", error);
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Erreur interne",
            },
            { status: 500 }
        );
    }
}
