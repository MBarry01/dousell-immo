// app/(vitrine)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlug, getArticles } from '@/lib/actions/blog';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';
import { ArticleTracker } from '@/components/blog/ArticleTracker';

export const revalidate = 3600;

// Pré-génère toutes les pages d'articles au build → indexation immédiate par Google
export async function generateStaticParams() {
  const articles = await getArticles('published');
  return (articles || []).map((a) => ({ slug: a.slug }));
}

const BASE_URL = 'https://www.dousel.com';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.meta_title ?? article.title;
  const description = article.meta_description ?? article.excerpt ?? undefined;
  const canonicalUrl = `${BASE_URL}/blog/${slug}`;
  const ogImage = article.cover_image ?? `${BASE_URL}/og-default.jpg`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.published_at ?? undefined,
      authors: article.author_name ? [article.author_name] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function VitrineArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') notFound();

  const canonicalUrl = `${BASE_URL}/blog/${slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.cover_image ? [article.cover_image] : undefined,
    datePublished: article.published_at ?? article.created_at ?? undefined,
    dateModified: article.published_at ?? article.created_at ?? undefined,
    author: article.author_name
      ? { '@type': 'Person', name: article.author_name }
      : { '@type': 'Organization', name: 'Dousel' },
    publisher: {
      '@type': 'Organization',
      name: 'Dousel',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    keywords: article.category ? `immobilier Sénégal, ${article.category}, Dakar` : 'immobilier Sénégal, Dakar',
    inLanguage: 'fr-SN',
    isAccessibleForFree: true,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
  );
}
