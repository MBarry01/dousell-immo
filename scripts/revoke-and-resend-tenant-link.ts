/**
 * Revoke existing tenant token and send a fresh magic link
 *
 * This script is useful when:
 * - A tenant lost their previous link
 * - A token needs to be invalidated for security reasons
 * - You want to ensure a clean state before sending a new invitation
 *
 * Usage:
 *   npx tsx scripts/revoke-and-resend-tenant-link.ts <lease_id>
 *   npx tsx scripts/revoke-and-resend-tenant-link.ts --email <email>
 *
 * Examples:
 *   npx tsx scripts/revoke-and-resend-tenant-link.ts 123e4567-e89b-12d3-a456-426614174000
 *   npx tsx scripts/revoke-and-resend-tenant-link.ts --email tenant@example.com
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { generateTenantAccessToken, getTenantMagicLinkUrl, revokeTenantToken } from "../lib/tenant-magic-link";
import { sendEmail } from "../lib/mail";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function revokeLease(leaseId: string) {
  console.log(`🔍 Looking up lease: ${leaseId}`);

  const { data: lease, error } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      property_address,
      tenant_access_token,
      tenant_token_verified,
      tenant_token_expires_at,
      property:properties (
        title
      )
    `)
    .eq("id", leaseId)
    .single();

  if (error || !lease) {
    console.error("❌ Lease not found:", error?.message || "No data returned");
    process.exit(1);
  }

  if (lease.status !== "active") {
    console.error(`❌ Lease status is "${lease.status}" (must be "active")`);
    process.exit(1);
  }

  if (!lease.tenant_email) {
    console.error("❌ No email address for this tenant");
    process.exit(1);
  }

  console.log(`✅ Found lease for: ${lease.tenant_name} (${lease.tenant_email})`);
  console.log(`   Property: ${(lease.property as any)?.title || lease.property_address}`);

  // Show current token status
  if (lease.tenant_access_token) {
    const isExpired = lease.tenant_token_expires_at
      ? new Date(lease.tenant_token_expires_at) < new Date()
      : true;
    const isVerified = lease.tenant_token_verified || false;

    console.log(`\n📊 Current token status:`);
    console.log(`   Has token:    ✅ Yes`);
    console.log(`   Verified:     ${isVerified ? "✅ Yes" : "❌ No"}`);
    console.log(`   Status:       ${isExpired ? "⚠️  Expired" : "✅ Valid"}`);
    if (lease.tenant_token_expires_at) {
      console.log(`   Expires at:   ${new Date(lease.tenant_token_expires_at).toLocaleString("fr-FR")}`);
    }
  } else {
    console.log(`\n📊 Current token status: ❌ No token exists`);
  }

  return { lease };
}

async function revokeLeasesByEmail(email: string) {
  console.log(`🔍 Looking up active leases for: ${email}`);

  const { data: leases, error } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      property_address,
      tenant_access_token,
      tenant_token_verified,
      property:properties (
        title
      )
    `)
    .eq("tenant_email", email.toLowerCase().trim())
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !leases || leases.length === 0) {
    console.error("❌ No active leases found for this email:", error?.message || "No data returned");
    process.exit(1);
  }

  console.log(`✅ Found ${leases.length} active lease(s) for: ${leases[0].tenant_name}`);
  leases.forEach((lease, idx) => {
    const hasToken = !!lease.tenant_access_token;
    console.log(`   ${idx + 1}. ${(lease.property as any)?.title || lease.property_address} ${hasToken ? "🔑" : "❌"}`);
  });

  return { leases };
}

async function revokeAndResendMagicLink(lease: any) {
  const leaseId = lease.id;

  // Step 1: Revoke existing token (if any)
  if (lease.tenant_access_token) {
    console.log(`\n🔒 Revoking existing token...`);
    await revokeTenantToken(leaseId);
    console.log(`✅ Token revoked successfully`);
  } else {
    console.log(`\nℹ️  No existing token to revoke`);
  }

  // Step 2: Generate new token
  console.log(`\n🔑 Generating new magic link token...`);
  const token = await generateTenantAccessToken(leaseId);
  const magicLink = getTenantMagicLinkUrl(token);

  console.log(`✅ New token generated (expires in 7 days)`);
  console.log(`🔗 Magic link: ${magicLink}`);

  if (!lease.tenant_email) {
    console.log("⚠️  No email - skipping email send");
    return;
  }

  // Step 3: Send invitation email
  console.log(`\n📧 Sending invitation email to: ${lease.tenant_email}`);

  await sendEmail({
    to: lease.tenant_email,
    subject: "Invitation à votre Espace Locataire - Dousell",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .cta-button { display: inline-block; padding: 14px 32px; background-color: #F4C430; color: black; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .cta-button:hover { background-color: #d4a520; }
          .features { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features ul { margin: 10px 0; padding-left: 20px; }
          .features li { margin: 8px 0; }
          .alert { background: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Bienvenue sur votre Espace Locataire</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Bonjour <strong>${lease.tenant_name}</strong>,</p>

            ${lease.tenant_access_token ? `
            <div class="alert">
              <strong>⚠️ Nouveau lien d'accès</strong><br>
              Votre précédent lien a été révoqué. Utilisez ce nouveau lien pour accéder à votre espace.
            </div>
            ` : ""}

            <p>Vous avez été invité à accéder à votre espace locataire personnel pour le bien situé à :</p>
            <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-weight: 600;">
              📍 ${(lease.property as any)?.title || lease.property_address || "Votre logement"}
            </p>

            <div class="features">
              <p style="font-weight: 600; margin-bottom: 10px;">Depuis votre espace, vous pourrez :</p>
              <ul>
                <li>💳 Payer votre loyer en ligne</li>
                <li>📄 Télécharger vos quittances</li>
                <li>🔧 Signaler des problèmes de maintenance</li>
                <li>💬 Communiquer avec votre propriétaire</li>
                <li>📋 Accéder à vos documents de location</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${magicLink}" class="cta-button">Accéder à mon espace locataire</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              ⏰ Ce lien d'accès est personnel et valide pour <strong>7 jours</strong>.<br>
              🔒 Pour votre sécurité, vous devrez vérifier votre identité lors de votre première connexion.
            </p>

            <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Dousell Immo - Gestion Locative</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log("✅ Email sent successfully!");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Usage:");
    console.log("  Revoke and resend by lease ID:");
    console.log("    npx tsx scripts/revoke-and-resend-tenant-link.ts <lease_id>\n");
    console.log("  Revoke and resend by email:");
    console.log("    npx tsx scripts/revoke-and-resend-tenant-link.ts --email <email>\n");
    console.log("Examples:");
    console.log("  npx tsx scripts/revoke-and-resend-tenant-link.ts 123e4567-e89b-12d3-a456-426614174000");
    console.log("  npx tsx scripts/revoke-and-resend-tenant-link.ts --email tenant@example.com\n");
    console.log("What this script does:");
    console.log("  1. Finds the lease(s) for the specified tenant");
    console.log("  2. Revokes any existing magic link token (invalidates it)");
    console.log("  3. Generates a fresh new token (valid for 7 days)");
    console.log("  4. Sends an invitation email with the new magic link");
    process.exit(args.length === 0 ? 1 : 0);
  }

  try {
    if (args[0] === "--email" || args[0] === "-e") {
      if (!args[1]) {
        console.error("❌ Email address required");
        process.exit(1);
      }

      const { leases } = await revokeLeasesByEmail(args[1]);

      // Process each lease
      for (let i = 0; i < leases.length; i++) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Processing lease ${i + 1}/${leases.length}`);
        console.log("=".repeat(60));
        await revokeAndResendMagicLink(leases[i]);
      }

      if (leases.length > 1) {
        console.log(`\n✅ Revoked and sent ${leases.length} new magic links to ${args[1]}`);
      }
    } else {
      const leaseId = args[0];
      const { lease } = await revokeLease(leaseId);
      await revokeAndResendMagicLink(lease);
    }

    console.log("\n🎉 All done!");
    console.log("\n💡 The tenant will receive an email with a fresh magic link.");
    console.log("   Their previous link (if any) is now invalid.");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
