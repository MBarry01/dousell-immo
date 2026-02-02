"use server";

import { createClient } from "@/utils/supabase/server";
import { generateTenantAccessToken, getTenantMagicLinkUrl } from "@/lib/tenant-magic-link";
import { sendEmail } from "@/lib/mail";

// Rate limiting: store last request time per email
const rateLimitCache = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

/**
 * Request a new tenant access link by email
 *
 * Security measures:
 * - Rate limited to 1 request per hour per email
 * - Generic response to prevent email enumeration
 * - Only sends if email matches an active lease
 *
 * @param email - The tenant's email address
 */
export async function requestNewTenantLink(email: string) {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit
  const lastRequest = rateLimitCache.get(normalizedEmail);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    return {
      error: "Vous avez déjà demandé un lien récemment. Veuillez attendre une heure avant de réessayer.",
    };
  }

  // Update rate limit
  rateLimitCache.set(normalizedEmail, Date.now());

  const supabase = await createClient();

  // Find active lease with this email
  const { data: lease } = await supabase
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
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Always return success to prevent email enumeration
  // But only send email if lease exists
  if (lease) {
    try {
      // Generate new token
      const token = await generateTenantAccessToken(lease.id);
      const magicLink = getTenantMagicLinkUrl(token);

      // Send email
      await sendEmail({
        to: normalizedEmail,
        subject: "Nouveau lien d'accès - Dousell Immo",
        html: `
          <h2>Bonjour ${lease.tenant_name},</h2>
          <p>Vous avez demandé un nouveau lien pour accéder à votre espace locataire.</p>
          <p>Bien concerné : <strong>${(lease.property as unknown as { title: string } | null)?.title || lease.property_address || "Votre logement"}</strong></p>
          <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #F4C430; color: black; text-decoration: none; border-radius: 8px; font-weight: 600;">Accéder à mon espace locataire</a></p>
          <p style="color: #666; font-size: 14px;">Ce lien est valable 7 jours.</p>
          <p style="color: #666; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr />
          <p style="color: #999; font-size: 12px;">Dousell Immo - Gestion Locative</p>
        `,
      });
    } catch (error) {
      console.error("Error sending tenant magic link:", error);
      // Don't reveal error to user
    }
  }

  return { success: true };
}
