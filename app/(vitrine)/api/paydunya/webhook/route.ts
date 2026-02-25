import { validatePayDunyaWebhook, type PayDunyaWebhookPayload } from "@/lib/paydunya";
// import { createClient } from "@/utils/supabase/server"; // Remacé par Admin Client
import { sendEmail } from "@/lib/mail";
import { invalidateRentalCaches } from "@/lib/cache/invalidation";
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";

export async function POST(request: Request) {
  try {
    // PayDunya envoie les données en application/x-www-form-urlencoded
    // Les données sont dans la clé "data"
    const formData = await request.formData();
    const dataString = formData.get('data') as string;

    if (!dataString) {
      console.error("Webhook PayDunya: Données manquantes (clé 'data' absente)");
      return Response.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Parser le JSON contenu dans la clé "data"
    const payload: PayDunyaWebhookPayload = JSON.parse(dataString);

    // Vérifier que le hash est présent
    if (!payload.hash) {
      console.error("Webhook PayDunya: Hash manquant dans le payload");
      return Response.json(
        { error: "Hash manquant" },
        { status: 400 }
      );
    }

    // Valider le hash SHA-512 de la MasterKey
    if (!await validatePayDunyaWebhook(payload.hash)) {
      console.error("Webhook PayDunya: Hash invalide", {
        receivedHash: payload.hash.substring(0, 20) + '...',
      });
      return Response.json(
        { error: "Hash invalide" },
        { status: 401 }
      );
    }

    console.log("✅ Webhook PayDunya validé:", {
      token: payload.invoice.token,
      status: payload.invoice.status,
      amount: payload.invoice.total_amount,
      mode: payload.mode,
      response_code: payload.response_code,
      custom_data: payload.custom_data,
    });

    // Gérer les différents statuts de paiement
    if (payload.invoice.status === "completed") {
      const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js');
      const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const supabase = supabaseAdmin;
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
          .select('tenant_email, tenant_name, monthly_amount, owner_id, owner:profiles(email, full_name)')
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
          console.log(`✅ Loyer payé via PayDunya: Bail ${customData.lease_id}`, {
            receipt_url: payload.receipt_url,
          });

          // 🔥 INVALIDATION DU CACHE (Critical!)
          if (lease?.owner_id) {
            // Utiliser la fonction dédiée pour invalider les caches locatifs
            await invalidateRentalCaches(lease.owner_id, customData.lease_id, {
              invalidateLeases: true,
              invalidateTransactions: true,
              invalidateStats: true,
            });
          }

          // Invalider aussi le cache du dashboard locataire
          if (lease?.tenant_email) {
            await invalidateCacheBatch([
              `tenant_dashboard:${lease.tenant_email}`,
              `tenant_payments:${customData.lease_id}`,
            ], 'rentals');
          }

          // Envoyer Email de confirmation avec StandardNotificationEmail
          if (lease && lease.tenant_email) {
            const subject = `Reçu de paiement - Loyer ${customData.period_month}/${customData.period_year}`;
            const amountFmt = lease.monthly_amount?.toLocaleString('fr-FR');

            const { render } = await import('@react-email/render');
            const React = await import('react');
            const { StandardNotificationEmail } = await import('@/emails/StandardNotificationEmail');

            const emailHtml = await render(
              React.createElement(StandardNotificationEmail, {
                title: "Paiement reçu !",
                previewText: `Confirmation de réception de votre loyer de ${amountFmt} FCFA`,
                greeting: `Bonjour ${lease.tenant_name || 'Locataire'},`,
                mainContent: `Nous confirmons la réception de votre paiement de ${amountFmt} FCFA pour le loyer de ${customData.period_month}/${customData.period_year}. Votre quittance est désormais disponible dans votre espace locataire.`,
                ctaText: "Accéder à mon espace",
                ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/locataire`,
                footerText: "L'équipe Doussel Immo"
              })
            );

            await sendEmail({
              to: lease.tenant_email,
              subject,
              html: emailHtml
            });

            // Notification Proprio (CC)
            const owner = lease.owner as any;
            const ownerEmail = Array.isArray(owner) ? owner[0]?.email : owner?.email;

            if (ownerEmail) {
              const ownerEmailHtml = await render(
                React.createElement(StandardNotificationEmail, {
                  title: "Nouveau paiement reçu",
                  previewText: `Le locataire ${lease.tenant_name} a réglé son loyer`,
                  mainContent: `Le locataire ${lease.tenant_name} a réglé son loyer de ${amountFmt} FCFA via PayDunya.`,
                  footerText: "Système de Notification Doussell"
                })
              );
              await sendEmail({
                to: ownerEmail,
                subject: `[Paiement] Loyer reçu - ${lease.tenant_name}`,
                html: ownerEmailHtml
              });
            }

          }
        }
      }
      // CAS 2: Boost Annonce (Legacy / Property)
      else if (customData?.property_id) {
        const propertyId = customData.property_id;
        // Extraire les détails du paiement depuis le payload PayDunya
        const paymentAmount = payload.invoice.total_amount;

        // items est un objet Record<string, Item>, pas un tableau
        const firstItem = payload.invoice.items
          ? Object.values(payload.invoice.items)[0]
          : undefined;
        const serviceName = firstItem?.name || payload.invoice.description;

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
    } else if (payload.invoice.status === "failed") {
      console.warn("❌ Paiement échoué:", {
        token: payload.invoice.token,
        fail_reason: payload.fail_reason,
        errors: payload.errors,
        custom_data: payload.custom_data,
      });
      // TODO: Notifier l'utilisateur de l'échec
    } else if (payload.invoice.status === "cancelled") {
      console.warn("⚠️ Paiement annulé:", {
        token: payload.invoice.token,
        fail_reason: payload.fail_reason,
        custom_data: payload.custom_data,
      });
      // TODO: Notifier l'utilisateur de l'annulation
    } else if (payload.invoice.status === "pending") {
      console.log("⏳ Paiement en attente:", {
        token: payload.invoice.token,
        custom_data: payload.custom_data,
      });
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

