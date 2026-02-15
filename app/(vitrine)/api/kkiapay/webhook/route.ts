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

    const isProduction = process.env.NODE_ENV === "production";

    // Vérifier le secret
    const config = getKKiaPayConfig();
    const secretFromEnv = config.secret;

    if (isProduction && !receivedSecret) {
      console.error("Webhook KKiaPay: Authentification manquante en production");
      return Response.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    if (receivedSecret && receivedSecret !== secretFromEnv) {
      console.error("Webhook KKiaPay: Secret invalide");
      return Response.json(
        { error: "Secret invalide" },
        { status: 401 }
      );
    }

    if (!receivedSecret && !isProduction) {
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
        // Utiliser un client admin pour les opérations de webhook (fiabilité)
        const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseAdmin(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Récupérer infos du bail
        const { data: lease } = await supabaseAdmin
          .from("leases")
          .select("tenant_email, tenant_name, monthly_amount, owner_id, owner:profiles(email, full_name)")
          .eq("id", metadata.lease_id)
          .single();

        if (!lease) {
          console.error("❌ Webhook KKiaPay: Bail introuvable", metadata.lease_id);
          return Response.json({ success: true });
        }

        // Marquer le loyer comme payé
        const { data: updatedTx, error: rentError } = await supabaseAdmin
          .from("rental_transactions")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            payment_ref: payload.transactionId,
            payment_method: "kkiapay",
          })
          .eq("lease_id", metadata.lease_id)
          .eq("period_month", metadata.period_month)
          .eq("period_year", metadata.period_year)
          .select('id')
          .single();

        if (rentError || !updatedTx) {
          console.error("Erreur maj loyer:", rentError);
        } else {
          console.log(`✅ Loyer payé via KKiaPay webhook: Bail ${metadata.lease_id}`);

          // --- GÉNÉRATION ET STOCKAGE QUITTANCE PDF ---
          try {
            const ReactPDF = require('@react-pdf/renderer');
            const { createQuittanceDocument } = require('@/components/pdf/QuittancePDF_v2');
            const { storeDocumentInGED } = require('@/lib/ged-utils');

            const owner = lease.owner as { email?: string; full_name?: string } | undefined;

            const receiptData = {
              leaseId: metadata.lease_id,
              tenantName: lease.tenant_name,
              tenantEmail: lease.tenant_email,
              amount: lease.monthly_amount,
              periodMonth: `${String(metadata.period_month).padStart(2, '0')}/${metadata.period_year}`,
              periodStart: new Date(metadata.period_year, metadata.period_month - 1, 1).toLocaleDateString('fr-FR'),
              periodEnd: new Date(metadata.period_year, metadata.period_month, 0).toLocaleDateString('fr-FR'),
              receiptNumber: `QUITT-${Date.now().toString().slice(-6)}`,
              ownerName: owner?.full_name || 'Propriétaire',
              ownerEmail: owner?.email
            };

            const pdfDocument = createQuittanceDocument(receiptData);
            const stream = await ReactPDF.renderToStream(pdfDocument);
            const chunks: Uint8Array[] = [];
            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
              stream.on('data', (chunk: any) => chunks.push(chunk));
              stream.on('end', () => resolve(Buffer.concat(chunks)));
              stream.on('error', reject);
            });

            await storeDocumentInGED({
              userId: lease.owner_id,
              fileBuffer: new Uint8Array(pdfBuffer),
              fileName: `Quittance_${receiptData.receiptNumber}_KKIA_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
              bucketName: 'receipts',
              documentType: 'quittance',
              metadata: {
                leaseId: metadata.lease_id,
                transactionId: updatedTx.id,
                tenantName: lease.tenant_name,
                description: `Quittance - ${receiptData.periodMonth} - ${lease.tenant_name}`
              }
            }, supabaseAdmin);
            console.log("✅ Quittance PDF générée et stockée via utility (KKiaPay)");

          } catch (pdfError) {
            console.error("❌ Erreur génération PDF Quittance KKiaPay:", pdfError);
          }
          // -------------------------------------------

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
