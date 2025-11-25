import { sendEmailViaSupabase } from "./mail-supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "barrymohamadou98@gmail.com";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string; // Conservé pour compatibilité mais non utilisé (géré par Edge Function)
  fromName?: string;
  user_id?: string | null;
};

/**
 * Fonction générique pour envoyer des emails via l'Edge Function Supabase
 * Cette fonction utilise send-email-resend qui gère l'envoi via Resend et le logging
 */
export async function sendEmail({
  to,
  subject,
  react,
  fromName = "Dousell Immo",
  user_id = null,
}: SendEmailOptions) {
  return sendEmailViaSupabase({
    to,
    subject,
    react,
    fromName,
    user_id,
  });
}

/**
 * Email de l'admin (pour les notifications)
 */
export function getAdminEmail() {
  return ADMIN_EMAIL;
}

