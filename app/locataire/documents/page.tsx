import { getTenantDashboardData } from "../actions";
import { FileText, Download, AlertCircle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InsuranceUpload } from "./components/InsuranceUpload";

export default async function TenantDocumentsPage() {
    const data = await getTenantDashboardData();

    if (!data.hasLease || !data.lease) {
        return <div className="p-4 text-muted-foreground">Aucun document disponible.</div>;
    }

    const { lease } = data;
    const payments = lease.payments || [];
    const paidPayments = payments.filter((p: any) => p.status === 'paid');

    return (
        <div className="px-4 space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Mes Documents</h1>

            {/* 1. Le Contrat de Bail */}
            <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contrat</h2>
                <Card className="p-4 flex items-center justify-between bg-card border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Contrat de Bail</p>
                            <p className="text-xs text-muted-foreground">Signé le {format(new Date(lease.created_at), 'dd MMMM yyyy', { locale: fr })}</p>
                        </div>
                    </div>
                    {lease.lease_pdf_url ? (
                        <a href={lease.lease_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-8">
                                <Download className="w-4 h-4 mr-1" /> PDF
                            </Button>
                        </a>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Non disponible</span>
                    )}
                </Card>
            </section>

            {/* 1.5 Assurance Habitation */}
            <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assurance</h2>
                <Card className="p-4 flex items-center justify-between bg-card border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Assurance Habitation</p>
                            <p className="text-xs text-muted-foreground">Obligatoire</p>
                        </div>
                    </div>
                    <InsuranceUpload leaseId={lease.id} existingUrl={lease.insurance_url} />
                </Card>
            </section>

            {/* 2. Quittances */}
            <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historique des Quittances</h2>
                {paidPayments.length > 0 ? (
                    <div className="space-y-2">
                        {paidPayments.map((payment: any) => (
                            <Card key={payment.id} className="p-4 flex items-center justify-between bg-card border-border shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Quittance de Loyer</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(payment.period_start), 'MMMM yyyy', { locale: fr })}</p>
                                    </div>
                                </div>
                                {/* TODO: Lien vers le PDF de la quittance transactionnelle si disponible */}
                                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" disabled>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-card rounded-xl border border-dashed border-border">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune quittance disponible</p>
                    </div>
                )}
            </section>
        </div>
    );
}
