import { createOnsiteInvoice } from "@/lib/paydunya";
import { createClient } from "@/utils/supabase/server";
import { getBaseUrl } from "@/lib/utils";

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
        const { serviceType, description, propertyId, phone, amount: requestedAmount } = body;

        if (!serviceType || !description || !phone) {
            return Response.json(
                { error: "Type de service, description et numéro de téléphone requis" },
                { status: 400 }
            );
        }

        let amount = 0;
        let serviceCode = serviceType;

        if (serviceType === "rent_payment") {
            // Pour les loyers, le montant est dynamique
            if (!requestedAmount || requestedAmount <= 0) {
                return Response.json(
                    { error: "Montant invalide pour le paiement de loyer" },
                    { status: 400 }
                );
            }
            amount = requestedAmount;
        } else {
            // Pour les services (ex: boost), on récupère le prix depuis la BDD
            const { data: service, error: serviceError } = await supabase
                .from("services")
                .select("*")
                .eq("code", serviceType)
                .single();

            if (serviceError || !service) {
                console.error("Erreur récupération service:", serviceError);
                return Response.json(
                    { error: "Service invalide ou introuvable" },
                    { status: 400 }
                );
            }
            amount = service.price;
            serviceCode = service.code;
        }

        const baseUrl = getBaseUrl();
        const callbackUrl =
            process.env.PAYDUNYA_CALLBACK_URL || `${baseUrl}/api/paydunya/webhook`;

        const customData = serviceType === "rent_payment" ? {
            user_id: user.id,
            lease_id: propertyId, // On utilise propertyId comme leaseId pour le loyer
            type: "rent_payment",
            payment_method: "opr_onsite"
        } : {
            user_id: user.id,
            property_id: propertyId || null,
            type: "listing_payment",
            service_code: serviceCode,
            payment_method: "opr_onsite"
        };

        // Créer la facture PayDunya OPR
        const result = await createOnsiteInvoice(
            {
                invoice: {
                    items: [
                        {
                            name: serviceType === "rent_payment" ? "Paiement Loyer" : (serviceType === "boost_visibilite" ? "Diffusion Simple" : serviceType),
                            quantity: 1,
                            unit_price: amount,
                            total_price: amount,
                            description: description,
                        },
                    ],
                    total_amount: amount,
                    description,
                },
                store: {
                    name: "Dousell Immo",
                    tagline: "Votre partenaire immobilier à Dakar",
                    phone: "+221 77 138 52 81",
                    website_url: baseUrl,
                },
                actions: {
                    cancel_url: `${baseUrl}/compte/deposer?payment=canceled`, // TODO: Rendre dynamique si besoin
                    return_url: `${baseUrl}/compte/deposer?payment=success`,  // TODO: Rendre dynamique si besoin
                    callback_url: callbackUrl,
                },
                custom_data: customData,
            },
            phone // Numéro de téléphone pour l'envoi du code OTP
        );

        return Response.json({
            success: true,
            token: result.token, // OPR Token
            invoice_token: result.invoice_token,
            message: result.response_text
        });

    } catch (error) {
        console.error("Erreur PayDunya OPR Create:", error);
        return Response.json(
            {
                error: error instanceof Error ? error.message : "Erreur lors de l'initialisation du paiement",
            },
            { status: 500 }
        );
    }
}
