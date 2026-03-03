// app/(workspace)/admin/blog/new/page.tsx
import { requireAnyRole } from '@/lib/permissions';
import { ArticleEditor } from '@/components/admin/blog/ArticleEditor';

export default async function NewArticlePage() {
  await requireAnyRole(['admin', 'superadmin']);
  return <ArticleEditor />;
}
