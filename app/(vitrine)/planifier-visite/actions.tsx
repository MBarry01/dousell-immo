"use server";

import VisitRequestEmail from "@/emails/visit-request-email";
import { sendEmail, getAdminEmail } from "@/lib/mail";
import {
  visitRequestSchema,
  type VisitRequestFormValues,
} from "@/lib/schemas/visit-request";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createCalendarEventWithMeet } from "@/lib/google-calendar";
import { z } from "zod";

// Schema pour les rendez-vous via scheduler (simplifié - user connecté)
const appointmentSchema = z.object({
  date: z.string(), // ISO date string
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format heure invalide"),
  meetingType: z.enum(["visite", "consultation"]).default("visite"),
  meetingMode: z.enum(["in_person", "online"]).default("in_person"),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// Lien Zoom de réunion permanente Dousell (à configurer dans les variables d'environnement)
const ZOOM_MEETING_URL = process.env.ZOOM_MEETING_URL || "https://zoom.us/j/dousellimmo";

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
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.warn("⚠️ Admin email non configuré, notification ignorée");
    return { success: true };
  }

  try {
    await sendEmail({
      to: adminEmail,
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

/**
 * Créer un rendez-vous via le scheduler
 * Récupère automatiquement les infos de l'utilisateur connecté
 */
export async function createAppointment(values: AppointmentFormValues) {
  const parsed = appointmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides. Veuillez vérifier les informations.",
    };
  }

  // Récupérer l'utilisateur connecté
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Vous devez être connecté pour prendre rendez-vous.",
      requiresAuth: true,
    };
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.user_metadata?.full_name || "Client";
  const userPhone = profile?.phone || user.user_metadata?.phone || "";
  const userEmail = profile?.email || user.email || "";

  const adminSupabase = createAdminClient();
  const payload = parsed.data;

  // Formater la date et l'heure pour l'affichage
  const appointmentDate = new Date(payload.date);
  const formattedDate = appointmentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Générer le lien Google Calendar
  const [hours, minutes] = payload.time.split(":").map(Number);
  const startDate = new Date(appointmentDate);
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + 30); // 30 min de durée

  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  // Déterminer le lieu et générer le lien Meet si en ligne
  const isOnline = payload.meetingMode === "online";
  let meetLink: string | null = null;
  let meetingLocation = isOnline ? "Visioconférence Google Meet" : "Dakar, Sénégal";

  // Créer l'événement Google Calendar avec Meet si en ligne
  if (isOnline) {
    // Attendees removed to avoid "Service accounts cannot invite" error
    // We will just generate the link and send it via our own email system

    const calendarResult = await createCalendarEventWithMeet({
      summary: `${payload.meetingType === "visite" ? "Visite immobilière" : "Consultation"} - ${userName}`,
      description: `Rendez-vous avec ${userName}\nTéléphone: ${userPhone}\nEmail: ${userEmail}\n\nType: ${payload.meetingType === "visite" ? "Visite immobilière" : "Consultation"}`,
      startTime: startDate,
      endTime: endDate,
    });

    if (calendarResult.success && calendarResult.meetLink) {
      meetLink = calendarResult.meetLink;
      meetingLocation = meetLink;
      console.log("✅ Lien Google Meet généré:", meetLink);
    } else {
      console.warn("⚠️ Impossible de créer le lien Meet:", calendarResult.error);
      // Fallback: continuer sans lien Meet
    }
  }

  // Générer le lien Google Calendar pour l'utilisateur (ajout manuel)
  const googleCalendarDetails = isOnline && meetLink
    ? `Rendez-vous en visioconférence avec l'équipe Dousell Immo.\n\nType: ${payload.meetingType === "visite" ? "Visite immobilière" : "Consultation"}\n\n🔗 Lien Google Meet: ${meetLink}\n\nUn conseiller vous contactera pour confirmer les détails.`
    : `Rendez-vous avec l'équipe Dousell Immo.\n\nType: ${payload.meetingType === "visite" ? "Visite immobilière" : "Consultation"}\n\nUn conseiller vous contactera pour confirmer les détails.`;

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${payload.meetingType === "visite" ? "Visite immobilière" : "Consultation"}${isOnline ? " (Visio)" : ""} - Dousell Immo`
  )}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(
    googleCalendarDetails
  )}&location=${encodeURIComponent(meetingLocation)}`;

  // Insérer dans la table visit_requests
  const modeLabel = isOnline ? "En ligne (Meet)" : "En personne";
  const { data, error } = await adminSupabase.from("visit_requests").insert({
    full_name: userName,
    phone: userPhone,
    email: userEmail,
    project_type: payload.meetingType,
    availability: `${formattedDate} à ${payload.time} - ${modeLabel}`,
    message: `Rendez-vous confirmé pour le ${formattedDate} à ${payload.time} (${modeLabel})${isOnline && meetLink ? `\nLien Meet: ${meetLink}` : ""}`,
    status: "rdv_confirme",
    user_id: user.id,
  }).select().single();

  if (error) {
    console.error("❌ Error inserting appointment:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer le rendez-vous. Réessayez plus tard.",
    };
  }

  // Envoyer l'email de confirmation à l'admin
  const meetingTypeLabel = payload.meetingType === "visite" ? "Visite immobilière" : "Consultation";
  try {
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau rendez-vous</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(15,23,42,0.08);">
                <tr>
                  <td style="padding: 32px;">
                    <h1 style="font-size: 24px; color: #0f172a; margin: 0 0 16px 0;">📅 Nouveau rendez-vous${isOnline ? " (Visio)" : ""}</h1>
                    <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0;">Un nouveau rendez-vous a été pris via le scheduler en ligne.</p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">NOM COMPLET</p>
                          <p style="font-size: 15px; color: #0f172a; margin: 0 0 16px 0;">${userName}</p>

                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">TÉLÉPHONE</p>
                          <p style="font-size: 15px; color: #0f172a; margin: 0 0 16px 0;">${userPhone || "Non renseigné"}</p>

                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">EMAIL</p>
                          <p style="font-size: 15px; color: #0f172a; margin: 0 0 16px 0;">${userEmail || "Non renseigné"}</p>

                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">TYPE DE RENDEZ-VOUS</p>
                          <p style="font-size: 15px; color: #0f172a; margin: 0 0 16px 0;">${meetingTypeLabel}</p>

                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">MODE</p>
                          <p style="font-size: 15px; color: #0f172a; margin: 0 0 16px 0;">${modeLabel}</p>

                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 0 0 4px 0;">DATE ET HEURE</p>
                          <p style="font-size: 15px; color: #F4C430; font-weight: 600; margin: 0;">${formattedDate} à ${payload.time}</p>

                          ${isOnline && meetLink ? `
                          <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin: 16px 0 4px 0;">🔗 LIEN GOOGLE MEET</p>
                          <p style="font-size: 15px; margin: 0;"><a href="${meetLink}" style="color: #2563eb;">${meetLink}</a></p>
                          ` : ""}
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 13px; color: #94a3b8; margin: 0;">Rendez-vous pris via le scheduler en ligne.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const adminEmailAddr = getAdminEmail();
    if (adminEmailAddr) {
      await sendEmail({
        to: adminEmailAddr,
        subject: `📅 Nouveau RDV${isOnline ? " (Visio)" : ""}: ${userName} - ${formattedDate} à ${payload.time}`,
        html: adminEmailHtml,
      });
    }
  } catch (emailError) {
    console.error("⚠️ Erreur lors de l'envoi de l'email admin:", emailError);
  }

  // Envoyer email de confirmation au client
  if (userEmail) {
    try {
      const clientEmailHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de rendez-vous</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding: 32px;">
                      <p style="text-align: center; font-size: 32px; margin: 0 0 16px 0;">✓</p>
                      <h1 style="text-align: center; font-size: 24px; color: #0f172a; margin: 0 0 16px 0;">Rendez-vous confirmé !</h1>
                      <p style="font-size: 16px; color: #0f172a; margin: 0 0 8px 0;">Bonjour ${userName},</p>
                      <p style="font-size: 15px; color: #475569; line-height: 1.5; margin: 0 0 24px 0;">Votre rendez-vous ${isOnline ? "en visioconférence" : ""} avec l'équipe Dousell Immo est bien enregistré.</p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef9e7; border: 1px solid #F4C430; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; margin: 0 0 2px 0;">📅 DATE</p>
                            <p style="font-size: 16px; color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">${formattedDate}</p>

                            <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; margin: 0 0 2px 0;">🕐 HEURE</p>
                            <p style="font-size: 16px; color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">${payload.time}</p>

                            <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; margin: 0 0 2px 0;">📍 TYPE</p>
                            <p style="font-size: 16px; color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">${meetingTypeLabel}</p>

                            <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8; margin: 0 0 2px 0;">🖥️ MODE</p>
                            <p style="font-size: 16px; color: #0f172a; font-weight: 600; margin: 0;">${modeLabel}</p>
                          </td>
                        </tr>
                      </table>

                      ${isOnline && meetLink ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 16px; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="font-size: 14px; color: #0369a1; margin: 0 0 12px 0; font-weight: 600;">🎥 Rejoindre la réunion Google Meet</p>
                            <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                              Rejoindre la réunion
                            </a>
                            <p style="font-size: 12px; color: #64748b; margin: 12px 0 0 0;">${meetLink}</p>
                          </td>
                        </tr>
                      </table>
                      ` : ""}

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background-color: #F4C430; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                              📅 Ajouter à Google Agenda
                            </a>
                          </td>
                        </tr>
                      </table>

                      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                      <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
                        Un conseiller Dousell vous contactera${userPhone ? ` au ${userPhone}` : ""} pour confirmer les détails de votre rendez-vous.
                      </p>

                      <p style="text-align: center; font-size: 14px; color: #0f172a; margin: 0;">À très bientôt !</p>
                      <p style="text-align: center; font-size: 14px; color: #F4C430; font-weight: 600; margin: 4px 0 0 0;">L'équipe Dousell Immo</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await sendEmail({
        to: userEmail,
        subject: `Confirmation de votre rendez-vous${isOnline ? " (Visio)" : ""} - Dousell Immo`,
        html: clientEmailHtml,
      });
    } catch (emailError) {
      console.error("⚠️ Erreur lors de l'envoi de l'email client:", emailError);
    }
  }

  // Notifier les admins/modérateurs
  try {
    const { notifyModeratorsAndAdmins } = await import("@/lib/notifications-helpers");
    await notifyModeratorsAndAdmins({
      type: "info",
      title: "Nouveau rendez-vous",
      message: `${userName} a pris RDV le ${formattedDate} à ${payload.time}`,
      resourcePath: "/admin/leads",
    });
  } catch (error) {
    console.error("⚠️ Erreur notification:", error);
  }

  return {
    success: true,
    data: {
      id: data.id,
      date: formattedDate,
      time: payload.time,
      userName,
      meetingType: payload.meetingType === "visite" ? "Visite immobilière" : "Consultation",
      meetingMode: modeLabel,
      googleCalendarUrl,
      meetLink,
    }
  };
}

