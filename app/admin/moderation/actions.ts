"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/mail";
import { ListingApprovedEmail } from "@/emails/listing-approved-email";
import { ListingRejectedEmail } from "@/emails/listing-rejected-email";
import { notifyUser } from "@/lib/notifications";

export async function moderateProperty(
  propertyId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();

  // Récupérer les infos du bien avant modification
  const { data: property } = await supabase
    .from("properties")
    .select("title, owner_id")
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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.app";
        const propertyUrl = `${baseUrl}/biens/${propertyId}`;

        if (status === "approved") {
          // Notifier l'utilisateur
          await notifyUser({
            userId: property.owner_id,
            type: "success",
            title: "✅ Votre annonce est en ligne !",
            message: `Votre annonce "${property.title}" a été approuvée et est maintenant visible sur Doussel Immo.`,
            resourcePath: `/biens/${propertyId}`,
          });

          // Envoyer email d'approbation
          await sendEmail({
            to: owner.user.email,
            subject: `🎉 Votre annonce "${property.title}" est en ligne !`,
            react: ListingApprovedEmail({
              propertyTitle: property.title,
              propertyUrl,
            }),
          });
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

  return { success: true };
}

/**
 * Modérer un bien avec un motif de refus
 */
export async function moderatePropertyWithReason(
  propertyId: string,
  rejectionReason: string
) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Admin non authentifié." };
  }

  const authorizedAdminEmail = "barrymohamadou98@gmail.com";
  if (user.email?.toLowerCase() !== authorizedAdminEmail.toLowerCase()) {
    return { error: "Accès non autorisé pour la modération." };
  }

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
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.app";
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

