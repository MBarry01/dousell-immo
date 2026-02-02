import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  validateTenantToken,
  TENANT_SESSION_COOKIE_OPTIONS,
} from "@/lib/tenant-magic-link";
import { getTenantDashboardData } from "./actions";
import { PaymentForm } from "./components/PaymentForm";
import { FileText } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Tenant Portal Main Page
 *
 * Handles two access scenarios:
 * 1. First access via Magic Link (token in URL)
 *    - Validates token
 *    - If not verified → redirect to /verify
 *    - If verified → create session cookie → show dashboard
 *
 * 2. Subsequent access (session cookie exists)
 *    - Uses session cookie for authentication
 *    - Shows dashboard directly
 */
export default async function TenantPortalPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("tenant_session")?.value;

  // If token in URL, handle Magic Link access
  if (token) {
    // Validate the token
    const session = await validateTenantToken(token);

    if (!session) {
      redirect("/locataire/expired?error=invalid_token");
    }

    // If not verified yet, redirect to verification
    if (!session.verified) {
      redirect(`/locataire/verify?token=${token}`);
    }

    // Token is valid and verified - create session cookie
    cookieStore.set(TENANT_SESSION_COOKIE_OPTIONS.name, token, {
      httpOnly: TENANT_SESSION_COOKIE_OPTIONS.httpOnly,
      secure: TENANT_SESSION_COOKIE_OPTIONS.secure,
      sameSite: TENANT_SESSION_COOKIE_OPTIONS.sameSite,
      maxAge: TENANT_SESSION_COOKIE_OPTIONS.maxAge,
      path: TENANT_SESSION_COOKIE_OPTIONS.path,
    });

    // Redirect to clean URL (remove token from URL for security)
    redirect("/locataire");
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
        <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white/40" />
          </div>
          <h1 className="text-lg font-semibold text-white mb-2">
            Aucune location trouvée
          </h1>
          <p className="text-sm text-white/60 mb-6">
            Nous n&apos;avons trouvé aucune location active associée à votre
            accès.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm">
            <p className="font-medium text-white">
              💡 Contactez votre propriétaire
            </p>
            <p className="text-xs text-white/50 mt-2">
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
    <PaymentForm
      leaseId={lease.id}
      monthlyAmount={lease.monthly_amount || 0}
      tenantName={data.tenantName || lease.tenant_name}
      tenantEmail={lease.tenant_email || ""}
      propertyAddress={property?.location?.address || lease.property_address}
      leaseStartDate={lease.start_date}
      leaseEndDate={lease.end_date}
      leaseType={property?.details?.type || "Appartement"}
      recentPayments={lease.payments || []}
    />
  );
}
