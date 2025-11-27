import Link from "next/link";
import {
  Home,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";

import { requireAnyRole } from "@/lib/permissions";
import {
  getDashboardStats,
  getRecentProperties,
  getRecentActivity,
  getPerformanceStats,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardView } from "@/components/admin/dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAnyRole();

  const stats = await getDashboardStats();
  const perfStats = await getPerformanceStats();
  const recentProperties = await getRecentProperties(5);
  const recentActivity = await getRecentActivity(5);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            Vue d&apos;ensemble de votre activité et performances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-white/60">En ligne</span>
        </div>
      </div>

      {/* Section 1: KPIs Globaux (Administration) */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-white/80">Administration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/dashboard">
            <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer h-full">
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
            <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer h-full">
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
                      Action requise
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1">En attente de validation</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/leads">
            <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer h-full">
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
            <Card className="border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer h-full">
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
      </div>

      {/* Section Performance Interactive (Client Component) */}
      <DashboardView
        stats={stats}
        perfStats={perfStats}
        recentProperties={recentProperties}
        recentActivity={recentActivity}
      />
    </div>
  );
}
