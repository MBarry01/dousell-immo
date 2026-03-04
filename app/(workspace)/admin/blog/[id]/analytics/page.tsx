// app/(workspace)/admin/blog/[id]/analytics/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/permissions';
import { getArticleById } from '@/lib/actions/blog';
import { getArticleDetailMetrics } from '@/lib/actions/blog/metrics';
import { BADGE_STYLES } from '@/lib/blog/editorial-score';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, score, badge }: { label: string; score: number; badge: keyof typeof BADGE_STYLES }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className={`text-sm font-bold rounded-full px-3 py-1 ${BADGE_STYLES[badge]}`}>{score} / 100</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            badge === 'top' ? 'bg-green-500' : badge === 'good' ? 'bg-yellow-500' : badge === 'improve' ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function ArticleAnalyticsPage({ params }: Props) {
  const { id } = await params;
  const [, article, metrics] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticleById(id),
    getArticleDetailMetrics(id),
  ]);

  if (!article) notFound();

  const avgReadTimeSecs = article.read_time_minutes
    ? Math.round(article.read_time_minutes * 60 * metrics.completionRate)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/blog" className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
          ← Retour
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{article.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {article.category} · Publié le{' '}
            {article.published_at
              ? new Date(article.published_at).toLocaleDateString('fr-FR')
              : '—'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Vues totales"
          value={metrics.views.toLocaleString('fr-FR')}
          sub={`${metrics.uniqueVisitors.toLocaleString('fr-FR')} visiteurs uniques`}
        />
        <KpiCard
          label="Temps de lecture"
          value={avgReadTimeSecs > 0 ? formatDuration(avgReadTimeSecs) : '—'}
          sub="estimé (basé sur la complétion)"
        />
        <KpiCard
          label="Scroll moyen"
          value={`${Math.round(metrics.avgScrollDepth)}%`}
          sub="profondeur de lecture"
        />
        <KpiCard
          label="Taux de complétion"
          value={`${Math.round(metrics.completionRate * 100)}%`}
          sub="lecteurs > 70% de l'article"
        />
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar label="Score éditorial (qualité média)" score={metrics.editorialScore} badge={metrics.editorialBadge} />
        <ScoreBar label="Score business (valeur SaaS)" score={metrics.businessScore} badge={metrics.businessBadge} />
      </div>

      {/* Leads detail */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Leads générés depuis cet article</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Clics sur CTA</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {Math.round(metrics.ctaClickRate * metrics.views)}
              </span>
              <span className="text-xs text-muted-foreground">
                (CTR {(metrics.ctaClickRate * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Leads contact / biens</span>
            <span className="text-sm font-medium text-foreground">{metrics.leadsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Inscriptions attribuées</span>
            <span className="text-sm font-medium text-foreground">{metrics.signupsCount}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total leads</span>
            <span className="text-sm font-bold text-foreground">
              {metrics.leadsCount + metrics.signupsCount}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
