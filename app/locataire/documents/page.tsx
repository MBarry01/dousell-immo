import { getTenantDashboardData } from "../actions";
import { FileText, Download, FolderOpen, ShieldCheck, ChevronRight, Share2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { InsuranceUpload } from "./components/InsuranceUpload";
import { createAdminClient } from "@/utils/supabase/admin";

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default async function TenantDocumentsPage() {
    const data = await getTenantDashboardData();

    if (!data.hasLease || !data.lease) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Aucun document</h3>
                <p className="max-w-xs mt-2 text-sm text-zinc-500">
                    Vos documents apparaîtront ici une fois votre bail activé.
                </p>
            </div>
        );
    }

    const { lease } = data;
    const payments = lease.payments || [];
    const paidPayments = payments.filter((p: any) => p.status === 'paid');

    // Fetch shared documents from owner
    const adminClient = createAdminClient();
    const { data: sharedDocs } = await adminClient
        .from('shared_documents')
        .select('id, title, file_url, category, created_at')
        .eq('lease_id', lease.id)
        .order('created_at', { ascending: false });

    const CATEGORY_LABELS: Record<string, string> = {
        reglement: 'Règlement',
        diagnostic: 'Diagnostic',
        etat_des_lieux: 'État des lieux',
        other: 'Document',
    };

    const formatPeriod = (month: number, year: number) => {
        return `${MONTH_NAMES[(month || 1) - 1]} ${year}`;
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-zinc-900">Mes Documents</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Contrats, quittances et attestations</p>
            </div>

            {/* Contrat de Bail */}
            <section className="space-y-3">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Contrat
                </h2>
                {lease.lease_pdf_url ? (
                    <a href={lease.lease_pdf_url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-xl border border-zinc-200 overflow-hidden hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Contrat de Bail</p>
                                    <p className="text-xs text-zinc-500">
                                        {lease.created_at
                                            ? `Signé le ${format(new Date(lease.created_at), 'dd MMMM yyyy', { locale: fr })}`
                                            : 'Date de signature non disponible'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Download className="w-4 h-4 text-zinc-500" />
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </div>
                        </div>
                    </a>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-900">Contrat de Bail</p>
                                    <p className="text-xs text-zinc-500">Non disponible</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Assurance */}
            <section className="space-y-3">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Assurance
                </h2>
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900">Assurance Habitation</p>
                                <p className="text-xs text-zinc-500">Document obligatoire</p>
                            </div>
                        </div>
                        <InsuranceUpload leaseId={lease.id} existingUrl={lease.insurance_url} />
                    </div>
                </div>
            </section>

            {/* Quittances */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Quittances de loyer
                    </h2>
                    {paidPayments.length > 0 && (
                        <span className="text-xs text-zinc-400">
                            {paidPayments.length} document{paidPayments.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {paidPayments.length > 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                        {paidPayments.map((payment: any) => {
                            const period = formatPeriod(payment.period_month, payment.period_year);
                            const receiptUrl = payment.receipt_url || `/api/tenant/receipt/${payment.id}`;

                            return (
                                <a key={payment.id} href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <div className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900">Quittance {period}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {payment.amount_due?.toLocaleString('fr-FR')} FCFA
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Download className="w-4 h-4 text-zinc-500" />
                                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-200 py-12 px-4 text-center">
                        <FolderOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-zinc-600">Aucune quittance disponible</p>
                        <p className="text-xs text-zinc-400 mt-1">
                            Vos quittances apparaîtront ici après chaque paiement validé
                        </p>
                    </div>
                )}
            </section>

            {/* Documents partagés */}
            {sharedDocs && sharedDocs.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Documents partagés
                        </h2>
                        <span className="text-xs text-zinc-400">
                            {sharedDocs.length} document{sharedDocs.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                        {sharedDocs.map((doc: any) => (
                            <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                                        <Share2 className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">{doc.title}</p>
                                        <p className="text-xs text-zinc-500">
                                            {CATEGORY_LABELS[doc.category] || 'Document'}
                                            {doc.created_at && ` · ${format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Download className="w-4 h-4 text-zinc-500" />
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
