'use client';

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
    FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentHistory } from "./PaymentHistory";
import { useTheme } from '@/components/workspace/providers/theme-provider';
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
    const { isDark } = useTheme();

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);

    return (
        <div className={`min-h-screen p-6 space-y-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className={`rounded-full ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'}`}>
                    <Link href="/gestion-locative">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lease.tenant_name}
                        {lease.status === "active" ? (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">Actif</span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">Résilié</span>
                        )}
                    </h1>
                    <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        <MapPin className="w-3 h-3" /> {lease.property_address}
                    </p>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Info Card */}
                <div className="space-y-6">
                    <div className={`border rounded-xl p-6 space-y-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                                {lease.tenant_name.charAt(0)}
                            </div>
                            <div>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Locataire depuis</p>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(lease.start_date).toLocaleDateString("fr-FR")}</p>
                            </div>
                        </div>

                        <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <a href={`tel:${lease.tenant_phone}`} className="hover:text-blue-400 transition-colors">{lease.tenant_phone}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <a href={`mailto:${lease.tenant_email}`} className="hover:text-blue-400 transition-colors">{lease.tenant_email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                {lease.lease_pdf_url ? (
                                    <span>Contrat signé</span>
                                ) : (
                                    <span className="text-amber-500">Pas encore de bail</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <Button className={`w-full ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'} text-white`} size="sm" asChild>
                                <Link href={`/gestion/messages/${lease.id}`}>
                                    <Mail className="w-4 h-4 mr-2" /> Message
                                </Link>
                            </Button>
                            <Button variant="outline" className={`w-full ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white' : 'border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm'}`} size="sm" asChild>
                                <a href={`tel:${lease.tenant_phone}`}>
                                    <Phone className="w-4 h-4 mr-2" /> Appeler
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`border rounded-xl p-4 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                            <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loyer mensuel</p>
                            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(lease.monthly_amount)}</p>
                        </div>
                        <div className={`border rounded-xl p-4 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                            <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Jour de paiement</p>
                            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Le {lease.billing_day}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className={`w-full justify-start p-1 h-auto ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-gray-100 border border-gray-200'}`}>
                            <TabsTrigger value="overview" className={`${isDark ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-slate-900'} data-[state=active]:text-white`}>Vue d'ensemble</TabsTrigger>
                            <TabsTrigger value="payments" className={`${isDark ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-slate-900'} data-[state=active]:text-white`}>Paiements</TabsTrigger>
                            <TabsTrigger value="documents" className={`${isDark ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-slate-900'} data-[state=active]:text-white`}>Documents</TabsTrigger>
                        </TabsList>

                        {/* TAB: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Total Paid */}
                                <div className={`p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-md ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Versé</span>
                                    </div>
                                    <div>
                                        <span className={`text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(totalPaid)}</span>
                                    </div>
                                </div>

                                {/* Pending */}
                                <div className={`p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-md ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">En attente</span>
                                    </div>
                                    <div>
                                        <span className={`text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(pendingAmount)}</span>
                                    </div>
                                </div>

                                {/* Overdue */}
                                <div className={`p-5 rounded-lg border shadow-sm ${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-2 rounded-md ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Retards</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-semibold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{overdueCount}</span>
                                        <span className="text-sm font-normal text-gray-500">mois</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity / Timeline */}
                            <div className={`border rounded-xl p-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <History className="w-4 h-4 text-blue-400" /> Activité Récente
                                </h3>
                                <div className="space-y-4">
                                    {transactions.slice(0, 5).map((t: any) => (
                                        <div key={t.id} className={`flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0 ${isDark ? 'border-slate-800/50' : 'border-gray-200'}`}>
                                            <div className={`mt-1 w-2 h-2 rounded-full ${t.status === 'paid' ? 'bg-green-500' :
                                                t.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                                                }`} />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {t.status === 'paid' ? 'Paiement reçu' :
                                                        t.status === 'overdue' ? 'Paiement en retard' : 'Loyer émis'}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    Pour {new Date(t.period_year, t.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatMoney(t.amount_due)}</p>
                                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
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
                                    <a
                                        href={lease.lease_pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`border rounded-xl p-5 transition-colors cursor-pointer group block ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-500'}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-green-500/10 rounded-lg">
                                                <FileCheck className="w-6 h-6 text-green-400" />
                                            </div>
                                            <Button variant="ghost" size="icon" className={`${isDark ? 'text-slate-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contrat de Bail</h3>
                                        <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Signé le {new Date(lease.start_date).toLocaleDateString('fr-FR')}</p>
                                        <div className="flex gap-2">
                                            <span className="text-xs px-2 py-1 bg-green-500/20 rounded text-green-400">PDF Disponible</span>
                                        </div>
                                    </a>
                                ) : (
                                    <div className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                                        <div className={`p-3 rounded-full mb-3 ${isDark ? 'bg-brand/10' : 'bg-slate-100'}`}>
                                            <FileText className={`w-8 h-8 ${isDark ? 'text-brand' : 'text-slate-900'}`} />
                                        </div>
                                        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aucun contrat</h3>
                                        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Générez un bail pour ce locataire</p>
                                        <div className="w-full">
                                            <DocumentGeneratorDialog
                                                leases={[lease]}
                                                profile={profile}
                                                trigger={
                                                    <Button className={`w-full ${isDark ? 'bg-brand hover:bg-brand/90 text-black' : 'bg-slate-900 hover:bg-slate-800 text-white'} gap-2`}>
                                                        <FileCheck className="w-4 h-4" />
                                                        Générer le contrat
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Placeholder for other documents */}
                                <div className={`border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-colors cursor-pointer h-full min-h-[160px] ${isDark ? 'border-slate-800 hover:bg-slate-900/50 text-slate-500 hover:text-slate-300' : 'border-gray-300 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
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
