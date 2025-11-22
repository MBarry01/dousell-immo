import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Home,
  Clock,
  MessageSquare,
  Users,
  ArrowRight,
} from "lucide-react";

import { requireAnyRole } from "@/lib/permissions";
import {
  getDashboardStats,
  getRecentProperties,
  getRecentActivity,
  getChartData,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardChart } from "@/components/admin/dashboard-chart";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  disponible: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "sous-offre": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  vendu: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default async function AdminDashboardPage() {
  await requireAnyRole();

  const stats = await getDashboardStats();
  const recentProperties = await getRecentProperties(5);
  const recentActivity = await getRecentActivity(5);
  const chartData = await getChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-white/60">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/dashboard">
          <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Biens en ligne
              </CardTitle>
              <Home className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.propertiesApproved}
              </div>
              <p className="text-xs text-white/50 mt-1">Approuvés et publiés</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/moderation">
          <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-white">
                  {stats.propertiesPending}
                </div>
                {stats.propertiesPending > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Nouveau
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/50 mt-1">En attente de validation</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/leads">
          <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Leads (30j)
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.leadsLast30Days}
              </div>
              <p className="text-xs text-white/50 mt-1">Contacts ce mois-ci</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-white/50 mt-1">Total inscrits</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Graphique Principal */}
        <Card className="md:col-span-2 border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Visites & Leads</CardTitle>
            <p className="text-sm text-white/60">
              Évolution sur les 6 derniers mois
            </p>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        {/* Activité Récente */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-white/20" />
                    <div className="flex-1">
                      <p className="text-white/80">{activity.message}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {formatDistanceToNow(activity.date, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/50">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau Derniers Biens */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Derniers biens ajoutés</CardTitle>
            <p className="text-sm text-white/60 mt-1">
              Les 5 biens les plus récents
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/biens">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentProperties.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
                  <tr>
                    <th className="px-4 py-3">Bien</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {property.image && (
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                              <Image
                                src={property.image}
                                alt={property.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">
                              {property.title}
                            </p>
                            {property.validationStatus === "pending" && (
                              <Badge className="mt-1 bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                En attente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/80">
                        {new Intl.NumberFormat("fr-SN", {
                          maximumFractionDigits: 0,
                        }).format(property.price)}{" "}
                        FCFA
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          className={
                            statusColors[property.status] ||
                            "bg-white/10 text-white/80"
                          }
                        >
                          {property.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-white/60">
                        {formatDistanceToNow(property.createdAt, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-white/60">
              Aucun bien pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

