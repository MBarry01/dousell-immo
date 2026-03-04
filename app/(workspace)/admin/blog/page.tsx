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

export default async function AdminBlogPage() {
  const [context, articles] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticles(),
  ]);
  const userEmail = context?.user?.email ?? '';

  const publishedIds = articles
    .filter(a => a.status === 'published')
    .map(a => a.id);

  const metricsMap = publishedIds.length > 0
    ? await getArticlesMetrics(publishedIds)
    : {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles du blog</h1>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} article(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateArticleModal userEmail={userEmail} />
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Nouvel article
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Aucun article. Créez votre premier article.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_64px_64px_100px_180px] gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
            <span>Article</span>
            <span className="text-center">Vues</span>
            <span className="text-center">📖 Édit.</span>
            <span className="text-center">🎯 Biz.</span>
            <span className="text-center">Statut</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {articles.map(article => {
              const m = metricsMap[article.id];
              return (
                <div
                  key={article.id}
                  className="grid grid-cols-[1fr_80px_64px_64px_100px_180px] gap-2 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  {/* Titre */}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/blog/${article.id}/analytics`}
                      className="font-medium text-foreground truncate block hover:text-primary transition-colors"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.category} · {article.read_time_minutes ?? '?'} min
                    </p>
                  </div>

                  {/* Vues */}
                  <span className="text-center text-sm font-mono text-foreground/80">
                    {m ? formatViews(m.views) : '—'}
                  </span>

                  {/* Score éditorial */}
                  <div className="flex justify-center">
                    {m ? <ScorePill score={m.editorialScore} badge={m.editorialBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>

                  {/* Score business */}
                  <div className="flex justify-center">
                    {m ? <ScorePill score={m.businessScore} badge={m.businessBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>

                  {/* Statut */}
                  <span
                    className={`text-xs font-medium rounded-full px-2.5 py-0.5 w-fit ${
                      article.status === 'published'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {article.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/blog/${article.id}/edit`}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                    >
                      Éditer
                    </Link>
                    {article.status === 'published' && (
                      <Link
                        href={`/admin/blog/${article.id}/analytics`}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        Stats
                      </Link>
                    )}
                    {article.status === 'draft' ? (
                      <form action={publishArticle.bind(null, article.id)}>
                        <button type="submit" className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-500/10 transition-colors">
                          Publier
                        </button>
                      </form>
                    ) : (
                      <form action={unpublishArticle.bind(null, article.id)}>
                        <button type="submit" className="text-xs text-yellow-600 px-2 py-1 rounded hover:bg-yellow-500/10 transition-colors">
                          Dépublier
                        </button>
                      </form>
                    )}
                    <form action={deleteArticle.bind(null, article.id)}>
                      <button type="submit" className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
