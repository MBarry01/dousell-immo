"use server";

import VisitRequestEmail from "@/emails/visit-request-email";
import { sendEmail, getAdminEmail } from "@/lib/mail";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";
import { createAdminClient } from "@/utils/supabase/admin";
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

  // Utiliser le client admin pour bypasser RLS (formulaire public, sécurisé par Turnstile)
  const supabase = createAdminClient();
  const payload = parsed.data;

  // Insérer dans la table visit_requests
  const { data, error } = await supabase.from("visit_requests").insert({
    full_name: payload.fullName,
    phone: payload.phone,
    project_type: payload.projectType,
    availability: payload.availability,
    message: payload.message,
    status: "nouveau",
  }).select().single();

  if (error) {
    console.error("❌ Error inserting visit request:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer la demande. Réessayez plus tard.",
    };
  }

  // Envoyer l'email à l'admin
  try {
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
  } catch (emailError) {
    console.error("⚠️ Erreur lors de l'envoi de l'email:", emailError);
    // Ne pas bloquer le processus si l'email échoue
  }

  // Notifier tous les admins et modérateurs
  try {
    const { notifyModeratorsAndAdmins } = await import("@/lib/notifications-helpers");
    await notifyModeratorsAndAdmins({
      type: "info",
      title: "Nouveau lead",
      message: `${payload.fullName} (${payload.phone}) a fait une demande de visite pour ${payload.projectType}`,
      resourcePath: "/admin/leads",
    });
  } catch (error) {
    console.error("⚠️ Erreur lors de la notification des modérateurs:", error);
    // Ne pas bloquer le processus si la notification échoue
  }

  return { success: true };
}

