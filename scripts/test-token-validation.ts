/**
 * Test token validation
 *
 * Usage: npx tsx scripts/test-token-validation.ts <token>
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/utils/supabase/admin";
import { validateTenantToken } from "@/lib/tenant-magic-link";

const token = process.argv[2];

if (!token) {
  console.error("❌ Token required");
  console.error("Usage: npx tsx scripts/test-token-validation.ts <token>");
  process.exit(1);
}

async function testToken() {
  console.log("🔍 Testing token validation\n");
  console.log(`Token: ${token}`);
  console.log(`Token length: ${token.length} chars`);
  console.log(`Token (first 20): ${token.substring(0, 20)}...`);

  // Hash the token like the library does
  const hashedToken = createHash("sha256").update(token).digest("hex");
  console.log(`\nHashed token: ${hashedToken}`);
  console.log(`Hash (first 20): ${hashedToken.substring(0, 20)}...`);

  // Check if token exists in database
  console.log("\n📊 Checking database for matching hash...");
  const supabase = createAdminClient();

  const { data: lease, error } = await supabase
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
    .eq("tenant_access_token", hashedToken)
    .single();

  if (error) {
    console.error("\n❌ Database error:", error.message);
    console.log("\nTrying to find ANY lease with a token...");

    const { data: anyLease } = await supabase
      .from("leases")
      .select("id, tenant_name, tenant_access_token")
      .not("tenant_access_token", "is", null)
      .limit(1)
      .single();

    if (anyLease) {
      console.log("✅ Found a lease with token:");
      console.log(`   Lease ID: ${anyLease.id}`);
      console.log(`   Tenant: ${anyLease.tenant_name}`);
      console.log(`   Stored hash (first 20): ${anyLease.tenant_access_token.substring(0, 20)}...`);
      console.log(`   Your hash (first 20):   ${hashedToken.substring(0, 20)}...`);
      console.log(`   Hashes match: ${anyLease.tenant_access_token === hashedToken ? "✅ Yes" : "❌ No"}`);
    }
  } else if (lease) {
    console.log("\n✅ Found matching lease in database!");
    console.log(`   Lease ID: ${lease.id}`);
    console.log(`   Tenant: ${lease.tenant_name} (${lease.tenant_email})`);
    console.log(`   Status: ${lease.status}`);
    console.log(`   Property: ${lease.property_address}`);
    console.log(`   Token verified: ${lease.tenant_token_verified ? "✅ Yes" : "❌ No"}`);
    console.log(`   Token expires: ${lease.tenant_token_expires_at}`);

    const isExpired = new Date(lease.tenant_token_expires_at) < new Date();
    console.log(`   Is expired: ${isExpired ? "⚠️ Yes" : "✅ No"}`);
  } else {
    console.log("\n❌ No lease found with this token hash");
  }

  // Now test with the library function
  console.log("\n📝 Testing with validateTenantToken() function...");
  const result = await validateTenantToken(token);

  if (result) {
    console.log("✅ Validation SUCCESS!");
    console.log("   Session:", JSON.stringify(result, null, 2));
  } else {
    console.log("❌ Validation FAILED - returned null");
  }
}

testToken().then(() => {
  console.log("\n✅ Test complete");
  process.exit(0);
}).catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
