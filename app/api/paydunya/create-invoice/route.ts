import { createPayDunyaInvoice, getPayDunyaCheckoutUrl, getPayDunyaConfig } from "@/lib/paydunya";
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
    const { serviceType, description, propertyId, returnUrl, cancelUrl } = body;

    if (!serviceType || !description) {
      return Response.json(
        { error: "Type de service et description requis" },
        { status: 400 }
      );
    }

    // Récupérer le prix depuis la base de données
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

    const amount = service.price;

    // Si le montant est 0, on ne crée pas de facture PayDunya (ou on gère différemment)
    // Mais ici on suppose que cette route est appelée pour payer.
    // Si c'est gratuit, le frontend ne devrait pas appeler cette route de paiement.

    const config = getPayDunyaConfig();

    const baseUrl = getBaseUrl();
    const callbackUrl =
      process.env.PAYDUNYA_CALLBACK_URL || `${baseUrl}/api/paydunya/webhook`;

    // Créer la facture PayDunya
    const invoice = await createPayDunyaInvoice({
      invoice: {
        items: [
          {
            name: service.name, // Utiliser le nom du service officiel
            quantity: 1,
            unit_price: amount,
            total_price: amount,
            description: description, // Garder la description personnalisée (ex: "Diffusion Simple - Titre")
          },
        ],
        total_amount: amount,
        description,
      },
      store: {
        name: "Dousell Immo",
        tagline: "Votre partenaire immobilier à Dakar",
        phone: "+221 77 138 52 81", // Numéro mis à jour
        website_url: baseUrl,
      },
      actions: {
        cancel_url: cancelUrl || `${baseUrl}/compte/deposer?payment=canceled`,
        return_url: returnUrl || `${baseUrl}/compte/deposer?payment=success`,
        callback_url: callbackUrl,
      },
      custom_data: {
        user_id: user.id,
        property_id: propertyId || null,
        type: "listing_payment",
        service_code: service.code, // On garde une trace du code service
      },
    });

    // Retourner l'URL de redirection
    let checkoutUrl = invoice.response_url;

    // PayDunya renvoie parfois l'URL dans 'response_text'
    if (!checkoutUrl && invoice.response_text && invoice.response_text.startsWith("http")) {
      checkoutUrl = invoice.response_text;
    }

    if (!checkoutUrl) {
      checkoutUrl = getPayDunyaCheckoutUrl(invoice.token, config.mode);
    }

    return Response.json({
      success: true,
      token: invoice.token,
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la facture PayDunya:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Erreur lors de la création de la facture",
      },
      { status: 500 }
    );
  }
}

