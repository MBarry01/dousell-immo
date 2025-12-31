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
      const customData = payload.custom_data as {
        type?: string;
        property_id?: string;
        lease_id?: string;
        period_month?: number;
        period_year?: number;
      } | undefined;

      // CAS 1: Paiement de Loyer
      if (customData?.type === 'rent' && customData.lease_id && customData.period_month && customData.period_year) {
        // Récupérer infos pour l'email (email locataire, email proprio)
        const { data: lease } = await supabase
          .from('leases')
          .select('tenant_email, tenant_name, monthly_amount, owner:profiles(email, full_name)')
          .eq('id', customData.lease_id)
          .single();

        const { error: rentError } = await supabase
          .from('rental_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_ref: payload.invoice.token,
            payment_method: 'paydunya'
          })
          .eq('lease_id', customData.lease_id)
          .eq('period_month', customData.period_month)
          .eq('period_year', customData.period_year);

        if (rentError) {
          console.error("Erreur maj loyer:", rentError);
        } else {
          console.log(`✅ Loyer payé via PayDunya: Bail ${customData.lease_id}`);

          // Envoyer Email de confirmation
          if (lease && lease.tenant_email) {
            const subject = `Reçu de paiement - Loyer ${customData.period_month}/${customData.period_year}`;
            const amountFmt = lease.monthly_amount?.toLocaleString('fr-FR');

            // Contenu HTML simple
            const html = `
                    <h1>Paiement reçu !</h1>
                    <p>Bonjour ${lease.tenant_name || 'Locataire'},</p>
                    <p>Nous confirmons la réception de votre paiement de <strong>${amountFmt} FCFA</strong> pour le loyer de <strong>${customData.period_month}/${customData.period_year}</strong>.</p>
                    <p>Votre quittance est désormais disponible dans votre espace locataire.</p>
                    <br/>
                    <p>Cordialement,<br/>L'équipe Doussel Immo</p>
                  `;

            await sendEmail({
              to: lease.tenant_email,
              subject,
              html
            });

            // Notification Proprio (CC)
            // @ts-ignore
            if (lease.owner?.email) {
              // @ts-ignore
              await sendEmail({ to: lease.owner.email, subject: `[Paiement] Loyer reçu - ${lease.tenant_name}`, html: `<p>Le locataire ${lease.tenant_name} a réglé son loyer de ${amountFmt} FCFA via PayDunya.</p>` });
            }
          }
        }
      }
      // CAS 2: Boost Annonce (Legacy / Property)
      else if (customData?.property_id) {
        const propertyId = customData.property_id;
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

