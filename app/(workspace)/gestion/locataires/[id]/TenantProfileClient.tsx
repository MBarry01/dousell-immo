'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Download,
    History,
    FileCheck,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentHistory } from "./PaymentHistory";
import { DocumentGeneratorDialog } from "../../components/DocumentGeneratorDialog";

interface TenantProfileClientProps {
    lease: any;
    transactions: any[];
    totalPaid: number;
    pendingAmount: number;
    overdueCount: number;
    user: any;
    profile: any;
}

export function TenantProfileClient({
    lease,
    transactions,
    totalPaid,
    pendingAmount,
    overdueCount,
    user,
    profile
}: TenantProfileClientProps) {
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#documents') {
            setActiveTab("documents");
        }
    }, []);

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="min-h-screen p-6 space-y-6 bg-background text-foreground">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-accent hover:text-accent-foreground text-foreground">
                    <Link href="/gestion">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        {lease.tenant_name}
                        {lease.status === "active" ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs border border-green-500/20">Actif</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs border border-red-500/20">Résilié</span>
                        )}
                    </h1>
                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {lease.property_address}
                    </p>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Info Card */}
                <div className="space-y-6">
                    <div className="border rounded-xl p-6 space-y-6 bg-card border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                {lease.tenant_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Locataire depuis</p>
                                <p className="font-medium text-foreground">{new Date(lease.start_date).toLocaleDateString("fr-FR")}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <a href={`tel:${lease.tenant_phone}`} className="hover:text-primary transition-colors">{lease.tenant_phone}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a href={`mailto:${lease.tenant_email}`} className="hover:text-primary transition-colors">{lease.tenant_email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                {lease.lease_pdf_url ? (
                                    <span className="text-foreground">Contrat signé</span>
                                ) : (
                                    <span className="text-amber-500">Pas encore de bail</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md" size="sm" asChild>
                                <Link href={`/gestion/messages/${lease.id}`}>
                                    <Mail className="w-4 h-4 mr-2" /> Message
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full border-border hover:bg-accent text-foreground shadow-sm" size="sm" asChild>
                                <a href={`tel:${lease.tenant_phone}`}>
                                    <Phone className="w-4 h-4 mr-2" /> Appeler
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border rounded-xl p-4 bg-card border-border">
                            <p className="text-xs mb-1 text-muted-foreground">Loyer mensuel</p>
                            <p className="text-lg font-bold text-foreground">{formatMoney(lease.monthly_amount)}</p>
                        </div>
                        <div className="border rounded-xl p-4 bg-card border-border">
                            <p className="text-xs mb-1 text-muted-foreground">Jour de paiement</p>
                            <p className="text-lg font-bold text-foreground">Le {lease.billing_day}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start p-1 h-auto bg-muted border border-border">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Vue d&apos;ensemble</TabsTrigger>
                            <TabsTrigger value="payments" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Paiements</TabsTrigger>
                            <TabsTrigger value="documents" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Documents</TabsTrigger>
                        </TabsList>

                        {/* TAB: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Total Paid */}
                                <div className="p-5 rounded-lg border shadow-sm bg-card border-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Versé</span>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-semibold tracking-tighter text-foreground">{formatMoney(totalPaid)}</span>
                                    </div>
                                </div>

                                {/* Pending */}
                                <div className="p-5 rounded-lg border shadow-sm bg-card border-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">En attente</span>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-semibold tracking-tighter text-foreground">{formatMoney(pendingAmount)}</span>
                                    </div>
                                </div>

                                {/* Overdue */}
                                <div className="p-5 rounded-lg border shadow-sm bg-card border-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Retards</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-semibold tracking-tighter text-foreground">{overdueCount}</span>
                                        <span className="text-sm font-normal text-muted-foreground">mois</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity / Timeline */}
                            <div className="border rounded-xl p-6 bg-card border-border">
                                <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                                    <History className="w-4 h-4 text-primary" /> Activité Récente
                                </h3>
                                <div className="space-y-4">
                                    {transactions.slice(0, 5).map((t: any) => (
                                        <div key={t.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 border-border/50">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${t.status === 'paid' ? 'bg-green-500' :
                                                t.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    {t.status === 'paid' ? 'Paiement reçu' :
                                                        t.status === 'overdue' ? 'Paiement en retard' : 'Loyer émis'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Pour {new Date(t.period_year, t.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-foreground">{formatMoney(t.amount_due)}</p>
                                                <p className="text-xs text-muted-foreground">
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
                                profile={lease.owner_profile}
                            />
                        </TabsContent>

                        {/* TAB: DOCUMENTS */}
                        <TabsContent value="documents" className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Contract */}
                                {lease.lease_pdf_url ? (
                                    <div className="border rounded-xl p-5 transition-colors bg-card border-border hover:border-primary/50 group relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    asChild
                                                >
                                                    <a href={lease.lease_pdf_url} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    asChild
                                                >
                                                    <a href={lease.lease_pdf_url} download>
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold mb-1 text-foreground">Contrat de Bail</h3>
                                        <p className="text-sm mb-2 text-muted-foreground">Signé le {new Date(lease.start_date).toLocaleDateString('fr-FR')}</p>
                                        <div className="flex gap-2">
                                            <span className="text-xs px-2 py-1 bg-green-500/10 rounded text-green-600 dark:text-green-400">PDF Disponible</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] bg-muted/30 border-border">
                                        <div className="p-3 rounded-full mb-3 bg-primary/10">
                                            <FileText className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="font-semibold mb-1 text-foreground">Aucun contrat</h3>
                                        <p className="text-sm mb-4 text-muted-foreground">Générez un bail pour ce locataire</p>
                                        <div className="w-full">
                                            <DocumentGeneratorDialog
                                                leases={[lease]}
                                                profile={profile}
                                                trigger={
                                                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all gap-2 shadow-md">
                                                        <FileCheck className="w-4 h-4" />
                                                        Générer le contrat
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Placeholder for other documents */}
                                <div className="border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-colors cursor-pointer h-full min-h-[160px] border-border hover:bg-accent text-muted-foreground hover:text-foreground">
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
