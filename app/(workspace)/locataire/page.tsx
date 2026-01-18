import { getTenantDashboardData } from "./actions";
import { PaymentForm } from "./components/PaymentForm";
import { FileText } from "lucide-react";

export default async function TenantPortalPage() {
    const data = await getTenantDashboardData();

    if (!data.hasLease || !data.lease) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-muted border border-border rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-lg font-semibold text-foreground mb-2">Aucune location trouvée</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        Nous n&apos;avons trouvé aucune location active associée à votre adresse email.
                    </p>
                    <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm">
                        <p className="font-medium text-foreground">💡 Contactez votre propriétaire</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Vérifiez que l&apos;adresse email renseignée dans votre bail est correcte.
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
            leaseType={property?.details?.type || 'Appartement'}
            recentPayments={lease.payments || []}
        />
    );
}
