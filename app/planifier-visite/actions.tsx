"use server";

import VisitRequestEmail from "@/emails/visit-request-email";
import { sendEmail, getAdminEmail } from "@/lib/mail";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";
import { createClient } from "@/utils/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";

// Alias pour compatibilité
export async function submitLead(values: VisitRequestFormValues, turnstileToken?: string) {
  return createVisitRequest(values, turnstileToken);
}

export async function createVisitRequest(values: VisitRequestFormValues, turnstileToken?: string) {
  const parsed = visitRequestSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Formulaire invalide, merci de vérifier les champs.",
    };
  }

  // Vérification Turnstile
  if (!turnstileToken) {
    return {
      success: false,
      error: "Vérification anti-robot requise. Veuillez réessayer.",
    };
  }

  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) {
    return {
      success: false,
      error: verification.error || "Vérification anti-robot échouée. Veuillez réessayer.",
    };
  }

  const supabase = await createClient();
  const payload = parsed.data;

  // Insérer dans la table leads
  const { data, error } = await supabase.from("leads").insert({
    full_name: payload.fullName,
    phone: payload.phone,
    project_type: payload.projectType,
    availability: payload.availability,
    message: payload.message,
    status: "nouveau",
    source: "planifier-visite",
  }).select().single();

  if (error) {
    console.error("leads insert error", error);
    return {
      success: false,
      error: "Impossible d'enregistrer la demande. Réessayez plus tard.",
    };
  }

  // Envoyer l'email à l'admin
  await sendEmail({
    to: getAdminEmail(),
    subject: "Nouvelle demande de visite · Dousell Immo",
    react: (
      <VisitRequestEmail
        fullName={payload.fullName}
        phone={payload.phone}
        projectType={payload.projectType}
        availability={
          payload.availability === "semaine-matin"
            ? "En semaine (Matin)"
            : payload.availability === "semaine-apres-midi"
              ? "En semaine (Après-midi)"
              : "Le week-end"
        }
        message={payload.message}
      />
    ),
  });

  // Notifier tous les admins et modérateurs
  try {
    const { notifyModeratorsAndAdmins } = await import("@/lib/notifications-helpers");
    const notificationResult = await notifyModeratorsAndAdmins({
      type: "info",
      title: "Nouveau lead",
      message: `${payload.fullName} (${payload.phone}) a fait une demande de visite pour ${payload.projectType}`,
      resourcePath: "/admin/leads",
    });

    if (!notificationResult.success) {
      console.error("❌ Erreur lors de la création des notifications:", notificationResult.errors);
    } else {
      console.log(`✅ ${notificationResult.notified} notifications créées pour le nouveau lead`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la notification des modérateurs:", error);
    // Ne pas bloquer le processus si la notification échoue
  }

  return { success: true };
}

