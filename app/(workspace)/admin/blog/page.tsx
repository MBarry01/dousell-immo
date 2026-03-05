// app/(workspace)/admin/blog/page.tsx
import Link from 'next/link';
import { requireAnyRole } from '@/lib/permissions';
import { getArticles, deleteArticle, publishArticle, unpublishArticle } from '@/lib/actions/blog';
import { getArticlesMetrics } from '@/lib/actions/blog/metrics';
import { GenerateArticleModal } from '@/components/admin/blog/GenerateArticleModal';
import { BADGE_STYLES } from '@/lib/blog/editorial-score';

export const dynamic = 'force-dynamic';

function formatViews(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ScorePill({ score, badge }: { score: number; badge: keyof typeof BADGE_STYLES }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge]}`}>
      {score}
    </span>
  );
}

const BADGE_LABELS: Record<string, string> = {
  top: '🏆 Top',
  good: '✅ Bon',
  improve: '⚠️ À améliorer',
  weak: '🔴 Faible',
};

const SORT_OPTIONS = [
  { value: 'editorial', label: '📖 Score éditorial' },
  { value: 'business', label: '🎯 Score business' },
  { value: 'views', label: '👁 Vues' },
];

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string; sort?: string; badge?: string }>;
}) {
  const [context, articles, params] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticles(),
    searchParams,
  ]);
  const userEmail = context?.user?.email ?? '';

  const tab = params?.tab ?? 'articles';
  const sort = params?.sort ?? 'editorial';
  const badgeFilter = params?.badge ?? '';

  // ── Articles tab ──────────────────────────────────────────────────────────
  const page = Number(params?.page) || 1;
  const pageSize = 10;
  const totalPages = Math.ceil(articles.length / pageSize);
  const paginatedArticles = articles.slice((page - 1) * pageSize, page * pageSize);

  const publishedIds = paginatedArticles
    .filter(a => a.status === 'published')
    .map(a => a.id);

  const metricsMap = publishedIds.length > 0
    ? await getArticlesMetrics(publishedIds)
    : {};

  // ── Analytics tab ─────────────────────────────────────────────────────────
  const allPublishedIds = articles.filter(a => a.status === 'published').map(a => a.id);
  const allMetrics = tab === 'analytics' && allPublishedIds.length > 0
    ? await getArticlesMetrics(allPublishedIds)
    : {};

  const analyticsRows = articles
    .filter(a => a.status === 'published')
    .map(a => ({ article: a, m: allMetrics[a.id] }))
    .filter(({ m }) => !badgeFilter || m?.editorialBadge === badgeFilter)
    .sort((a, b) => {
      if (!a.m) return 1;
      if (!b.m) return -1;
      if (sort === 'views') return b.m.views - a.m.views;
      if (sort === 'business') return b.m.businessScore - a.m.businessScore;
      return b.m.editorialScore - a.m.editorialScore;
    });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles du blog</h1>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} article(s)</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
          <GenerateArticleModal userEmail={userEmail} />
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center"
          >
            + Nouvel article
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <Link
          href="/admin/blog"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'articles'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Articles
        </Link>
        <Link
          href="/admin/blog?tab=analytics"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'analytics'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Analytics
        </Link>
      </div>

      {/* ── Tab : Articles ──────────────────────────────────────────────── */}
      {tab === 'articles' && (
        <>
          {articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Aucun article. Créez votre premier article.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_80px_64px_64px_100px_180px] gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
                <span>Article</span>
                <span className="text-center">Vues</span>
                <span className="text-center">📖 Édit.</span>
                <span className="text-center">🎯 Biz.</span>
                <span className="text-center">Statut</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-border">
                {paginatedArticles.map(article => {
                  const m = metricsMap[article.id];
                  return (
                    <div
                      key={article.id}
                      className="flex flex-col md:grid md:grid-cols-[1fr_80px_64px_64px_100px_180px] gap-4 md:gap-2 md:items-center px-5 py-4 md:py-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 flex flex-col items-start">
                        <div className="flex items-center justify-between w-full md:hidden mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 ${article.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                            {article.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <Link href={`/admin/blog/${article.id}/analytics`} className="font-semibold text-foreground truncate block hover:text-primary transition-colors text-base md:text-sm">
                          {article.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1 md:mt-0.5">
                          {article.category} · {article.read_time_minutes ?? '?'} min
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 md:contents text-sm border-y border-border/50 py-3 my-1 md:border-none md:py-0 md:my-0">
                        <div className="flex flex-col md:contents items-center justify-center text-center">
                          <span className="md:hidden text-[10px] uppercase text-muted-foreground mb-1">Vues</span>
                          <span className="font-mono text-foreground/80 md:mx-auto">{m ? formatViews(m.views) : '—'}</span>
                        </div>
                        <div className="flex flex-col md:contents items-center justify-center text-center border-x border-border/50 md:border-none">
                          <span className="md:hidden text-[10px] uppercase text-muted-foreground mb-1">📖 Édit.</span>
                          <div className="flex justify-center md:mx-auto">
                            {m ? <ScorePill score={m.editorialScore} badge={m.editorialBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </div>
                        <div className="flex flex-col md:contents items-center justify-center text-center">
                          <span className="md:hidden text-[10px] uppercase text-muted-foreground mb-1">🎯 Biz.</span>
                          <div className="flex justify-center md:mx-auto">
                            {m ? <ScorePill score={m.businessScore} badge={m.businessBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 w-fit ${article.status === 'published' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                          {article.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 md:gap-1 mt-1 md:mt-0 justify-between md:justify-start">
                        <div className="flex gap-2 md:gap-1">
                          <Link href={`/admin/blog/${article.id}/edit`} className="text-xs font-medium bg-muted text-foreground px-3 md:px-2 py-1.5 md:py-1 rounded-md md:bg-transparent md:text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Éditer</Link>
                          {article.status === 'published' && (
                            <Link href={`/admin/blog/${article.id}/analytics`} className="text-xs font-medium bg-muted text-foreground px-3 md:px-2 py-1.5 md:py-1 rounded-md md:bg-transparent md:text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Stats</Link>
                          )}
                        </div>
                        <div className="flex gap-2 md:gap-1">
                          {article.status === 'draft' ? (
                            <form action={publishArticle.bind(null, article.id)}>
                              <button type="submit" className="text-xs font-medium bg-green-500/10 text-green-600 px-3 md:px-2 py-1.5 md:py-1 rounded-md hover:bg-green-500/20 transition-colors">Publier</button>
                            </form>
                          ) : (
                            <form action={unpublishArticle.bind(null, article.id)}>
                              <button type="submit" className="text-xs font-medium bg-yellow-500/10 text-yellow-600 px-3 md:px-2 py-1.5 md:py-1 rounded-md hover:bg-yellow-500/20 transition-colors">Dépublier</button>
                            </form>
                          )}
                          <form action={deleteArticle.bind(null, article.id)}>
                            <button type="submit" className="text-xs font-medium bg-red-500/10 text-red-500 px-3 md:px-2 py-1.5 md:py-1 rounded-md hover:bg-red-500/20 transition-colors ml-1 md:ml-0">✕</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={`/admin/blog?page=${page - 1}`} className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors text-foreground">Précédent</Link>
                ) : (
                  <button disabled className="px-4 py-2 text-sm font-medium border border-border rounded-md opacity-50 cursor-not-allowed text-foreground">Précédent</button>
                )}
                {page < totalPages ? (
                  <Link href={`/admin/blog?page=${page + 1}`} className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted transition-colors text-foreground">Suivant</Link>
                ) : (
                  <button disabled className="px-4 py-2 text-sm font-medium border border-border rounded-md opacity-50 cursor-not-allowed text-foreground">Suivant</button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab : Analytics ─────────────────────────────────────────────── */}
      {tab === 'analytics' && (
        <div>
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Tri */}
            <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
              {SORT_OPTIONS.map(opt => (
                <Link
                  key={opt.value}
                  href={`/admin/blog?tab=analytics&sort=${opt.value}${badgeFilter ? `&badge=${badgeFilter}` : ''}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sort === opt.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>

            {/* Filtre badge */}
            <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
              <Link
                href={`/admin/blog?tab=analytics&sort=${sort}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !badgeFilter ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tous
              </Link>
              {Object.entries(BADGE_LABELS).map(([value, label]) => (
                <Link
                  key={value}
                  href={`/admin/blog?tab=analytics&sort=${sort}&badge=${value}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    badgeFilter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <span className="text-xs text-muted-foreground ml-auto">{analyticsRows.length} article(s)</span>
          </div>

          {/* Tableau */}
          {analyticsRows.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Aucun article publié avec ces critères.</div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_80px_64px_64px_80px_80px_100px] gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
                <span>Article</span>
                <span className="text-center">Vues</span>
                <span className="text-center">📖 Édit.</span>
                <span className="text-center">🎯 Biz.</span>
                <span className="text-center">Scroll</span>
                <span className="text-center">Leads</span>
                <span className="text-center">Actions</span>
              </div>

              <div className="divide-y divide-border">
                {analyticsRows.map(({ article, m }) => (
                  <div
                    key={article.id}
                    className="flex flex-col md:grid md:grid-cols-[1fr_80px_64px_64px_80px_80px_100px] gap-2 md:items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <Link href={`/admin/blog/${article.id}/analytics`} className="font-semibold text-foreground truncate block hover:text-primary transition-colors text-sm">
                        {article.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{article.category} · {article.read_time_minutes ?? '?'} min</p>
                    </div>

                    <span className="font-mono text-sm text-foreground/80 md:text-center">{m ? formatViews(m.views) : '—'}</span>

                    <div className="flex md:justify-center">
                      {m ? <ScorePill score={m.editorialScore} badge={m.editorialBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </div>

                    <div className="flex md:justify-center">
                      {m ? <ScorePill score={m.businessScore} badge={m.businessBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </div>

                    <span className="text-sm text-foreground/80 md:text-center">
                      {m && m.avgScrollDepth > 0 ? `${Math.round(m.avgScrollDepth)}%` : '—'}
                    </span>

                    <span className="text-sm text-foreground/80 md:text-center">
                      {m ? (m.leadsCount + m.signupsCount) : '—'}
                    </span>

                    <div className="flex gap-1">
                      <Link href={`/admin/blog/${article.id}/analytics`} className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors">Stats</Link>
                      <Link href={`/admin/blog/${article.id}/edit`} className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">Éditer</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
