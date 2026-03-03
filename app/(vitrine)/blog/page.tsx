// app/(vitrine)/blog/page.tsx
import { getArticles } from '@/lib/actions/blog';
import { VitrineBlogList } from './vitrine-blog-list';

// Force dynamic so the page is never prerendered at build time.
// The articles table may not exist yet during the initial build.
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const articles = await getArticles('published');

  return <VitrineBlogList articles={articles} />;
}
