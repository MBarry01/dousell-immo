"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Eye,
  MessageSquare,
  Phone,
  MousePointerClick,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";

import type {
  DashboardStats,
  RecentActivity,
  PerformanceStats,
} from "@/app/admin/actions";
import type { RecentProperty } from "@/app/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PerformanceChart } from "@/components/admin/performance-chart";
import { TopPropertiesTable } from "@/components/admin/top-properties-table";

type TimeRange = "7d" | "30d" | "90d";
type ActiveMetric = "views" | "contacts";

interface DashboardViewProps {
  stats: DashboardStats;
  perfStats: PerformanceStats | null;
  recentProperties: RecentProperty[];
  recentActivity: RecentActivity[];
}

const statusColors: Record<string, string> = {
  disponible: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "sous-offre": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  vendu: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function DashboardView({
  stats,
  perfStats: initialPerfStats,
  recentProperties,
  recentActivity,
}: DashboardViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>("views");
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(initialPerfStats);
  const [isLoading, setIsLoading] = useState(false);

  // Convertir timeRange en nombre de jours
  const daysMap: Record<TimeRange, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  // Fetch les données quand le timeRange change
  useEffect(() => {
    const fetchPerformanceStats = async () => {
      setIsLoading(true);
      try {
        const days = daysMap[timeRange];
        const response = await fetch(`/api/admin/performance?days=${days}`);

        if (!response.ok) {
          console.error("Erreur lors de la récupération des statistiques");
          return;
        }

        const data = await response.json();
        setPerfStats(data);
      } catch (error) {
        console.error("Erreur lors du fetch des statistiques:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Toujours fetch pour avoir les données à jour selon la période
    fetchPerformanceStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Calcul du taux de contact global
  const conversionRate =
    perfStats && perfStats.totals.views > 0
      ? ((perfStats.totals.clicks / perfStats.totals.views) * 100).toFixed(1)
      : "0.0";

  // Filtrer les données selon la période
  const filteredChartData = useMemo(() => {
    if (!perfStats) return [];
    return perfStats.chart;
  }, [perfStats]);

  // Filtrer et trier les top propriétés selon la métrique active
  const filteredTopProperties = useMemo(() => {
    if (!perfStats) return [];

    const properties = [...perfStats.topProperties];

    if (activeMetric === "views") {
      // Trier par vues décroissantes
      return properties.sort((a, b) => b.views - a.views).slice(0, 5);
    } else {
      // Trier par clics décroissants
      return properties.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    }
  }, [perfStats, activeMetric]);

  // Préparer les données du graphique selon la métrique active
  const chartDataForMetric = useMemo(() => {
    if (!filteredChartData) return [];

    return filteredChartData.map((d) => ({
      date: d.date,
      views: d.views,
      whatsapp: d.whatsapp ?? 0,
      phone: d.phone ?? 0,
    }));
  }, [filteredChartData]);

  const timeRangeOptions = [
    { value: "7d", label: "7 derniers jours" },
    { value: "30d", label: "30 derniers jours" },
    { value: "90d", label: "Trimestre" },
  ];

  const timeRangeLabels: Record<TimeRange, string> = {
    "7d": "7 derniers jours",
    "30d": "30 derniers jours",
    "90d": "Trimestre",
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Section Performance avec Filtre */}
      {perfStats && (
        <div>
          {/* Header avec Filtre */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white/80">Performance</h2>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              disabled={isLoading}
            >
              <SelectTrigger className={`w-[180px] ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cartes KPI Cliquables */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Carte Vues */}
            <Card
              onClick={() => setActiveMetric("views")}
              className={`cursor-pointer transition-all ${activeMetric === "views"
                ? "border-blue-500/50 bg-white/10 shadow-lg shadow-blue-500/10"
                : "border-white/10 bg-white/5 opacity-70 hover:opacity-100 hover:bg-white/10"
                }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Vues Totales
                </CardTitle>
                <Eye
                  className={`h-4 w-4 ${activeMetric === "views" ? "text-blue-400" : "text-white/40"
                    }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {perfStats.totals.views.toLocaleString()}
                </div>
                <p className="text-xs text-white/50 mt-1">Pages vues sur les annonces</p>
              </CardContent>
            </Card>

            {/* Carte Contacts */}
            <Card
              onClick={() => setActiveMetric("contacts")}
              className={`cursor-pointer transition-all ${activeMetric === "contacts"
                ? "border-emerald-500/50 bg-white/10 shadow-lg shadow-emerald-500/10"
                : "border-white/10 bg-white/5 opacity-70 hover:opacity-100 hover:bg-white/10"
                }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Contacts Générés
                </CardTitle>
                <div className="flex gap-1">
                  <MessageSquare
                    className={`h-4 w-4 ${activeMetric === "contacts"
                      ? "text-emerald-400"
                      : "text-white/40"
                      }`}
                  />
                  <Phone
                    className={`h-4 w-4 ${activeMetric === "contacts"
                      ? "text-emerald-400"
                      : "text-white/40"
                      }`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-2xl font-bold text-white cursor-help underline decoration-dotted decoration-white/40 underline-offset-4 hover:decoration-white/60 transition-colors">
                        {perfStats.totals.clicks.toLocaleString()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-[#0b0f18] border-white/10 shadow-lg"
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />
                          <span className="text-white/90">
                            WhatsApp :{" "}
                            <span className="font-semibold text-white">
                              {perfStats.totals.whatsappCount}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-white/90">
                            Appels :{" "}
                            <span className="font-semibold text-white">
                              {perfStats.totals.phoneCount}
                            </span>
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-xs text-white/50 mt-1">Clics WhatsApp & Téléphone</p>
              </CardContent>
            </Card>

            {/* Carte Taux de Contact */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Taux de Contact
                </CardTitle>
                <MousePointerClick className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{conversionRate}%</div>
                <p className="text-xs text-white/50 mt-1">Clics / Vues</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique et Top Biens */}
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            {/* Graphique Performance Dynamique */}
            <Card className="md:col-span-2 border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <span>
                    Évolution des {activeMetric === "views" ? "Vues" : "Contacts"} (
                    {timeRangeLabels[timeRange]})
                  </span>
                  {isLoading && (
                    <span className="text-xs text-white/40 animate-pulse">
                      Chargement...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-0">
                {isLoading ? (
                  <div className="flex h-[350px] items-center justify-center text-white/40">
                    Chargement des données...
                  </div>
                ) : (
                  <PerformanceChart data={chartDataForMetric} metric={activeMetric} />
                )}
              </CardContent>
            </Card>

            {/* Top Biens Dynamique */}
            <Card className="border-white/10 bg-white/5 flex flex-col">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  <span>
                    Top Biens ({activeMetric === "views" ? "Vues" : "Contacts"})
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white/70 hover:bg-white/20"
                  >
                    {activeMetric === "views" ? "Populaires" : "Performants"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <TopPropertiesTable properties={filteredTopProperties} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Section Activité Récente & Derniers ajouts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Activité Récente */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <div className="flex-1">
                      <p className="text-white/80">{activity.message}</p>
                      <p className="text-xs text-white/40 mt-0.5">
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

        {/* Tableau Derniers Biens */}
        <Card className="md:col-span-2 border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">Derniers ajouts</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
              asChild
            >
              <Link href="/admin/biens">
                Tout voir <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentProperties.length > 0 ? (
              <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/60">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Bien</th>
                      <th className="px-6 py-3">Prix</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentProperties.map((property) => (
                      <tr
                        key={property.id}
                        className="transition-colors hover:bg-white/5 group"
                      >
                        <td className="px-6 py-4 text-xs font-mono text-white/30">
                          #{property.id.slice(-4)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/biens/${property.id}`}
                            target="_blank"
                            className="flex items-center gap-3 group/link"
                          >
                            {property.image ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded-md transition-transform group-hover/link:scale-105">
                                <Image
                                  src={property.image}
                                  alt={property.title}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-white/10" />
                            )}
                            <div className="max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-white truncate group-hover/link:text-amber-400 transition-colors">
                                  {property.title}
                                </p>
                                <ExternalLink className="h-3 w-3 text-white/30 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                              </div>
                              {property.validationStatus === "pending" && (
                                <span className="text-[10px] text-amber-400 block mt-0.5">
                                  • En attente de validation
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-white/80 whitespace-nowrap">
                          {new Intl.NumberFormat("fr-SN", {
                            maximumFractionDigits: 0,
                          }).format(property.price)}{" "}
                          <span className="text-xs text-white/40">FCFA</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={`${statusColors[property.status] ||
                              "border-white/20 text-white/60"
                              } border-0`}
                          >
                            {property.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-white/50 whitespace-nowrap">
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
              <div className="py-12 text-center text-white/40">
                Aucun bien ajouté récemment
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

