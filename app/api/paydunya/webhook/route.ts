import { validatePayDunyaWebhook, type PayDunyaWebhookPayload } from "@/lib/paydunya";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    // Récupérer la signature depuis les headers
    const signature = request.headers.get("PAYDUNYA-SIGNATURE");

    if (!signature) {
      console.error("Webhook PayDunya: Signature manquante");
      return Response.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    // Lire le body brut pour la validation
    const rawBody = await request.text();

    // Valider la signature
    if (!validatePayDunyaWebhook(rawBody, signature)) {
      console.error("Webhook PayDunya: Signature invalide");
      return Response.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }

    // Parser le payload
    const payload: PayDunyaWebhookPayload = JSON.parse(rawBody);

    console.log("Webhook PayDunya reçu:", {
      token: payload.invoice.token,
      status: payload.invoice.status,
      amount: payload.invoice.total_amount,
    });

    // Si le paiement est complété, on peut mettre à jour la propriété si elle existe
    // Sinon, le token sera utilisé lors de la création de l'annonce
    if (payload.invoice.status === "completed") {
      const supabase = await createClient();
      const customData = payload.custom_data as { property_id?: string; user_id?: string } | undefined;
      const propertyId = customData?.property_id;

      if (propertyId) {
        // Extraire les détails du paiement depuis le payload PayDunya
        const paymentAmount = payload.invoice.total_amount;
        const serviceName = payload.invoice.items && payload.invoice.items.length > 0
          ? payload.invoice.items[0].name  // Premier item (ex: "Diffusion Simple - Studio")
          : payload.invoice.description;   // Fallback sur la description

        // Mettre à jour uniquement les informations de paiement, SANS changer le statut de validation
        // Le statut reste "payment_pending" pour que l'admin puisse valider manuellement
        const { error: updateError } = await supabase
          .from("properties")
          .update({
            // NE PAS changer validation_status - il doit rester "payment_pending" pour validation admin
            payment_ref: payload.invoice.token,
            payment_date: new Date().toISOString(),
            payment_amount: paymentAmount,
            service_name: serviceName,
          })
          .eq("id", propertyId);

        if (updateError) {
          console.error("Erreur lors de la mise à jour de la propriété:", updateError);
        } else {
          console.log("✅ Paiement confirmé pour la propriété:", propertyId, `- Montant: ${paymentAmount} FCFA - Service: ${serviceName}`);
        }
      } else {
        // Si la propriété n'existe pas encore, le token sera utilisé lors de la création
        console.log("Paiement confirmé, token disponible pour création d'annonce:", payload.invoice.token);
      }
    }

    // Toujours retourner 200 pour confirmer la réception du webhook
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook PayDunya:", error);
    // Retourner 200 même en cas d'erreur pour éviter les retries excessifs
    return Response.json(
      { error: "Erreur de traitement" },
      { status: 200 }
    );
  }
}

