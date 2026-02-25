import { verifyKKiaPayTransaction } from "@/lib/kkiapay";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/mail";
import { invalidateRentalCaches } from "@/lib/cache/invalidation";
import { invalidateCacheBatch } from "@/lib/cache/cache-aside";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, leaseId, periodMonth, periodYear } = body;

    if (!transactionId || !leaseId || !periodMonth || !periodYear) {
      return Response.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    console.log("🔍 Vérification transaction KKiaPay:", transactionId);

    // Vérifier la transaction auprès de KKiaPay
    const transaction = await verifyKKiaPayTransaction(transactionId);

    if (transaction.status !== "SUCCESS") {
      console.warn("⚠️ Transaction non SUCCESS:", transaction.status);
      return Response.json(
        { error: "Transaction non confirmée", status: transaction.status },
        { status: 400 }
      );
    }

    console.log("✅ Transaction KKiaPay validée:", {
      transactionId,
      amount: transaction.amount,
      status: transaction.status,
    });

    // Mettre à jour dans Supabase
    const supabase = await createClient();

    // Récupérer infos du bail
    const { data: lease } = await supabase
      .from("leases")
      .select("tenant_email, tenant_name, monthly_amount, owner_id, owner:profiles(email, full_name)")
      .eq("id", leaseId)
      .single();

    if (!lease) {
      return Response.json(
        { error: "Bail non trouvé" },
        { status: 404 }
      );
    }

    // Build rich traceability metadata
    const traceMeta = {
      provider: 'kkiapay',
      kkiapay_transaction_id: transactionId,
      amount_fcfa: transaction.amount,
      payment_channel: transaction.paymentMethod || 'mobile_money',
      customer_phone: transaction.customer?.phone || null,
      customer_name: transaction.customer?.name || null,
      currency: 'XOF',
      kkiapay_status: transaction.status,
      paid_at: new Date().toISOString(),
      kkiapay_created_at: transaction.createdAt || null,
    };

    // Marquer le loyer comme payé
    const { error: rentError } = await supabase
      .from("rental_transactions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_ref: transactionId,
        payment_method: "kkiapay",
        meta: traceMeta,
      })
      .eq("lease_id", leaseId)
      .eq("period_month", periodMonth)
      .eq("period_year", periodYear);

    if (rentError) {
      console.error("❌ Erreur mise à jour loyer:", rentError);
      return Response.json(
        { error: "Erreur lors de la mise à jour du loyer" },
        { status: 500 }
      );
    }

    console.log(`✅ Loyer payé via KKiaPay: Bail ${leaseId}`);

    // Invalidation du cache (identique à PayDunya)
    if (lease.owner_id) {
      await invalidateRentalCaches(lease.owner_id, leaseId, {
        invalidateLeases: true,
        invalidateTransactions: true,
        invalidateStats: true,
      });
    }

    if (lease.tenant_email) {
      await invalidateCacheBatch([
        `tenant_dashboard:${lease.tenant_email}`,
        `tenant_payments:${leaseId}`,
      ], "rentals");
    }

    // Envoyer email de confirmation avec StandardNotificationEmail
    if (lease.tenant_email) {
      const subject = `Reçu de paiement - Loyer ${periodMonth}/${periodYear}`;
      const amountFmt = lease.monthly_amount?.toLocaleString("fr-FR");

      const { render } = await import('@react-email/render');
      const React = await import('react');
      const { StandardNotificationEmail } = await import('@/emails/StandardNotificationEmail');

      const emailHtml = await render(
        React.createElement(StandardNotificationEmail, {
          title: "Paiement reçu !",
          previewText: `Confirmation de réception de votre loyer de ${amountFmt} FCFA`,
          greeting: `Bonjour ${lease.tenant_name || "Locataire"},`,
          mainContent: `Nous confirmons la réception de votre paiement de ${amountFmt} FCFA pour le loyer de ${periodMonth}/${periodYear}. Votre référence de transaction est ${transactionId}. Votre quittance est désormais disponible dans votre espace locataire.`,
          ctaText: "Accéder à mon espace",
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/locataire`,
          footerText: "L'équipe Doussel Immo"
        })
      );

      await sendEmail({
        to: lease.tenant_email,
        subject,
        html: emailHtml,
      });

      // Notification propriétaire
      const owner = lease.owner as any;
      const ownerEmail = Array.isArray(owner) ? owner[0]?.email : owner?.email;

      if (ownerEmail) {
        const ownerEmailHtml = await render(
          React.createElement(StandardNotificationEmail, {
            title: "Nouveau paiement reçu",
            previewText: `Le locataire ${lease.tenant_name} a réglé son loyer`,
            mainContent: `Le locataire ${lease.tenant_name} a réglé son loyer de ${amountFmt} FCFA via KKiaPay. Référence: ${transactionId}`,
            footerText: "Système de Notification Doussell"
          })
        );
        await sendEmail({
          to: ownerEmail,
          subject: `[Paiement] Loyer reçu - ${lease.tenant_name}`,
          html: ownerEmailHtml,
        });
      }
    }

    return Response.json({
      success: true,
      transactionId,
      message: "Paiement confirmé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la confirmation KKiaPay:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur de traitement" },
      { status: 500 }
    );
  }
}
