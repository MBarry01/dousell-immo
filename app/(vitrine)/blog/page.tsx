// app/(vitrine)/blog/page.tsx
import { getArticles } from '@/lib/actions/blog';
import { VitrineBlogList } from './vitrine-blog-list';

export const revalidate = 3600;

export default async function BlogPage() {
  const articles = await getArticles('published');

  return <VitrineBlogList articles={articles} />;
}
