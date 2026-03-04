// app/(workspace)/admin/blog/page.tsx
import Link from 'next/link';
import { requireAnyRole } from '@/lib/permissions';
import { getArticles, deleteArticle, publishArticle, unpublishArticle } from '@/lib/actions/blog';
import { GenerateArticleModal } from '@/components/admin/blog/GenerateArticleModal';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const [context, articles] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticles(),
  ]);
  const userEmail = context?.user?.email ?? '';

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {articles.map(article => (
            <div key={article.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{article.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {article.category} · {article.read_time_minutes ?? '?'} min ·{' '}
                  {article.status === 'published'
                    ? `Publié le ${new Date(article.published_at!).toLocaleDateString('fr-FR')}`
                    : 'Brouillon'}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  article.status === 'published'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                }`}
              >
                {article.status === 'published' ? 'Publié' : 'Brouillon'}
              </span>

              <div className="shrink-0 flex items-center gap-2">
                <Link
                  href={`/admin/blog/${article.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                  Éditer
                </Link>
                {article.status === 'draft' ? (
                  <form action={publishArticle.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="text-xs text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      Publier
                    </button>
                  </form>
                ) : (
                  <form action={unpublishArticle.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="text-xs text-yellow-600 hover:text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors"
                    >
                      Dépublier
                    </button>
                  </form>
                )}
                <form action={deleteArticle.bind(null, article.id)}>
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
