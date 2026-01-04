import { getKKiaPayConfig, type KKiaPayWebhookPayload } from "@/lib/kkiapay";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/mail";
import { invalidateRentalCaches } from "@/lib/cache/invalidation";
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";

/**
 * Webhook KKiaPay pour les notifications serveur-à-serveur
 * URL à configurer dans le dashboard KKiaPay: https://votredomaine.com/api/kkiapay/webhook
 */
export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-kkiapay-signature");
    const secret = request.headers.get("x-kkiapay-secret");
    const rawBody = await request.text();

    // Log pour debugging
    console.log("📥 Webhook KKiaPay reçu:", {
      hasSignature: !!signature,
      hasSecret: !!secret,
      bodyLength: rawBody.length,
    });

    // KKiaPay peut envoyer soit x-kkiapay-signature soit x-kkiapay-secret
    const receivedSecret = signature || secret;

    // Vérifier le secret
    const config = getKKiaPayConfig();
    if (receivedSecret && receivedSecret !== config.secret) {
      console.error("Webhook KKiaPay: Secret invalide");
      return Response.json(
        { error: "Secret invalide" },
        { status: 401 }
      );
    }

    if (!receivedSecret) {
      console.warn("⚠️ Webhook KKiaPay reçu sans authentification (mode test)");
    }

    const payload: KKiaPayWebhookPayload = JSON.parse(rawBody);

    console.log("✅ Webhook KKiaPay validé:", {
      transactionId: payload.transactionId,
      status: payload.status,
      amount: payload.amount,
      metadata: payload.metadata,
    });

    // Gérer uniquement les paiements réussis
    if (payload.status === "SUCCESS") {
      const metadata = payload.metadata as {
        type?: string;
        lease_id?: string;
        period_month?: number;
        period_year?: number;
      } | undefined;

      // Vérifier si c'est un paiement de loyer
      if (metadata?.type === "rent" && metadata.lease_id && metadata.period_month && metadata.period_year) {
        const supabase = await createClient();

        // Récupérer infos du bail
        const { data: lease } = await supabase
          .from("leases")
          .select("tenant_email, tenant_name, monthly_amount, owner_id, owner:profiles(email, full_name)")
          .eq("id", metadata.lease_id)
          .single();

        // Marquer le loyer comme payé
        const { error: rentError } = await supabase
          .from("rental_transactions")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_ref: payload.transactionId,
            payment_method: "kkiapay",
          })
          .eq("lease_id", metadata.lease_id)
          .eq("period_month", metadata.period_month)
          .eq("period_year", metadata.period_year);

        if (rentError) {
          console.error("Erreur maj loyer:", rentError);
        } else {
          console.log(`✅ Loyer payé via KKiaPay webhook: Bail ${metadata.lease_id}`);

          // Invalidation du cache
          if (lease?.owner_id) {
            await invalidateRentalCaches(lease.owner_id, metadata.lease_id, {
              invalidateLeases: true,
              invalidateTransactions: true,
              invalidateStats: true,
            });
          }

          if (lease?.tenant_email) {
            await invalidateCacheBatch([
              `tenant_dashboard:${lease.tenant_email}`,
              `tenant_payments:${metadata.lease_id}`,
            ], "rentals");
          }

          // Envoyer email de confirmation
          if (lease && lease.tenant_email) {
            const subject = `Reçu de paiement - Loyer ${metadata.period_month}/${metadata.period_year}`;
            const amountFmt = lease.monthly_amount?.toLocaleString("fr-FR");

            const html = `
              <h1>Paiement reçu !</h1>
              <p>Bonjour ${lease.tenant_name || "Locataire"},</p>
              <p>Nous confirmons la réception de votre paiement de <strong>${amountFmt} FCFA</strong> pour le loyer de <strong>${metadata.period_month}/${metadata.period_year}</strong>.</p>
              <p>Référence de transaction: <code>${payload.transactionId}</code></p>
              <p>Votre quittance est désormais disponible dans votre espace locataire.</p>
              <br/>
              <p>Cordialement,<br/>L'équipe Doussel Immo</p>
            `;

            await sendEmail({
              to: lease.tenant_email,
              subject,
              html,
            });

            // Notification propriétaire
            const owner = lease.owner as { email?: string; full_name?: string } | undefined;
            if (owner?.email) {
              await sendEmail({
                to: owner.email,
                subject: `[Paiement] Loyer reçu - ${lease.tenant_name}`,
                html: `<p>Le locataire ${lease.tenant_name} a réglé son loyer de ${amountFmt} FCFA via KKiaPay.</p><p>Référence: ${payload.transactionId}</p>`,
              });
            }
          }
        }
      }
    } else if (payload.status === "FAILED") {
      console.warn("❌ Paiement KKiaPay échoué:", {
        transactionId: payload.transactionId,
        metadata: payload.metadata,
      });
    }

    // Toujours retourner 200 pour confirmer la réception
    return Response.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook KKiaPay:", error);
    return Response.json(
      { error: "Erreur de traitement" },
      { status: 200 } // Retourner 200 pour éviter les retries excessifs
    );
  }
}
