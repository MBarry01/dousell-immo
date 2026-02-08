/**
 * List all active leases with their IDs
 *
 * Usage:
 *   npx tsx scripts/list-active-leases.ts
 *   npx tsx scripts/list-active-leases.ts --email tenant@example.com
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listActiveLeases(filterEmail?: string) {
  console.log("🔍 Fetching active leases...\n");

  let query = supabase
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      tenant_phone,
      monthly_amount,
      start_date,
      end_date,
      status,
      property_address,
      tenant_access_token,
      tenant_token_expires_at,
      tenant_token_verified,
      tenant_last_access_at,
      created_at,
      property:properties (
        title
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filterEmail) {
    query = query.eq("tenant_email", filterEmail.toLowerCase().trim());
  }

  const { data: leases, error } = await query;

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  if (!leases || leases.length === 0) {
    console.log("📭 No active leases found");
    if (filterEmail) {
      console.log(`   (for email: ${filterEmail})`);
    }
    return;
  }

  console.log(`✅ Found ${leases.length} active lease(s)\n`);
  console.log("=".repeat(100));

  leases.forEach((lease, idx) => {
    const property = (lease.property as any)?.title || lease.property_address || "Unknown property";
    const hasToken = !!lease.tenant_access_token;
    const tokenExpired = lease.tenant_token_expires_at
      ? new Date(lease.tenant_token_expires_at) < new Date()
      : true;
    const lastAccess = lease.tenant_last_access_at
      ? new Date(lease.tenant_last_access_at).toLocaleString("fr-FR")
      : "Never";

    console.log(`\n${idx + 1}. ${lease.tenant_name}`);
    console.log(`   Email:        ${lease.tenant_email || "N/A"}`);
    console.log(`   Phone:        ${lease.tenant_phone || "N/A"}`);
    console.log(`   Property:     ${property}`);
    console.log(`   Rent:         ${(lease.monthly_amount || 0).toLocaleString()} FCFA/month`);
    console.log(`   Lease Period: ${lease.start_date} → ${lease.end_date || "Open-ended"}`);
    console.log(`   Created:      ${new Date(lease.created_at).toLocaleString("fr-FR")}`);
    console.log();
    console.log(`   🔑 Lease ID:  ${lease.id}`);
    console.log();
    console.log(`   Portal Access:`);
    console.log(`     Token exists:  ${hasToken ? "✅ Yes" : "❌ No"}`);
    if (hasToken) {
      console.log(`     Token status:  ${tokenExpired ? "⚠️  Expired" : "✅ Valid"}`);
      console.log(`     Verified:      ${lease.tenant_token_verified ? "✅ Yes" : "❌ No"}`);
      console.log(`     Expires at:    ${new Date(lease.tenant_token_expires_at).toLocaleString("fr-FR")}`);
    }
    console.log(`     Last access:   ${lastAccess}`);

    console.log("\n   " + "-".repeat(96));
  });

  console.log("\n" + "=".repeat(100));
  console.log("\n💡 To resend a magic link:");
  console.log(`   npx tsx scripts/resend-tenant-magic-link.ts <lease_id>`);
  console.log(`   npx tsx scripts/resend-tenant-magic-link.ts --email <email>`);
  console.log();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage:");
    console.log("  List all active leases:");
    console.log("    npx tsx scripts/list-active-leases.ts\n");
    console.log("  Filter by email:");
    console.log("    npx tsx scripts/list-active-leases.ts --email tenant@example.com\n");
    return;
  }

  let filterEmail: string | undefined;

  if (args[0] === "--email" || args[0] === "-e") {
    if (!args[1]) {
      console.error("❌ Email address required");
      process.exit(1);
    }
    filterEmail = args[1];
  }

  await listActiveLeases(filterEmail);
}

main();
