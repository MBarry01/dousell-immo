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
import { VerificationQueue } from "@/components/admin/verification-queue";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAnyRole();

  const stats = await getDashboardStats();
  const perfStats = await getPerformanceStats();
  const recentProperties = await getRecentProperties(5);
  const recentActivity = await getRecentActivity(5);

  return (
    <div className="px-4 md:px-6 lg:px-8 space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vue d&apos;ensemble de votre activité et performances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">En ligne</span>
        </div>
      </div>

      {/* Section 1: KPIs Globaux (Administration) */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-muted-foreground">Administration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/dashboard">
            <Card className="border-border bg-card transition-all hover:bg-accent/50 hover:border-primary/20 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Biens en ligne
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.propertiesApproved}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Approuvés et publiés</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/moderation">
            <Card className="border-border bg-card transition-all hover:bg-accent/50 hover:border-primary/20 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  En attente
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.propertiesPending}
                  </div>
                  {stats.propertiesPending > 0 && (
                    <Badge className="bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/30">
                      Action requise
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">En attente de validation</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/leads">
            <Card className="border-border bg-card transition-all hover:bg-accent/50 hover:border-primary/20 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Leads (30j)
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.leadsLast30Days}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Contacts ce mois-ci</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="border-border bg-card transition-all hover:bg-accent/50 hover:border-primary/20 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Utilisateurs
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total inscrits</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Section Vérifications en attente */}
      <div>
        <VerificationQueue />
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
