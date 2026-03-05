// app/(vitrine)/blog/page.tsx
import type { Metadata } from 'next';
import { getArticles } from '@/lib/actions/blog';
import { VitrineBlogList } from './vitrine-blog-list';

// Force dynamic so the page is never prerendered at build time.
// The articles table may not exist yet during the initial build.
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://www.dousel.com';

export const metadata: Metadata = {
  title: 'Blog Immobilier Sénégal — Conseils, Guides & Actualités | Dousel',
  description: 'Découvrez nos articles sur l\'immobilier au Sénégal : conseils d\'investissement, guides d\'achat et de location, analyse du marché à Dakar, Saly, Diamniadio.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Blog Immobilier Sénégal | Dousel',
    description: 'Conseils, guides et actualités sur l\'immobilier au Sénégal.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
};

export default async function BlogPage() {
  const articles = await getArticles('published');

  return <VitrineBlogList articles={articles} />;
}
