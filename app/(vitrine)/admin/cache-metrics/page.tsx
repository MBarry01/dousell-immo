"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  hitRate: string;
  avgLatency: string;
  total: number;
}

export default function CacheMetricsPage() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/cache-metrics");
      const data = await res.json();

      if (data.success) {
        setMetrics(data.metrics);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh toutes les 5 secondes
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white/70">Chargement des métriques...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white/70">Aucune métrique disponible</div>
      </div>
    );
  }

  const hitRateValue = parseFloat(metrics.hitRate);
  const hitRateColor =
    hitRateValue >= 90 ? "text-green-500" : hitRateValue >= 70 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Métriques de Cache Redis</h1>
            <p className="mt-2 text-white/60">Monitoring en temps réel</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-2">
              Dernière MAJ : {lastUpdate}
            </Badge>
            <p className="text-xs text-white/40">Auto-refresh : 5s</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hit Rate */}
          <Card variant="interactive">
            <CardHeader>
              <CardDescription>Hit Rate (Objectif: &gt;90%)</CardDescription>
              <CardTitle className={`text-4xl ${hitRateColor}`}>{metrics.hitRate}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Hits</span>
                <span className="font-semibold text-green-400">{metrics.hits}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-white/60">Misses</span>
                <span className="font-semibold text-yellow-400">{metrics.misses}</span>
              </div>
            </CardContent>
          </Card>

          {/* Latence Moyenne */}
          <Card variant="interactive">
            <CardHeader>
              <CardDescription>Latence Moyenne (Objectif: &lt;10ms)</CardDescription>
              <CardTitle className="text-4xl text-primary">{metrics.avgLatency}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/60">
                {parseFloat(metrics.avgLatency) < 10
                  ? "✅ Performance excellente"
                  : parseFloat(metrics.avgLatency) < 50
                    ? "⚠️ Performance acceptable"
                    : "❌ Performance à améliorer"}
              </p>
            </CardContent>
          </Card>

          {/* Total Operations */}
          <Card variant="interactive">
            <CardHeader>
              <CardDescription>Total Opérations</CardDescription>
              <CardTitle className="text-4xl text-white">{metrics.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/60">
                Depuis le démarrage du serveur
              </p>
            </CardContent>
          </Card>

          {/* Erreurs */}
          <Card variant="interactive">
            <CardHeader>
              <CardDescription>Erreurs Cache</CardDescription>
              <CardTitle
                className={`text-4xl ${metrics.errors > 0 ? "text-red-500" : "text-green-500"}`}
              >
                {metrics.errors}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/60">
                {metrics.errors === 0
                  ? "✅ Aucune erreur"
                  : `⚠️ ${metrics.errors} erreur(s) détectée(s)`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphique Hit Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de Réussite du Cache</CardTitle>
            <CardDescription>Répartition Hits vs Misses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barre Hits */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/70">Cache Hits</span>
                  <span className="font-semibold text-green-400">
                    {metrics.hits} ({((metrics.hits / metrics.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{
                      width: `${metrics.total > 0 ? (metrics.hits / metrics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Barre Misses */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/70">Cache Misses</span>
                  <span className="font-semibold text-yellow-400">
                    {metrics.misses} ({((metrics.misses / metrics.total) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                    style={{
                      width: `${metrics.total > 0 ? (metrics.misses / metrics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommandations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hitRateValue < 90 && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm font-medium text-yellow-400">
                  ⚠️ Hit rate inférieur à 90%
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Augmenter les TTL ou vérifier que les clés sont bien réutilisées
                </p>
              </div>
            )}

            {parseFloat(metrics.avgLatency) > 10 && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm font-medium text-yellow-400">
                  ⚠️ Latence moyenne &gt; 10ms
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Vérifier la connexion Redis ou utiliser compression pour gros objets
                </p>
              </div>
            )}

            {metrics.errors > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">❌ Erreurs détectées</p>
                <p className="mt-1 text-sm text-white/60">
                  Vérifier les logs serveur pour identifier la cause
                </p>
              </div>
            )}

            {hitRateValue >= 90 && parseFloat(metrics.avgLatency) <= 10 && metrics.errors === 0 && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm font-medium text-green-400">
                  ✅ Performance optimale !
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Le cache fonctionne parfaitement, continuez ainsi.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
