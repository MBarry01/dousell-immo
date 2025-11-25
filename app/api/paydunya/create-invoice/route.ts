import { createPayDunyaInvoice, getPayDunyaCheckoutUrl, getPayDunyaConfig } from "@/lib/paydunya";
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
    const { amount, description, propertyId, returnUrl, cancelUrl } = body;

    if (!amount || !description) {
      return Response.json(
        { error: "Montant et description requis" },
        { status: 400 }
      );
    }

    const config = getPayDunyaConfig();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Créer la facture PayDunya
    const invoice = await createPayDunyaInvoice({
      invoice: {
        items: [
          {
            name: description,
            quantity: 1,
            unit_price: amount,
            total_price: amount,
            description: `Paiement pour: ${description}`,
          },
        ],
        total_amount: amount,
        description,
      },
      store: {
        name: "Dousell Immo",
        tagline: "Votre partenaire immobilier à Dakar",
        phone: "+221 77 123 45 67",
        website_url: baseUrl,
      },
      actions: {
        cancel_url: cancelUrl || `${baseUrl}/compte/deposer?payment=canceled`,
        return_url: returnUrl || `${baseUrl}/compte/deposer?payment=success`,
        callback_url: `${baseUrl}/api/paydunya/webhook`,
      },
      custom_data: {
        user_id: user.id,
        property_id: propertyId || null,
        type: "listing_payment",
      },
    });

    // Retourner l'URL de redirection
    const checkoutUrl = getPayDunyaCheckoutUrl(invoice.token, config.mode);

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

