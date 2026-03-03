// app/pro/blog/page.tsx
import { getArticles } from '@/lib/actions/blog';
import { ProBlogList } from './pro-blog-list';

export const revalidate = 3600;

export default async function BlogPage() {
  const articles = await getArticles('published');

  return <ProBlogList articles={articles} />;
}
