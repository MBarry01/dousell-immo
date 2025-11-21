"use server";

import VisitRequestEmail from "@/emails/visit-request-email";
import { sendEmail, getAdminEmail } from "@/lib/mail";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";
import { createClient } from "@/utils/supabase/server";

export async function createVisitRequest(values: VisitRequestFormValues) {
  const parsed = visitRequestSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Formulaire invalide, merci de vérifier les champs.",
    };
  }

  const supabase = await createClient();
  const payload = parsed.data;

  const { error } = await supabase.from("visit_requests").insert({
    full_name: payload.fullName,
    phone: payload.phone,
    project_type: payload.projectType,
    availability: payload.availability,
    message: payload.message,
    status: "pending",
  });

  if (error) {
    console.error("visit_requests insert error", error);
    return {
      success: false,
      error: "Impossible d'enregistrer la demande. Réessayez plus tard.",
    };
  }

  await sendEmail({
    to: getAdminEmail(),
    subject: "Nouvelle demande de visite · Doussel Immo",
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

  return { success: true };
}

