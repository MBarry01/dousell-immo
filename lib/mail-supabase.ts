/**
 * Fonction pour envoyer des emails via l'Edge Function Supabase send-email-resend
 * Cette fonction remplace l'appel direct à Resend et utilise l'infrastructure Supabase
 */

import { render } from "@react-email/render";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const APP_INVOKE_KEY = process.env.APP_INVOKE_KEY;

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  fromName?: string;
  user_id?: string | null;
};

/**
 * Envoie un email via l'Edge Function Supabase send-email-resend
 */
export async function sendEmailViaSupabase({
  to,
  subject,
  react,
  fromName = "Dousel",
  user_id = null,
}: SendEmailOptions) {
  if (!SUPABASE_URL) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set");
    return { success: false, error: "Supabase URL not configured" };
  }

  if (!APP_INVOKE_KEY) {
    console.error("❌ APP_INVOKE_KEY is not set");
    return { success: false, error: "APP_INVOKE_KEY not configured" };
  }

  try {
    // Convertir le composant React en HTML
    const html = await render(react);

    // Préparer les destinataires (peut être un tableau ou une string)
    const recipients = Array.isArray(to) ? to : [to];

    // Envoyer à chaque destinataire
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/send-email-resend`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${APP_INVOKE_KEY}`,
            },
            body: JSON.stringify({
              to: recipient,
              subject,
              html,
              fromName,
              user_id,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return await response.json();
      })
    );

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("❌ Error sending email via Supabase Edge Function:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

