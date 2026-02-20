"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { ListingApprovedEmail } from "@/emails/listing-approved-email";
import { ListingRejectedEmail } from "@/emails/listing-rejected-email";
import { notifyUser } from "@/lib/notifications";
import { requireAnyRole } from "@/lib/permissions";
import { generateInvoicePdf } from "@/lib/invoice";

export async function moderateProperty(
  propertyId: string,
  status: "approved" | "rejected"
) {
  // Vérifier que l'utilisateur a le droit de modérer (admin, moderateur, superadmin)
  await requireAnyRole(["admin", "moderateur", "superadmin"]);

  const supabase = await createClient();

  // Récupérer les infos du bien avant modification
  const { data: property } = await supabase
    .from("properties")
    .select("title, owner_id, price, payment_ref, payment_amount, service_name, category, location, details")
    .eq("id", propertyId)
    .single();

  const { error } = await supabase
    .from("properties")
    .update({ validation_status: status })
    .eq("id", propertyId);

  if (error) {
    console.error("Error moderating property:", error);
    return { error: "Erreur lors de la modération" };
  }

  // Récupérer l'email du propriétaire depuis auth.users
  if (property?.owner_id) {
    try {
      const adminClient = createAdminClient();
      const { data: owner, error: ownerError } = await adminClient.auth.admin.getUserById(
        property.owner_id
      );

      if (!ownerError && owner?.user?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousell-immo.app";
        const propertyUrl = `${baseUrl}/biens/${propertyId}`;

        if (status === "approved") {
          // GESTION DE LA FACTURE POUR LES ANNONCES PAYANTES
          let invoiceBuffer: Buffer | null = null;
          let invoiceNumber: string | undefined = undefined;
          const isPaid = !!property.payment_ref && !!property.payment_amount;

          if (isPaid) {
            try {
              console.log("💰 Génération de la facture pour l'annonce payante:", property.title);

              invoiceNumber = `FAC-${new Date().getFullYear()}-${(property.payment_ref || "REF").slice(-6).toUpperCase()}`;

              const clientName = owner.user.user_metadata?.full_name || owner.user.email || "Client Doussel Immo";

              // Utiliser les vraies données de paiement depuis la base de données
              const paymentAmount = property.payment_amount;
              const serviceName = property.service_name || `Boost Visibilité - Annonce : ${property.title}`;

              const invoiceData = {
                invoiceNumber,
                date: new Date(),
                clientName: clientName,
                clientEmail: owner.user.email || "",
                items: [
                  {
                    description: serviceName,
                    amount: paymentAmount,
                  },
                ],
                total: paymentAmount,
              };

              console.log("📄 Données facture:", JSON.stringify(invoiceData, null, 2));

              invoiceBuffer = await generateInvoicePdf(invoiceData);

              if (invoiceBuffer && Buffer.isBuffer(invoiceBuffer)) {
                console.log(`✅ Facture PDF générée avec succès (${invoiceBuffer.length} bytes)`);
              } else {
                console.error("❌ Le buffer généré n'est pas valide");
                invoiceBuffer = null;
              }
            } catch (invoiceError) {
              console.error("❌ Erreur lors de la génération de la facture:", invoiceError);
              // On continue quand même l'envoi de l'email sans la facture
            }
          }

          // Notifier l'utilisateur
          await notifyUser({
            userId: property.owner_id,
            type: "success",
            title: "✅ Votre annonce est en ligne !",
            message: `Votre annonce "${property.title}" a été approuvée et est maintenant visible sur Dousell Immo.`,
            resourcePath: `/biens/${propertyId}`,
          });

          // Envoyer email d'approbation avec facture en pièce jointe si payant
          console.log("📧 Préparation de l'envoi d'email à:", owner.user.email);
          console.log("📋 Données pour l'email:", {
            propertyTitle: property.title,
            isPaid,
            hasInvoice: !!invoiceBuffer,
            hasPropertyType: !!property.details?.type,
            hasRegion: !!property.location,
          });

          const emailResult = await sendEmail({
            to: owner.user.email,
            subject: `🎉 Votre annonce "${property.title}" est en ligne !`,
            user_id: property.owner_id,
            react: ListingApprovedEmail({
              propertyTitle: property.title,
              propertyUrl,
              isPaid,
              invoiceNumber,
              hasInvoice: !!invoiceBuffer,
              // Détails de l'annonce
              // Détails de l'annonce
              propertyType: property.details?.type || "Bien immobilier",
              transactionType: property.category === "vente" ? "Vente" : "Location",
              price: property.price,
              // Localisation
              region: property.location?.city || property.location?.state || "", // Fallback
              city: property.location?.district || property.location?.city || "",
              address: property.location?.address || "",
              // Paiement
              paymentAmount: property.payment_amount,
              serviceName: property.service_name,
            }),
            attachments: invoiceBuffer
              ? [
                {
                  filename: `Facture-${invoiceNumber || "Doussel"}.pdf`,
                  content: invoiceBuffer,
                  contentType: "application/pdf",
                },
              ]
              : undefined,
          });

          if (isPaid && invoiceBuffer) {
            if (emailResult.error) {
              console.error("❌ Erreur lors de l'envoi de l'email avec facture:", emailResult.error);
            } else {
              console.log("✅ Email d'approbation avec facture PDF envoyé à", owner.user.email);
              console.log("📎 Pièce jointe:", `Facture-${invoiceNumber || "Doussel"}.pdf`, `(${invoiceBuffer.length} bytes)`);
            }
          } else {
            if (emailResult.error) {
              console.error("❌ Erreur lors de l'envoi de l'email:", emailResult.error);
            } else {
              console.log("✅ Email d'approbation envoyé à", owner.user.email);
            }
          }
        }
        // Pour le refus, on utilise moderatePropertyWithReason qui gère le motif
      }
    } catch (error) {
      console.error("Error getting owner email:", error);
      // Continue même si on ne peut pas envoyer l'email
    }
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/compte/mes-biens");
  revalidatePath("/"); // Invalider la page d'accueil pour afficher l'annonce immédiatement

  return { success: true };
}

/**
 * Modérer un bien avec un motif de refus
 */
export async function moderatePropertyWithReason(
  propertyId: string,
  rejectionReason: string
) {
  // Vérifier que l'utilisateur a le droit de modérer (admin, moderateur, superadmin)
  await requireAnyRole(["admin", "moderateur", "superadmin"]);

  const supabase = await createClient();

  // Récupérer les infos du bien avant modification
  const { data: property } = await supabase
    .from("properties")
    .select("title, owner_id")
    .eq("id", propertyId)
    .single();

  const { error } = await supabase
    .from("properties")
    .update({
      validation_status: "rejected",
      rejection_reason: rejectionReason,
    })
    .eq("id", propertyId);

  if (error) {
    console.error("Error moderating property with reason:", error);
    return { error: "Erreur lors de la modération" };
  }

  // Récupérer l'email du propriétaire et envoyer l'email de refus
  if (property?.owner_id) {
    try {
      const adminClient = createAdminClient();
      const { data: owner, error: ownerError } = await adminClient.auth.admin.getUserById(
        property.owner_id
      );

      if (!ownerError && owner?.user?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousell-immo.app";
        const editUrl = `${baseUrl}/compte/biens/edit/${propertyId}`;

        // Notifier l'utilisateur
        await notifyUser({
          userId: property.owner_id,
          type: "warning",
          title: "⚠️ Annonce refusée",
          message: `Votre annonce "${property.title}" a été refusée. Motif : ${rejectionReason}`,
          resourcePath: `/compte/mes-biens`,
        });

        // Envoyer email de refus
        await sendEmail({
          to: owner.user.email,
          subject: `Votre annonce "${property.title}" a été refusée`,
          user_id: property.owner_id,
          react: ListingRejectedEmail({
            propertyTitle: property.title,
            rejectionReason,
            editUrl,
          }),
        });
      }
    } catch (error) {
      console.error("Error getting owner email:", error);
      // Continue même si on ne peut pas envoyer l'email
    }
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/compte/mes-biens");

  return { success: true };
}

/**
 * Certify ad and associated document from user vault
 * Handles both global (identity) and specific (property) certification scopes
 */
export async function certifyAdAndDocument(
  propertyId: string,
  documentId: string | null
) {
  // Verify user has moderation rights
  await requireAnyRole(["admin", "moderateur", "superadmin"]);

  if (!documentId) {
    // No document attached, just approve the property
    return await moderateProperty(propertyId, "approved");
  }

  const supabase = await createClient();

  try {
    // 1. Get document info to determine certification scope
    const { data: doc, error: docError } = await supabase
      .from("user_documents")
      .select("certification_scope, user_id, file_type")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      console.error("❌ Error fetching document:", docError);
      return { error: "Document introuvable" };
    }

    // 2. If scope is GLOBAL (Identity documents like CNI/Passport), certify the user's profile
    if (doc.certification_scope === "global") {
      console.log("🌍 Global scope detected - Certifying user profile:", doc.user_id);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_identity_verified: true })
        .eq("id", doc.user_id);

      if (profileError) {
        console.error("❌ Error certifying profile:", profileError);
        // Continue anyway, we'll still certify the document
      } else {
        console.log("✅ User profile certified");
      }
    }

    // 3. Certify the specific ad (property)
    console.log("📝 Certifying property:", propertyId);
    const { error: adError } = await supabase
      .from("properties")
      .update({
        validation_status: "approved",
        verification_status: "verified"
      })
      .eq("id", propertyId);

    if (adError) {
      console.error("❌ Error certifying property:", adError);
      return { error: "Erreur lors de la certification de l'annonce" };
    }

    // 4. Mark the document as certified and change source to 'verification'
    console.log("🔐 Certifying document:", documentId);
    const { error: certifyError } = await supabase
      .from("user_documents")
      .update({
        is_certified: true,
        source: "verification"
      })
      .eq("id", documentId);

    if (certifyError) {
      console.error("❌ Error certifying document:", certifyError);
      return { error: "Erreur lors de la certification du document" };
    }

    // 5. Call the regular moderation function to handle emails/notifications
    await moderateProperty(propertyId, "approved");

    console.log("✅ Certification completed successfully");

    revalidatePath("/admin/moderation");
    revalidatePath("/compte/mes-documents");
    revalidatePath("/compte/mes-biens");

    return { success: true };
  } catch (error) {
    console.error("❌ Unexpected error during certification:", error);
    return { error: "Erreur technique lors de la certification" };
  }
}

