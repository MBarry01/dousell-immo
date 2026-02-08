"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { generateTenantAccessToken, getTenantMagicLinkUrl } from "@/lib/tenant-magic-link";
import { sendEmail } from "@/lib/mail";

const RATE_LIMIT_HOURS = 1;

/**
 * Check rate limit via DB: has a token been generated for this email in the last hour?
 * Persistent across deploys (unlike in-memory Map).
 */
async function isRateLimited(supabase: ReturnType<typeof createAdminClient>, normalizedEmail: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();

  // Find leases with this email that had a token generated recently
  const { data: recentLeases } = await supabase
    .from("leases")
    .select("id")
    .eq("tenant_email", normalizedEmail)
    .eq("status", "active");

  if (!recentLeases?.length) return false;

  const leaseIds = recentLeases.map((l) => l.id);

  const { count } = await supabase
    .from("tenant_access_logs")
    .select("id", { count: "exact", head: true })
    .in("lease_id", leaseIds)
    .eq("action", "token_generated")
    .gt("created_at", oneHourAgo);

  return (count ?? 0) > 0;
}

/**
 * Request a new tenant access link by email
 *
 * Security measures:
 * - Rate limited to 1 request per hour per email (via DB, persistent)
 * - Generic response to prevent email enumeration
 * - Only sends if email matches an active lease
 * - Handles multiple active leases for the same email
 *
 * @param email - The tenant's email address
 */
export async function requestNewTenantLink(email: string) {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createAdminClient();

  // Check rate limit via DB (persistent across deploys)
  if (await isRateLimited(supabase, normalizedEmail)) {
    return {
      error: "Vous avez déjà demandé un lien récemment. Veuillez attendre une heure avant de réessayer.",
    };
  }

  // Find ALL active leases with this email (P7: multi-baux)
  const { data: leases } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      property_address,
      property:properties (
        title
      )
    `)
    .eq("tenant_email", normalizedEmail)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Always return success to prevent email enumeration
  // But only send email if leases exist
  if (leases && leases.length > 0) {
    try {
      if (leases.length === 1) {
        // Single lease: send one magic link
        const lease = leases[0];
        const token = await generateTenantAccessToken(lease.id);
        const magicLink = getTenantMagicLinkUrl(token);

        await sendEmail({
          to: normalizedEmail,
          subject: "Nouveau lien d'accès - Dousell Immo",
          html: `
            <h2>Bonjour ${lease.tenant_name},</h2>
            <p>Vous avez demandé un nouveau lien pour accéder à votre espace locataire.</p>
            <p>Bien concerné : <strong>${(lease.property as unknown as { title: string } | null)?.title || lease.property_address || "Votre logement"}</strong></p>
            <p><a href="${magicLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #F4C430; color: black; text-decoration: none; border-radius: 8px; font-weight: 600;">Accéder à mon espace locataire</a></p>
            <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">
              Le lien ne fonctionne pas ? Copiez et collez cette URL dans votre navigateur :<br>
              <code style="background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 5px; word-break: break-all; font-size: 11px;">${magicLink}</code>
            </p>
            <p style="color: #666; font-size: 14px;">Ce lien est valable 7 jours.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            <hr />
            <p style="color: #999; font-size: 12px;">Dousell Immo - Gestion Locative</p>
          `,
        });
      } else {
        // Multiple leases: generate a link per lease and list them
        const links = await Promise.all(
          leases.map(async (lease) => {
            const token = await generateTenantAccessToken(lease.id);
            const magicLink = getTenantMagicLinkUrl(token);
            const propertyName = (lease.property as unknown as { title: string } | null)?.title || lease.property_address || "Logement";
            return { magicLink, propertyName };
          })
        );

        const linksHtml = links
          .map(
            ({ magicLink, propertyName }) =>
              `<li style="margin-bottom: 16px;">
                <strong>${propertyName}</strong><br/>
                <a href="${magicLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 6px; padding: 10px 20px; background-color: #F4C430; color: black; text-decoration: none; border-radius: 8px; font-weight: 600;">Accéder</a><br/>
                <span style="color: #6b7280; font-size: 11px; display: block; margin-top: 6px; word-break: break-all;">${magicLink}</span>
              </li>`
          )
          .join("");

        await sendEmail({
          to: normalizedEmail,
          subject: "Nouveaux liens d'accès - Dousell Immo",
          html: `
            <h2>Bonjour ${leases[0].tenant_name},</h2>
            <p>Vous avez demandé de nouveaux liens pour accéder à vos espaces locataires.</p>
            <p>Vous avez <strong>${leases.length} baux actifs</strong> :</p>
            <ul style="list-style: none; padding: 0;">${linksHtml}</ul>
            <p style="color: #666; font-size: 14px;">Ces liens sont valables 7 jours.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            <hr />
            <p style="color: #999; font-size: 12px;">Dousell Immo - Gestion Locative</p>
          `,
        });
      }
    } catch (error) {
      console.error("Error sending tenant magic link:", error);
      // Don't reveal error to user
    }
  }

  return { success: true };
}
