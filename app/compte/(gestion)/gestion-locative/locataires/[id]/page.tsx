import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    CreditCard,
    Clock,
    CheckCircle,
    AlertTriangle,
    Download,
    History,
    FileCheck,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { revalidatePath } from "next/cache";
import { PaymentHistory } from "./PaymentHistory";

export default async function TenantProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { id } = await params;
    console.log("TenantProfilePage loading for ID:", id); // DEBUG

    const { data: lease } = await supabase
        .from("leases")
        .select(`
            *,
            rental_transactions (
                id,
                period_month,
                period_year,
                amount_due,
                status,
                paid_at,
                created_at
            ),
            maintenance_requests (
                id,
                description,
                status,
                created_at
            )
        `)
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

    if (!lease) notFound();

    // Calculate generic stats
    const transactions = lease.rental_transactions || [];
    const totalPaid = transactions
        .filter((t: any) => t.status === "paid")
        .reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);

    const pendingAmount = transactions
        .filter((t: any) => t.status === "pending")
        .reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);

    const overdueCount = transactions.filter((t: any) => t.status === "overdue").length;

    // Helper for currency
    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/10">
                    <Link href="/compte/gestion-locative">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {lease.tenant_name}
                        {lease.status === "active" ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">Actif</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">Résilié</span>
                        )}
                    </h1>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {lease.property_address}
                    </p>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Info Card */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                                {lease.tenant_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Locataire depuis</p>
                                <p className="font-medium">{new Date(lease.start_date).toLocaleDateString("fr-FR")}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <a href={`tel:${lease.tenant_phone}`} className="hover:text-blue-400 transition-colors">{lease.tenant_phone}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <a href={`mailto:${lease.tenant_email}`} className="hover:text-blue-400 transition-colors">{lease.tenant_email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>Bail #{lease.id.slice(0, 8)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                                <Mail className="w-4 h-4 mr-2" /> Message
                            </Button>
                            <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800" size="sm">
                                <Phone className="w-4 h-4 mr-2" /> Appeler
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-1">Loyer mensuel</p>
                            <p className="text-lg font-bold text-white">{formatMoney(lease.monthly_amount)}</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-1">Jour de paiement</p>
                            <p className="text-lg font-bold text-white">Le {lease.billing_day}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-slate-900 border border-slate-800 w-full justify-start p-1 h-auto">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Vue d'ensemble</TabsTrigger>
                            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600">Paiements</TabsTrigger>
                            <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600">Documents</TabsTrigger>
                        </TabsList>

                        {/* TAB: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <span className="text-sm font-medium text-green-400">Total Versé</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{formatMoney(totalPaid)}</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-medium text-amber-400">En attente</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{formatMoney(pendingAmount)}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        <span className="text-sm font-medium text-red-400">Retards</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{overdueCount} mois</p>
                                </div>
                            </div>

                            {/* Recent Activity / Timeline */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <History className="w-4 h-4 text-blue-400" /> Activité Récente
                                </h3>
                                <div className="space-y-4">
                                    {transactions.slice(0, 5).map((t: any) => (
                                        <div key={t.id} className="flex items-start gap-3 pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${t.status === 'paid' ? 'bg-green-500' :
                                                t.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    {t.status === 'paid' ? 'Paiement reçu' :
                                                        t.status === 'overdue' ? 'Paiement en retard' : 'Loyer émis'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Pour {new Date(t.period_year, t.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatMoney(t.amount_due)}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(t.created_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: PAYMENTS */}
                        <TabsContent value="payments" className="mt-6">
                            <PaymentHistory
                                transactions={transactions}
                                lease={lease}
                                tenant={{
                                    name: lease.tenant_name,
                                    email: lease.tenant_email,
                                    phone: lease.tenant_phone
                                }}
                                user={user}
                                profile={lease.owner_profile} // Assuming profile data is available or will be fetched
                            />
                        </TabsContent>

                        {/* TAB: DOCUMENTS */}
                        <TabsContent value="documents" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contract - Conditionnel: afficher uniquement si un vrai contrat existe */}
                                {lease.lease_pdf_url ? (
                                    <a
                                        href={lease.lease_pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors cursor-pointer group block"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <FileCheck className="w-6 h-6 text-green-400" />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-500 group-hover:text-white">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <h3 className="font-semibold mb-1">Contrat de Bail</h3>
                                        <p className="text-sm text-slate-400 mb-2">Signé le {new Date(lease.start_date).toLocaleDateString('fr-FR')}</p>
                                        <div className="flex gap-2">
                                            <span className="text-xs px-2 py-1 bg-green-500/20 rounded text-green-400">PDF Disponible</span>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[160px]">
                                        <div className="p-3 bg-brand/10 rounded-full mb-3">
                                            <FileText className="w-8 h-8 text-brand" />
                                        </div>
                                        <h3 className="font-semibold text-white mb-1">Aucun contrat</h3>
                                        <p className="text-slate-400 text-sm mb-4">Générez un bail pour ce locataire</p>
                                        <Link href={`/compte/gestion-locative/locataires/${id}?openContract=true`}>
                                            <Button className="bg-brand hover:bg-brand/90 gap-2 text-black">
                                                <FileCheck className="w-4 h-4" />
                                                Générer le contrat
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Placeholder for other documents */}
                                <div className="border border-dashed border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-slate-900/50 transition-colors cursor-pointer text-slate-500 hover:text-slate-300 h-full min-h-[160px]">
                                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="font-medium text-sm">Ajouter un document</span>
                                    <span className="text-xs opacity-70">État des lieux, Assurance, Identité...</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
