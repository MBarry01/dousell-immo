import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️ RESEND_API_KEY is not set. Email functionality will be disabled.");
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "Doussel Immo <noreply@doussel.immo>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "barrymohamadou98@gmail.com";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
};

/**
 * Fonction générique pour envoyer des emails via Resend
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = FROM_EMAIL,
}: SendEmailOptions) {
  if (!resend) {
    console.warn("📧 Email not sent (Resend not configured):", { to, subject });
    return { success: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    console.log("✅ Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

/**
 * Email de l'admin (pour les notifications)
 */
export function getAdminEmail() {
  return ADMIN_EMAIL;
}

