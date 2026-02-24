import { CreditCard, TrendingUp, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAnyRole } from "@/lib/permissions";
import { getSubscriptionStats, getSubscriptionTeams } from "./actions";
import { SubscriptionListClient } from "./subscription-list-client";
import { formatPrice } from "@/lib/subscription/plans-config";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementsPage() {
  await requireAnyRole(["admin", "superadmin"]);

  const [stats, teams] = await Promise.all([
    getSubscriptionStats(),
    getSubscriptionTeams(),
  ]);

  const totalPaying = stats.totalActive + stats.totalTrialing;

  return (
    <div className="px-4 md:px-6 lg:px-8 space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Abonnements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suivi des abonnements, revenus et gestion manuelle
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR (XOF)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(stats.mrrXof, "xof")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalActive} abonné{stats.totalActive !== 1 ? "s" : ""} actif{stats.totalActive !== 1 ? "s" : ""} (hors essais)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalActive}</div>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#F4C430]">Pro: {stats.byTier.pro}</span>
              <span className="text-xs text-purple-400">Ent: {stats.byTier.enterprise}</span>
              <span className="text-xs text-muted-foreground">Start: {stats.byTier.starter}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Essais en cours
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalTrialing}</div>
            <p className="text-xs text-muted-foreground mt-1">Période d&apos;essai active</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Problèmes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalPastDue}
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-amber-500">
                {stats.totalPastDue} en retard
              </span>
              <span className="text-xs text-red-500 flex items-center gap-0.5">
                <XCircle className="h-3 w-3" />
                {stats.totalCanceled} annulés
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par plan */}
      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            {
              tier: "Starter",
              count: stats.byTier.starter,
              color: "text-slate-300",
              bar: "bg-slate-500",
            },
            {
              tier: "Professional",
              count: stats.byTier.pro,
              color: "text-[#F4C430]",
              bar: "bg-[#F4C430]",
            },
            {
              tier: "Enterprise",
              count: stats.byTier.enterprise,
              color: "text-purple-300",
              bar: "bg-purple-500",
            },
          ] as const
        ).map(({ tier, count, color, bar }) => {
          const pct = totalPaying > 0 ? Math.round((count / totalPaying) * 100) : 0;
          return (
            <Card key={tier} className="border-border bg-card">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${color}`}>{tier}</span>
                  <span className="text-2xl font-bold text-foreground">{count}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pct}% des abonnés actifs</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table des abonnements */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Toutes les équipes</h2>
        <SubscriptionListClient teams={teams} />
      </div>
    </div>
  );
}
