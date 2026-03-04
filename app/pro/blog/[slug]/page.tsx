// app/pro/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/actions/blog';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';
import { ArticleTracker } from '@/components/blog/ArticleTracker';

export const revalidate = 3600;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt ?? undefined,
    openGraph: article.cover_image
      ? { images: [`https://res.cloudinary.com/${cloudName}/image/upload/${article.cover_image}`] }
      : undefined,
  };
}

export default async function ProBlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') notFound();

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            author: { '@type': 'Person', name: article.author_name },
            datePublished: article.published_at,
            description: article.meta_description ?? article.excerpt,
            ...(article.cover_image && {
              image: `https://res.cloudinary.com/${cloudName}/image/upload/${article.cover_image}`,
            }),
            ...(article.read_time_minutes && {
              timeRequired: `PT${article.read_time_minutes}M`,
            }),
          }),
        }}
      />
      <div className="min-h-screen bg-[#050505] pt-40 lg:pt-32 pb-20 px-4">
        <ArticleRenderer
          title={article.title}
          excerpt={article.excerpt ?? undefined}
          blocks={article.blocks}
          authorName={article.author_name ?? undefined}
          publishedAt={article.published_at ?? article.created_at ?? undefined}
          category={article.category ?? undefined}
          readTime={article.read_time_minutes ?? undefined}
          coverImage={article.cover_image ?? undefined}
          articleId={article.id}
        />
        <ArticleTracker
          articleId={article.id}
          slug={article.slug}
          category={article.category ?? undefined}
          readTimeMinutes={article.read_time_minutes ?? undefined}
        />
      </div>
    </>
  );
}
