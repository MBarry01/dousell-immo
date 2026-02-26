import {
  sendEmail as sendEmailGmail,
  sendInvoiceEmail as sendInvoiceEmailGmail,
  getAdminEmail as getAdminEmailGmail,
  sendActivationApprovedEmail as sendActivationApprovedEmailGmail,
  sendActivationRejectedEmail as sendActivationRejectedEmailGmail
} from "./mail-gmail";
import {
  sendEmailResend,
  sendInvoiceEmailResend
} from "./mail-resend";
import { render } from "@react-email/render";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import React from "react";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_ROLES = ["admin", "moderateur", "superadmin"];

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  from?: string; // Conservé pour compatibilité
  fromName?: string;
  user_id?: string | null;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
};

/**
 * Fonction générique pour envoyer des emails.
 * Priorise Resend si RESEND_API_KEY est présent, sinon utilise Gmail.
 */
export async function sendEmail(options: SendEmailOptions) {
  // Si react est fourni, le convertir en HTML pour les deux services si nécessaire
  let emailHtml = options.html;
  if (options.react && !options.html) {
    emailHtml = await render(options.react);
  }

  // Si l'API Resend est configurée, on l'utilise en priorité
  if (process.env.RESEND_API_KEY) {
    const result = await sendEmailResend({
      ...options,
      html: emailHtml,
    });

    if (!result.error) return result;

    console.warn("⚠️ Resend failed, falling back to Gmail:", result.error);
  }

  return sendEmailGmail({
    ...options,
    html: emailHtml,
  });
}

/**
 * Fonction pour envoyer une facture par email
 */
export async function sendInvoiceEmail(params: {
  to: string;
  clientName: string;
  pdfBuffer: Buffer;
  invoiceNumber?: string;
  amount?: number;
}) {
  if (process.env.RESEND_API_KEY) {
    const result = await sendInvoiceEmailResend(params);
    if (!result.error) return result;
    console.warn("⚠️ Resend invoice failed, falling back to Gmail");
  }

  return sendInvoiceEmailGmail(params);
}

/**
 * Email de l'admin (pour les notifications)
 */
export function getAdminEmail() {
  return getAdminEmailGmail() || ADMIN_EMAIL;
}

/**
 * Retourne la liste des emails des admins et modérateurs pour les notifications critiques.
 * Fallback sur l'email admin principal si la configuration service role n'est pas disponible.
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const fallback = [getAdminEmail()].filter((email): email is string => Boolean(email));

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn("⚠️ Impossible de récupérer les emails des admins/modérateurs sans SUPABASE_SERVICE_ROLE_KEY");
    return fallback;
  }

  try {
    const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ADMIN_ROLES);

    if (roleError) {
      console.error("❌ Erreur lors de la récupération des rôles admin/modérateur:", roleError);
      return fallback;
    }

    const userIds = Array.from(
      new Set<string>(
        (roleRows ?? [])
          .map((row) => row.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (userIds.length === 0) {
      console.warn("⚠️ Aucun utilisateur avec un rôle admin/modérateur trouvé.");
      return fallback;
    }

    const uniqueEmails = new Set<string>(fallback as string[]);
    const perPage = 200;
    let page = 1;
    let fetchedAll = false;

    while (!fetchedAll) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("❌ Erreur lors de la récupération des utilisateurs admin/modérateur:", error);
        break;
      }

      const users = data?.users ?? [];
      users.forEach((user) => {
        if (user.email && userIds.includes(user.id)) {
          uniqueEmails.add(user.email.toLowerCase());
        }
      });

      fetchedAll = !users.length || users.length < perPage || uniqueEmails.size >= userIds.length;
      page += 1;
    }

    return Array.from(uniqueEmails);
  } catch (error) {
    console.error("❌ Erreur inattendue dans getAdminNotificationEmails:", error);
    return fallback;
  }
}

export async function sendActivationApprovedEmail(params: {
  to: string;
  firstName: string;
}) {
  return sendActivationApprovedEmailGmail(params);
}

export async function sendActivationRejectedEmail(params: {
  to: string;
  firstName: string;
  reason: string;
}) {
  return sendActivationRejectedEmailGmail(params);
}
