// app/(workspace)/admin/blog/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/permissions';
import { getArticleById } from '@/lib/actions/blog';
import { ArticleEditor } from '@/components/admin/blog/ArticleEditor';
import type { Article } from '@/types/article';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  await requireAnyRole(['admin', 'superadmin']);
  const { id } = await params;
  const raw = await getArticleById(id);
  if (!raw) notFound();
  // Cast from Supabase row (articles table not in generated types yet) to domain type
  const article = raw as unknown as Article;
  return <ArticleEditor article={article} />;
}
