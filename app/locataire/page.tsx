import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantDashboardData } from "./actions";
import { PaymentForm } from "./components/PaymentForm";
import { CookieMigrator } from "./components/CookieMigrator";
import { FileText } from "lucide-react";

// Force dynamic rendering - always fetch fresh data from DB
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Tenant Portal Main Page
 *
 * Handles two access scenarios:
 * 1. First access via Magic Link (token in URL)
 *    - Redirects to /verify (which handles validation + cookie creation)
 *
 * 2. Subsequent access (session cookie exists)
 *    - Uses session cookie for authentication
 *    - Shows dashboard directly
 *
 * Note: Cookie creation is handled exclusively by Server Actions
 * (verifyTenantIdentity, activateTenantSession) because Next.js 16
 * forbids cookies().set() in Server Components.
 */
export default async function TenantPortalPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("tenant_session")?.value;

  // If token in URL, handle Magic Link access
  if (token) {
    // ALWAYS redirect to /verify when there's a token in the URL.
    // Even if a cookie exists, it might be stale/invalid (from a previous
    // token that was replaced). The /verify page will:
    // - Validate the new token
    // - Create a fresh session cookie
    // - Auto-activate if already verified, or show name form if first access
    redirect(`/locataire/verify?token=${token}`);
  }

  // No token in URL - use session cookie
  if (!sessionToken) {
    redirect("/locataire/expired?error=no_session");
  }

  // Get dashboard data using session
  const data = await getTenantDashboardData();

  if (!data.hasLease || !data.lease) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            Aucune location trouvée
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Nous n&apos;avons trouvé aucune location active associée à votre
            accès.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
            <p className="font-medium text-slate-900">
              💡 Contactez votre propriétaire
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, demandez
              un nouveau lien d&apos;accès.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { lease } = data;
  const property = lease.property;

  return (
    <>
      {/* Migrate cookie path on page load for API access */}
      <CookieMigrator />
      <PaymentForm
        leaseId={lease.id}
        monthlyAmount={lease.monthly_amount || 0}
        tenantName={data.tenantName || lease.tenant_name}
        tenantEmail={lease.tenant_email || ""}
        propertyAddress={property?.location?.address || lease.property_address}
        leaseStartDate={lease.start_date}
        leaseEndDate={lease.end_date}
        leaseType={property?.details?.type || "Appartement"}
        leaseStatus={lease.status}
        billingDay={lease.billing_day || 5}
        ownerName={(lease.owner as any)?.full_name || undefined}
        recentPayments={lease.payments || []}
      />
    </>
  );
}
