// app/(vitrine)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/actions/blog';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';

export const revalidate = 3600;

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt ?? undefined,
  };
}

export default async function VitrineArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article || article.status !== 'published') notFound();

  return (
    <div className="min-h-screen py-16 px-4">
      <ArticleRenderer
        title={article.title}
        blocks={article.blocks}
        authorName={article.author_name}
        publishedAt={article.published_at ?? undefined}
        category={article.category ?? undefined}
        readTime={article.read_time_minutes ?? undefined}
      />
    </div>
  );
}
