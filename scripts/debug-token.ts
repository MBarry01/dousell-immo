/**
 * Debug script to verify token generation and storage
 *
 * Usage:
 *   npx tsx scripts/debug-token.ts <lease_id>
 *   npx tsx scripts/debug-token.ts --email <email>
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

async function debugLeaseToken(leaseId: string) {
  console.log(`\n🔍 Debugging token for lease: ${leaseId}\n`);

  // Test with both clients
  const adminClient = createAdminClient();
  const anonClient = createClient(supabaseUrl, supabaseServiceKey);

  console.log("📊 Testing with Admin Client:");
  const { data: lease1, error: error1 } = await adminClient
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      tenant_access_token,
      tenant_token_expires_at,
      tenant_token_verified,
      property_address
    `)
    .eq("id", leaseId)
    .single();

  if (error1) {
    console.error("❌ Admin Client Error:", error1.message);
  } else if (lease1) {
    console.log("✅ Admin Client - Lease found:");
    console.log(`   Tenant: ${lease1.tenant_name} (${lease1.tenant_email})`);
    console.log(`   Status: ${lease1.status}`);
    console.log(`   Property: ${lease1.property_address}`);
    console.log(`   Has token: ${!!lease1.tenant_access_token ? "✅ Yes" : "❌ No"}`);
    if (lease1.tenant_access_token) {
      console.log(`   Token (first 20 chars): ${lease1.tenant_access_token.substring(0, 20)}...`);
      console.log(`   Token verified: ${lease1.tenant_token_verified ? "✅ Yes" : "❌ No"}`);
      console.log(`   Token expires: ${lease1.tenant_token_expires_at || "N/A"}`);

      const isExpired = lease1.tenant_token_expires_at
        ? new Date(lease1.tenant_token_expires_at) < new Date()
        : true;
      console.log(`   Is expired: ${isExpired ? "⚠️ Yes" : "✅ No"}`);
    }
  } else {
    console.log("❌ Lease not found");
  }

  console.log("\n📊 Testing with Service Role Client:");
  const { data: lease2, error: error2 } = await anonClient
    .from("leases")
    .select(`
      id,
      tenant_name,
      tenant_email,
      status,
      tenant_access_token,
      tenant_token_expires_at,
      tenant_token_verified
    `)
    .eq("id", leaseId)
    .single();

  if (error2) {
    console.error("❌ Service Role Client Error:", error2.message);
  } else if (lease2) {
    console.log("✅ Service Role Client - Lease found");
    console.log(`   Has token: ${!!lease2.tenant_access_token ? "✅ Yes" : "❌ No"}`);
  } else {
    console.log("❌ Lease not found");
  }

  // Check tenant_access_logs
  console.log("\n📋 Recent token generation logs:");
  const { data: logs, error: logsError } = await adminClient
    .from("tenant_access_logs")
    .select("*")
    .eq("lease_id", leaseId)
    .eq("action", "token_generated")
    .order("created_at", { ascending: false })
    .limit(5);

  if (logsError) {
    console.error("❌ Error fetching logs:", logsError.message);
  } else if (logs && logs.length > 0) {
    console.log(`✅ Found ${logs.length} token generation log(s):`);
    logs.forEach((log, idx) => {
      console.log(`   ${idx + 1}. ${new Date(log.created_at).toLocaleString("fr-FR")} - IP: ${log.ip_address || "N/A"}`);
    });
  } else {
    console.log("❌ No token generation logs found");
  }

  // Check RLS policies on leases table
  console.log("\n🔒 Checking RLS policies on leases table:");
  const { data: policies, error: policiesError } = await adminClient
    .from("pg_policies")
    .select("*")
    .eq("tablename", "leases");

  if (policiesError) {
    console.error("❌ Error fetching policies:", policiesError.message);
  } else if (policies && policies.length > 0) {
    console.log(`✅ Found ${policies.length} RLS policy/policies on leases table`);
    policies.forEach((policy: any) => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`);
    });
  } else {
    console.log("ℹ️  No RLS policies found (or insufficient permissions to view)");
  }
}

async function debugByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  console.log(`\n🔍 Finding leases for email: ${normalizedEmail}\n`);

  const adminClient = createAdminClient();
  const { data: leases, error } = await adminClient
    .from("leases")
    .select("id, tenant_name, status, property_address")
    .eq("tenant_email", normalizedEmail)
    .eq("status", "active");

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  if (!leases || leases.length === 0) {
    console.log("❌ No active leases found for this email");
    process.exit(1);
  }

  console.log(`✅ Found ${leases.length} active lease(s):\n`);

  for (let i = 0; i < leases.length; i++) {
    const lease = leases[i];
    console.log(`${"=".repeat(60)}`);
    console.log(`Lease ${i + 1}: ${lease.property_address}`);
    console.log(`${"=".repeat(60)}`);
    await debugLeaseToken(lease.id);
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Usage:");
    console.log("  By lease ID:    npx tsx scripts/debug-token.ts <lease_id>");
    console.log("  By email:       npx tsx scripts/debug-token.ts --email <email>\n");
    console.log("Examples:");
    console.log("  npx tsx scripts/debug-token.ts 123e4567-e89b-12d3-a456-426614174000");
    console.log("  npx tsx scripts/debug-token.ts --email tenant@example.com");
    process.exit(args.length === 0 ? 1 : 0);
  }

  try {
    if (args[0] === "--email" || args[0] === "-e") {
      if (!args[1]) {
        console.error("❌ Email address required");
        process.exit(1);
      }
      await debugByEmail(args[1]);
    } else {
      await debugLeaseToken(args[0]);
    }

    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
