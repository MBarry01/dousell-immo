// components/admin/blog/ArticleEditor.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Article, ArticleBlock, ArticleTemplate } from '@/types/article';
import { BlockCanvas } from './BlockCanvas';
import { SeoPanel, type SeoValues } from './SeoPanel';
import { TemplateSelector } from './TemplateSelector';
import { ARTICLE_TEMPLATES } from '@/lib/blog/templates';
import { createArticle, updateArticle, publishArticle } from '@/lib/actions/blog';
import { titleToSlug } from '@/lib/blog/slug';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';

interface Props {
  article?: Article;
}

export function ArticleEditor({ article }: Props) {
  const isNew = !article;
  const [showTemplateSelector, setShowTemplateSelector] = useState(isNew);
  const [title, setTitle] = useState(article?.title ?? '');
  const [blocks, setBlocks] = useState<ArticleBlock[]>(
    (article?.blocks ?? []).map(b => b.id ? b : { ...b, id: Math.random().toString(36).slice(2, 9) })
  );
  const [seo, setSeo] = useState<SeoValues>({
    slug: article?.slug ?? '',
    meta_title: article?.meta_title ?? '',
    meta_description: article?.meta_description ?? '',
    excerpt: article?.excerpt ?? '',
    category: (article?.category ?? '') as import('@/types/article').ArticleCategory | '',
    author_name: article?.author_name ?? 'Équipe Doussel',
    cover_image: article?.cover_image ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');

  function handleTemplateSelect(template: ArticleTemplate) {
    const tmplBlocks = ARTICLE_TEMPLATES[template].blocks.map(b => ({
      ...b,
      id: Math.random().toString(36).slice(2, 9),
    }));
    setBlocks(tmplBlocks);
    setShowTemplateSelector(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Normalize category: empty string → null to match CreateArticleInput
      const category = seo.category === '' ? null : seo.category;
      const payload = {
        title,
        blocks,
        slug: seo.slug || titleToSlug(title),
        meta_title: seo.meta_title,
        meta_description: seo.meta_description,
        excerpt: seo.excerpt,
        author_name: seo.author_name,
        category,
      };
      if (isNew) {
        await createArticle({
          ...payload,
          status: 'draft',
          template: 'standard',
          content_markdown: null,
          cover_image: seo.cover_image || null,
          author_avatar: null,
        });
      } else {
        await updateArticle(article!.id, { ...payload, cover_image: seo.cover_image || null });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!article) return;
    await publishArticle(article.id);
  }

  return (
    <>
      {showTemplateSelector && <TemplateSelector onSelect={handleTemplateSelect} />}

      <div className="flex flex-col h-screen bg-background">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card shrink-0">
          <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Blog
          </Link>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de l'article..."
            className="flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex gap-2 shrink-0">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTab('editor')}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === 'editor' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Édition
              </button>
              <button
                onClick={() => setTab('preview')}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === 'preview' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Aperçu
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {!isNew && article?.status === 'draft' && (
              <button
                onClick={handlePublish}
                className="px-4 py-1.5 text-sm rounded-lg bg-[#F4C430] text-black font-semibold hover:bg-[#E5B82A] transition-colors"
              >
                Publier
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor / Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'editor' ? (
              <div className="max-w-2xl mx-auto">
                <BlockCanvas blocks={blocks} onChange={setBlocks} />
              </div>
            ) : (
              <ArticleRenderer
                title={title}
                blocks={blocks}
                excerpt={seo.excerpt || undefined}
                authorName={seo.author_name || undefined}
                category={seo.category || undefined}
                coverImage={seo.cover_image || undefined}
              />
            )}
          </div>

          {/* SEO panel sidebar */}
          <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card">
            <SeoPanel values={seo} title={title} onChange={setSeo} />
          </div>
        </div>
      </div>
    </>
  );
}
