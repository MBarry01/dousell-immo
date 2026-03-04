// app/(vitrine)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/actions/blog';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';

export const revalidate = 3600;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt ?? undefined,
  };
}

export default async function VitrineArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') notFound();

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <ArticleRenderer
        title={article.title}
        excerpt={article.excerpt ?? undefined}
        blocks={article.blocks}
        authorName={article.author_name ?? undefined}
        publishedAt={article.published_at ?? article.created_at ?? undefined}
        category={article.category ?? undefined}
        readTime={article.read_time_minutes ?? undefined}
        coverImage={article.cover_image ?? undefined}
      />
    </div>
  );
}
