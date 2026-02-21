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
        <div className="w-full max-w-lg mx-auto px-4 py-8 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">Mes Documents</h1>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest opacity-70">Contrats, quittances et attestations</p>
            </div>

            {/* Contrat de Bail */}
            <section className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Contrat officiel
                </h2>
                {lease.lease_pdf_url ? (
                    <a href={lease.lease_pdf_url} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:border-[#0F172A] hover:shadow-xl hover:shadow-slate-900/5 hover:scale-[1.02] transition-all duration-300 active-press shadow-sm">
                        <div className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300 shadow-inner group-hover:rotate-12">
                                    <FileText className="w-7 h-7 text-[#0F172A] group-hover:text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-[#0F172A] text-base tracking-tight mb-0.5">Contrat de Bail</p>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wide opacity-80">
                                        {lease.created_at
                                            ? `Signé le ${format(new Date(lease.created_at), 'dd MMMM yyyy', { locale: fr })}`
                                            : 'Date de signature non disponible'}
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0F172A]/10 transition-colors">
                                <Download className="w-5 h-5 text-slate-500 group-hover:text-[#0F172A]" />
                            </div>
                        </div>
                    </a>
                ) : (
                    <div className="bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed p-6 flex items-center gap-4 opacity-70">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-[#0F172A]">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-black text-slate-400 text-base tracking-tight">Contrat de Bail</p>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Génération en cours</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Assurance */}
            <section className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Couverture
                </h2>
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#F4C430] opacity-30"></div>
                    <div className="flex items-center gap-4 relative">
                        <div className="w-14 h-14 rounded-2xl bg-[#F4C430]/10 flex items-center justify-center text-[#967919] group-hover:rotate-6 transition-transform">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-black text-[#0F172A] text-base tracking-tight mb-0.5">Assurance Habitation</p>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest opacity-80">Document obligatoire</p>
                        </div>
                    </div>
                    <InsuranceUpload leaseId={lease.id} existingUrl={lease.insurance_url} />
                </div>
            </section>

            {/* Quittances */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Quittances de loyer
                    </h2>
                    {paidPayments.length > 0 && (
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {paidPayments.length} document{paidPayments.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {paidPayments.length > 0 ? (
                    <div className="space-y-3">
                        {paidPayments.map((payment: any) => {
                            const period = formatPeriod(payment.period_month, payment.period_year);
                            const receiptUrl = payment.receipt_url || `/api/tenant/receipt/${payment.id}`;

                            return (
                                <a key={payment.id} href={receiptUrl} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-3xl border border-slate-200 hover:border-[#0F172A] hover:shadow-xl hover:shadow-slate-900/5 hover:scale-[1.01] transition-all duration-300 active-press shadow-sm">
                                    <div className="flex items-center justify-between p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-[#0F172A] group-hover:bg-[#0F172A] group-hover:text-white transition-all duration-300 group-hover:rotate-6 shadow-sm">
                                                <FileText className="w-6 h-6 text-[#F4C430] group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#0F172A] text-sm tracking-tight mb-0.5 group-hover:translate-x-1 transition-transform">Quittance {period}</p>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform delay-75">
                                                    {payment.amount_due?.toLocaleString('fr-FR')} FCFA · Validée
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0F172A]/10 transition-colors">
                                            <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]" />
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 py-16 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-[#0F172A]/30">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <p className="text-base font-black text-[#0F172A] tracking-tight">Aucune quittance</p>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1 opacity-70">
                            Elles apparaîtront après vos paiements
                        </p>
                    </div>
                )}
            </section>

            {/* Documents partagés */}
            {sharedDocs && sharedDocs.length > 0 && (
                <section className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Documents partagés
                        </h2>
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {sharedDocs.length} fichier{sharedDocs.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {sharedDocs.map((doc: any) => (
                            <a
                                key={doc.id}
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block bg-white rounded-3xl border border-slate-200 hover:border-violet-500 hover:shadow-xl hover:shadow-violet-900/5 hover:scale-[1.01] transition-all duration-300 active-press shadow-sm"
                            >
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 group-hover:rotate-6 shadow-sm">
                                            <Share2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-[#0F172A] text-sm tracking-tight mb-0.5 group-hover:translate-x-1 transition-transform">{doc.title}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform delay-75">
                                                {CATEGORY_LABELS[doc.category] || 'Document'}
                                                {doc.created_at && ` · ${format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
