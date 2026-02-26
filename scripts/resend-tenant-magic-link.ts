/**
 * Script to resend a magic link to a tenant
 *
 * Usage:
 * 1. By lease ID:
 *    npx tsx scripts/resend-tenant-magic-link.ts <lease_id>
 *
 * 2. By tenant email:
 *    npx tsx scripts/resend-tenant-magic-link.ts --email <email>
 *
 * Examples:
 *   npx tsx scripts/resend-tenant-magic-link.ts 123e4567-e89b-12d3-a456-426614174000
 *   npx tsx scripts/resend-tenant-magic-link.ts --email tenant@example.com
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { generateTenantAccessToken, getTenantMagicLinkUrl } from "../lib/tenant-magic-link";
import { sendEmail } from "../lib/mail";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resendMagicLinkByLeaseId(leaseId: string) {
  console.log(`🔍 Looking up lease: ${leaseId}`);

  const { data: lease, error } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      property_address,
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

  return { lease };
}

async function resendMagicLinkByEmail(email: string) {
  console.log(`🔍 Looking up active leases for: ${email}`);

  const { data: leases, error } = await supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      property_address,
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
    console.log(`   ${idx + 1}. ${(lease.property as any)?.title || lease.property_address}`);
  });

  return { leases };
}

async function sendMagicLink(lease: any) {
  console.log(`\n🔑 Generating magic link token...`);
  const token = await generateTenantAccessToken(lease.id);
  const magicLink = getTenantMagicLinkUrl(token);

  console.log(`✅ Token generated (expires in 7 days)`);
  console.log(`🔗 Magic link: ${magicLink}`);

  if (!lease.tenant_email) {
    console.log("⚠️  No email - skipping email send");
    return;
  }

  console.log(`\n📧 Sending email to: ${lease.tenant_email}`);

  await sendEmail({
    to: lease.tenant_email,
    subject: "Invitation à votre Espace Locataire - Dousel",
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

            <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 15px;">
              Le lien ne fonctionne pas ? Copiez et collez cette URL dans votre navigateur :<br>
              <code style="background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 5px; word-break: break-all; font-size: 11px;">${magicLink}</code>
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              ⏰ Ce lien d'accès est personnel et valide pour <strong>7 jours</strong>.<br>
              🔒 Pour votre sécurité, vous devrez vérifier votre identité lors de votre première connexion.
            </p>

            <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Dousel - Gestion Locative</p>
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

  if (args.length === 0) {
    console.error("❌ Missing argument\n");
    console.log("Usage:");
    console.log("  By lease ID:    npx tsx scripts/resend-tenant-magic-link.ts <lease_id>");
    console.log("  By email:       npx tsx scripts/resend-tenant-magic-link.ts --email <email>\n");
    console.log("Examples:");
    console.log("  npx tsx scripts/resend-tenant-magic-link.ts 123e4567-e89b-12d3-a456-426614174000");
    console.log("  npx tsx scripts/resend-tenant-magic-link.ts --email tenant@example.com");
    process.exit(1);
  }

  try {
    if (args[0] === "--email" || args[0] === "-e") {
      if (!args[1]) {
        console.error("❌ Email address required");
        process.exit(1);
      }

      const { leases } = await resendMagicLinkByEmail(args[1]);

      // Send magic link for each lease
      for (let i = 0; i < leases.length; i++) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Processing lease ${i + 1}/${leases.length}`);
        console.log("=".repeat(60));
        await sendMagicLink(leases[i]);
      }

      if (leases.length > 1) {
        console.log(`\n✅ Sent ${leases.length} magic links to ${args[1]}`);
      }
    } else {
      const leaseId = args[0];
      const { lease } = await resendMagicLinkByLeaseId(leaseId);
      await sendMagicLink(lease);
    }

    console.log("\n🎉 All done!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
