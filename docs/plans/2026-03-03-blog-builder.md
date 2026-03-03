# Blog Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformer le blog Doussel en un CMS léger avec éditeur de blocs visuel dans `/admin/blog`, des templates "Le Monde", et des pages publiques ISR.

**Architecture:** Éditeur de blocs custom (dnd-kit) dans `app/(workspace)/admin/blog/`, articles stockés en Supabase (`blocks jsonb + content_markdown`), rendu public via ISR sur `/pro/blog/[slug]` et `/blog/[slug]`. Server Actions pour tout le CRUD, protégées par `requireAnyRole(["admin","superadmin"])`.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgREST + migrations) · dnd-kit (drag-and-drop) · marked (markdown→blocks) · Tailwind CSS · Cloudinary (CldImageSafe) · TypeScript

---

## Phase 1 — Foundation

### Task 1: Installer les dépendances

**Files:**
- Modify: `package.json`

**Step 1: Installer dnd-kit et marked**

```bash
cd /c/Users/Barry/Downloads/Doussel_immo
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities marked
```

Expected output: `added N packages` sans erreur.

**Step 2: Vérifier l'installation**

```bash
node -e "require('@dnd-kit/core'); require('marked'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit and marked for blog builder"
```

---

### Task 2: Créer les types TypeScript

**Files:**
- Create: `types/article.ts`

**Step 1: Écrire le fichier de types**

```typescript
// types/article.ts

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'image'
  | 'gallery'
  | 'callout'
  | 'cta'
  | 'table'
  | 'list'
  | 'video';

export type ArticleStatus = 'draft' | 'published';
export type ArticleTemplate = 'standard' | 'grand-reportage' | 'guide-pratique';
export type ArticleCategory =
  | 'Guides'
  | 'Investissement'
  | 'Juridique'
  | 'Conseils'
  | 'Marché'
  | 'Innovation';

// --- Bloc types ---

export interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface QuoteBlock {
  id: string;
  type: 'quote';
  text: string;
  author?: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  cloudinaryId: string;
  caption?: string;
  alt?: string;
}

export interface GalleryImage {
  cloudinaryId: string;
  alt?: string;
  caption?: string;
}

export interface GalleryBlock {
  id: string;
  type: 'gallery';
  images: GalleryImage[];
}

export interface CalloutBlock {
  id: string;
  type: 'callout';
  title: string;
  items: string[];
  icon?: string;
}

export interface CtaBlock {
  id: string;
  type: 'cta';
  text: string;
  href: string;
  style?: 'primary' | 'secondary';
}

export interface TableBlock {
  id: string;
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ListBlock {
  id: string;
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface VideoBlock {
  id: string;
  type: 'video';
  youtubeId: string;
  caption?: string;
}

export type ArticleBlock =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | ImageBlock
  | GalleryBlock
  | CalloutBlock
  | CtaBlock
  | TableBlock
  | ListBlock
  | VideoBlock;

// --- Article ---

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  blocks: ArticleBlock[];
  content_markdown: string | null;
  template: ArticleTemplate;
  status: ArticleStatus;
  author_name: string;
  author_avatar: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category: ArticleCategory | null;
  published_at: string | null;
  read_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateArticleInput = Pick<
  Article,
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'cover_image'
  | 'blocks'
  | 'content_markdown'
  | 'template'
  | 'status'
  | 'author_name'
  | 'author_avatar'
  | 'meta_title'
  | 'meta_description'
  | 'category'
>;

export type UpdateArticleInput = Partial<CreateArticleInput>;
```

**Step 2: Commit**

```bash
git add types/article.ts
git commit -m "feat(blog): add Article and ArticleBlock TypeScript types"
```

---

### Task 3: Migration Supabase — table `articles`

**Files:**
- Create: `supabase/migrations/20260303000001_create_articles.sql`

**Step 1: Écrire la migration**

```sql
-- supabase/migrations/20260303000001_create_articles.sql

CREATE TABLE articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text UNIQUE NOT NULL,
  excerpt             text,
  cover_image         text,
  blocks              jsonb NOT NULL DEFAULT '[]',
  content_markdown    text,
  template            text NOT NULL DEFAULT 'standard'
                        CHECK (template IN ('standard', 'grand-reportage', 'guide-pratique')),
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  author_name         text NOT NULL DEFAULT 'Équipe Doussel',
  author_avatar       text,
  meta_title          text,
  meta_description    text,
  category            text
                        CHECK (category IN ('Guides','Investissement','Juridique','Conseils','Marché','Innovation')),
  published_at        timestamptz,
  read_time_minutes   int,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX articles_slug_idx ON articles (slug);
CREATE INDEX articles_status_idx ON articles (status);
CREATE INDEX articles_category_idx ON articles (category);
CREATE INDEX articles_published_at_idx ON articles (published_at DESC NULLS LAST);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_articles_updated_at();

-- RLS (admin only via service role — no direct user access)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: public can read published articles
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (status = 'published');
```

**Step 2: Appliquer la migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260303000001_create_articles.sql... done`

Si pas de CLI Supabase local, appliquer via le dashboard Supabase > SQL Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/20260303000001_create_articles.sql
git commit -m "feat(blog): add articles table migration with RLS"
```

---

### Task 4: Server Actions CRUD + utilitaires

**Files:**
- Create: `lib/actions/blog/index.ts`
- Create: `lib/blog/markdown-to-blocks.ts`
- Create: `lib/blog/read-time.ts`
- Create: `lib/blog/slug.ts`

**Step 1: Utilitaire slug**

```typescript
// lib/blog/slug.ts
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

**Step 2: Utilitaire temps de lecture**

```typescript
// lib/blog/read-time.ts
import type { ArticleBlock } from '@/types/article';

export function calculateReadTime(blocks: ArticleBlock[]): number {
  const text = blocks
    .filter(b => ['paragraph', 'heading', 'quote', 'callout', 'list'].includes(b.type))
    .map(b => {
      if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') return b.text ?? '';
      if (b.type === 'callout') return [b.title, ...b.items].join(' ');
      if (b.type === 'list') return b.items.join(' ');
      return '';
    })
    .join(' ');

  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
```

**Step 3: Convertisseur markdown → blocs**

```typescript
// lib/blog/markdown-to-blocks.ts
import { marked, Tokens } from 'marked';
import { ArticleBlock } from '@/types/article';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function markdownToBlocks(markdown: string): ArticleBlock[] {
  const tokens = marked.lexer(markdown);
  const blocks: ArticleBlock[] = [];

  for (const token of tokens) {
    if (token.type === 'heading') {
      const t = token as Tokens.Heading;
      blocks.push({
        id: uid(),
        type: 'heading',
        level: Math.min(t.depth, 3) as 1 | 2 | 3,
        text: t.text,
      });
    } else if (token.type === 'paragraph') {
      const t = token as Tokens.Paragraph;
      blocks.push({ id: uid(), type: 'paragraph', text: t.text });
    } else if (token.type === 'blockquote') {
      const t = token as Tokens.Blockquote;
      const raw = t.text.replace(/^>\s?/gm, '').trim();
      blocks.push({ id: uid(), type: 'quote', text: raw });
    } else if (token.type === 'list') {
      const t = token as Tokens.List;
      blocks.push({
        id: uid(),
        type: 'list',
        ordered: t.ordered,
        items: t.items.map(i => i.text),
      });
    }
    // Other token types (hr, code, etc.) are ignored — admin must add manually
  }

  return blocks;
}
```

**Step 4: Server Actions**

```typescript
// lib/actions/blog/index.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAnyRole } from '@/lib/permissions';
import { titleToSlug } from '@/lib/blog/slug';
import { calculateReadTime } from '@/lib/blog/read-time';
import { markdownToBlocks } from '@/lib/blog/markdown-to-blocks';
import type { CreateArticleInput, UpdateArticleInput, ArticleBlock } from '@/types/article';

async function adminGuard() {
  await requireAnyRole(['admin', 'superadmin']);
}

export async function createArticle(input: CreateArticleInput) {
  await adminGuard();

  const slug = input.slug || titleToSlug(input.title);

  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert({ ...input, slug })
    .select()
    .single();

  if (error) throw new Error(`createArticle: ${error.message}`);
  return data;
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  await adminGuard();

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  revalidatePath(`/pro/blog/${data.slug}`);
  revalidatePath(`/blog/${data.slug}`);

  return data;
}

export async function publishArticle(id: string) {
  await adminGuard();

  // Fetch current article
  const { data: article, error: fetchError } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !article) throw new Error('Article not found');

  // Convert markdown to blocks if blocks is empty and markdown exists
  let blocks: ArticleBlock[] = article.blocks ?? [];
  if (blocks.length === 0 && article.content_markdown) {
    blocks = markdownToBlocks(article.content_markdown);
  }

  const read_time_minutes = calculateReadTime(blocks);

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      blocks,
      read_time_minutes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`publishArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  revalidatePath(`/pro/blog/${data.slug}`);
  revalidatePath(`/blog/${data.slug}`);

  return data;
}

export async function unpublishArticle(id: string) {
  await adminGuard();

  const { data, error } = await supabaseAdmin
    .from('articles')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`unpublishArticle: ${error.message}`);

  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  return data;
}

export async function deleteArticle(id: string) {
  await adminGuard();

  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`deleteArticle: ${error.message}`);

  revalidatePath('/admin/blog');
  revalidatePath('/pro/blog');
  revalidatePath('/blog');
  if (article?.slug) {
    revalidatePath(`/pro/blog/${article.slug}`);
    revalidatePath(`/blog/${article.slug}`);
  }
}

export async function getArticles(status?: 'draft' | 'published') {
  const query = supabaseAdmin
    .from('articles')
    .select('id, title, slug, status, category, published_at, read_time_minutes, created_at, template')
    .order('created_at', { ascending: false });

  if (status) query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(`getArticles: ${error.message}`);
  return data ?? [];
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function autoSaveArticle(id: string, blocks: ArticleBlock[], title: string) {
  await adminGuard();
  const read_time_minutes = calculateReadTime(blocks);
  await supabaseAdmin
    .from('articles')
    .update({ blocks, title, read_time_minutes })
    .eq('id', id);
}
```

**Step 5: Commit**

```bash
git add lib/actions/blog/index.ts lib/blog/markdown-to-blocks.ts lib/blog/read-time.ts lib/blog/slug.ts
git commit -m "feat(blog): add server actions, slug, read-time, and markdown-to-blocks utils"
```

---

## Phase 2 — Interface Admin

### Task 5: Templates de blocs préremplis

**Files:**
- Create: `lib/blog/templates.ts`

**Step 1: Définir les 3 templates**

```typescript
// lib/blog/templates.ts
import { ArticleBlock, ArticleTemplate } from '@/types/article';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const ARTICLE_TEMPLATES: Record<ArticleTemplate, { label: string; description: string; blocks: ArticleBlock[] }> = {
  standard: {
    label: 'Standard Éditorial',
    description: 'Article classique : titre, chapeau, image, paragraphes, citation.',
    blocks: [
      { id: uid(), type: 'heading', level: 1, text: 'Titre de votre article' },
      { id: uid(), type: 'paragraph', text: "Chapeau d'introduction — présentez l'essentiel en 2-3 lignes." },
      { id: uid(), type: 'image', cloudinaryId: '', caption: 'Légende de l\'image principale', alt: '' },
      { id: uid(), type: 'paragraph', text: 'Développez votre premier argument ici...' },
      { id: uid(), type: 'heading', level: 2, text: 'Sous-titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la deuxième partie...' },
      { id: uid(), type: 'quote', text: 'Citation marquante à mettre en valeur.', author: 'Source' },
      { id: uid(), type: 'paragraph', text: 'Conclusion et appel à l\'action...' },
    ],
  },
  'grand-reportage': {
    label: 'Grand Reportage',
    description: 'Guide approfondi, dossier thématique avec galerie et CTA.',
    blocks: [
      { id: uid(), type: 'image', cloudinaryId: '', caption: 'Image héro', alt: '' },
      { id: uid(), type: 'paragraph', text: "Paragraphe d'accroche — captez l'attention immédiatement." },
      { id: uid(), type: 'callout', title: 'À retenir', items: ['Point clé 1', 'Point clé 2', 'Point clé 3'] },
      { id: uid(), type: 'heading', level: 2, text: 'Chapitre 1' },
      { id: uid(), type: 'paragraph', text: 'Contenu du chapitre 1...' },
      { id: uid(), type: 'gallery', images: [] },
      { id: uid(), type: 'heading', level: 2, text: 'Chapitre 2' },
      { id: uid(), type: 'paragraph', text: 'Contenu du chapitre 2...' },
      { id: uid(), type: 'quote', text: 'Citation emblématique du reportage.', author: 'Source' },
      { id: uid(), type: 'cta', text: 'Télécharger le guide complet', href: '#', style: 'primary' },
    ],
  },
  'guide-pratique': {
    label: 'Guide Pratique',
    description: 'Tutoriel pas-à-pas avec étapes numérotées et checklist finale.',
    blocks: [
      { id: uid(), type: 'heading', level: 1, text: 'Comment faire X en Y étapes' },
      { id: uid(), type: 'callout', title: 'Ce que vous allez apprendre', items: ['Étape 1 : ...', 'Étape 2 : ...', 'Étape 3 : ...'] },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 1 — Premier titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu détaillé de la première étape...' },
      { id: uid(), type: 'image', cloudinaryId: '', caption: 'Illustration optionnelle', alt: '' },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 2 — Deuxième titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la deuxième étape...' },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 3 — Troisième titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la troisième étape...' },
      { id: uid(), type: 'cta', text: 'Prendre rendez-vous', href: '/contact', style: 'primary' },
    ],
  },
};
```

**Step 2: Commit**

```bash
git add lib/blog/templates.ts
git commit -m "feat(blog): add 3 editorial templates (standard, grand-reportage, guide-pratique)"
```

---

### Task 6: Page liste admin `/admin/blog`

**Files:**
- Create: `app/(workspace)/admin/blog/page.tsx`

**Step 1: Écrire la page liste**

```typescript
// app/(workspace)/admin/blog/page.tsx
import Link from 'next/link';
import { requireAnyRole } from '@/lib/permissions';
import { getArticles } from '@/lib/actions/blog';
import { deleteArticle, publishArticle, unpublishArticle } from '@/lib/actions/blog';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  await requireAnyRole(['admin', 'superadmin']);
  const articles = await getArticles();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles du blog</h1>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} article(s)</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          + Nouvel article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Aucun article. Créez votre premier article.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {articles.map(article => (
            <div key={article.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{article.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {article.category} · {article.read_time_minutes ?? '?'} min ·{' '}
                  {article.status === 'published'
                    ? `Publié le ${new Date(article.published_at!).toLocaleDateString('fr-FR')}`
                    : 'Brouillon'}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  article.status === 'published'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                }`}
              >
                {article.status === 'published' ? 'Publié' : 'Brouillon'}
              </span>

              <div className="shrink-0 flex items-center gap-2">
                <Link
                  href={`/admin/blog/${article.id}/edit`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                  Éditer
                </Link>
                {article.status === 'draft' ? (
                  <form action={publishArticle.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="text-xs text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      Publier
                    </button>
                  </form>
                ) : (
                  <form action={unpublishArticle.bind(null, article.id)}>
                    <button
                      type="submit"
                      className="text-xs text-yellow-600 hover:text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors"
                    >
                      Dépublier
                    </button>
                  </form>
                )}
                <form action={deleteArticle.bind(null, article.id)}>
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    onClick={e => {
                      if (!confirm('Supprimer cet article ?')) e.preventDefault();
                    }}
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(workspace\)/admin/blog/page.tsx
git commit -m "feat(blog): add admin blog list page"
```

---

### Task 7: Sélecteur de templates

**Files:**
- Create: `components/admin/blog/TemplateSelector.tsx`

**Step 1: Composant**

```tsx
// components/admin/blog/TemplateSelector.tsx
'use client';

import { ARTICLE_TEMPLATES } from '@/lib/blog/templates';
import { ArticleTemplate } from '@/types/article';

interface Props {
  onSelect: (template: ArticleTemplate) => void;
}

export function TemplateSelector({ onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        <h2 className="text-xl font-bold text-foreground mb-2">Choisir un template</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Le template détermine la structure initiale de votre article. Vous pourrez tout modifier ensuite.
        </p>
        <div className="grid gap-4">
          {(Object.entries(ARTICLE_TEMPLATES) as [ArticleTemplate, typeof ARTICLE_TEMPLATES[ArticleTemplate]][]).map(
            ([key, tmpl]) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="text-left p-5 rounded-xl border border-border hover:border-[#F4C430] bg-muted hover:bg-[#F4C430]/5 transition-all group"
              >
                <p className="font-semibold text-foreground group-hover:text-[#F4C430] transition-colors">
                  {tmpl.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{tmpl.description}</p>
                <p className="text-xs text-muted-foreground mt-2 opacity-60">
                  {tmpl.blocks.length} blocs préremplis
                </p>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/admin/blog/TemplateSelector.tsx
git commit -m "feat(blog): add template selector modal"
```

---

### Task 8: Composants blocs éditeur (10 blocs)

**Files:**
- Create: `components/admin/blog/blocks/HeadingBlock.tsx`
- Create: `components/admin/blog/blocks/ParagraphBlock.tsx`
- Create: `components/admin/blog/blocks/QuoteBlock.tsx`
- Create: `components/admin/blog/blocks/ImageBlock.tsx`
- Create: `components/admin/blog/blocks/GalleryBlock.tsx`
- Create: `components/admin/blog/blocks/CalloutBlock.tsx`
- Create: `components/admin/blog/blocks/CtaBlock.tsx`
- Create: `components/admin/blog/blocks/TableBlock.tsx`
- Create: `components/admin/blog/blocks/ListBlock.tsx`
- Create: `components/admin/blog/blocks/VideoBlock.tsx`
- Create: `components/admin/blog/blocks/index.tsx` (dispatch)

**Step 1: HeadingBlock**

```tsx
// components/admin/blog/blocks/HeadingBlock.tsx
'use client';
import { HeadingBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function HeadingBlock({ block, onChange }: Props) {
  const sizes = { 1: 'text-3xl font-bold', 2: 'text-2xl font-semibold', 3: 'text-xl font-semibold' };
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {([1, 2, 3] as const).map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${block.level === l ? 'bg-[#F4C430] text-black' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            H{l}
          </button>
        ))}
      </div>
      <input
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder={`Titre H${block.level}`}
        className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground ${sizes[block.level]}`}
      />
    </div>
  );
}
```

**Step 2: ParagraphBlock**

```tsx
// components/admin/blog/blocks/ParagraphBlock.tsx
'use client';
import { ParagraphBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ParagraphBlock({ block, onChange }: Props) {
  return (
    <textarea
      value={block.text}
      onChange={e => onChange({ ...block, text: e.target.value })}
      placeholder="Commencez à écrire..."
      rows={4}
      className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base leading-relaxed resize-none"
    />
  );
}
```

**Step 3: QuoteBlock**

```tsx
// components/admin/blog/blocks/QuoteBlock.tsx
'use client';
import { QuoteBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function QuoteBlock({ block, onChange }: Props) {
  return (
    <div className="border-l-4 border-[#F4C430] pl-4 space-y-2">
      <textarea
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte de la citation..."
        rows={3}
        className="w-full bg-transparent border-none outline-none text-foreground italic text-lg leading-relaxed resize-none"
      />
      <input
        value={block.author ?? ''}
        onChange={e => onChange({ ...block, author: e.target.value })}
        placeholder="— Source (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
    </div>
  );
}
```

**Step 4: ImageBlock**

```tsx
// components/admin/blog/blocks/ImageBlock.tsx
'use client';
import { ImageBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ImageBlock({ block, onChange }: Props) {
  return (
    <div className="space-y-2">
      <input
        value={block.cloudinaryId}
        onChange={e => onChange({ ...block, cloudinaryId: e.target.value })}
        placeholder="Cloudinary public_id (ex: blog/photo-xyz)"
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F4C430]/50"
      />
      {block.cloudinaryId && (
        <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center text-xs text-muted-foreground">
          Image: {block.cloudinaryId}
        </div>
      )}
      <input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
    </div>
  );
}
```

**Step 5: CalloutBlock**

```tsx
// components/admin/blog/blocks/CalloutBlock.tsx
'use client';
import { CalloutBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function CalloutBlock({ block, onChange }: Props) {
  const updateItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i: number) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-xl border border-[#F4C430]/30 bg-[#F4C430]/5 p-4 space-y-3">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        placeholder="Titre de l'encadré (ex: À retenir)"
        className="w-full bg-transparent border-none outline-none font-semibold text-foreground"
      />
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              placeholder={`Point ${i + 1}`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
            />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-xs">✕</button>
          </div>
        ))}
        <button onClick={addItem} className="text-xs text-[#F4C430] hover:underline">+ Ajouter un point</button>
      </div>
    </div>
  );
}
```

**Step 6: CtaBlock**

```tsx
// components/admin/blog/blocks/CtaBlock.tsx
'use client';
import { CtaBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function CtaBlock({ block, onChange }: Props) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4 space-y-3">
      <input
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte du bouton"
        className="w-full bg-transparent border-none outline-none font-semibold text-foreground"
      />
      <input
        value={block.href}
        onChange={e => onChange({ ...block, href: e.target.value })}
        placeholder="URL (ex: /contact, https://...)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
      <div className="flex gap-2">
        {(['primary', 'secondary'] as const).map(s => (
          <button key={s} onClick={() => onChange({ ...block, style: s })}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${block.style === s ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
            {s === 'primary' ? 'Doré (principal)' : 'Secondaire'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 7: ListBlock**

```tsx
// components/admin/blog/blocks/ListBlock.tsx
'use client';
import { ListBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ListBlock({ block, onChange }: Props) {
  const updateItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i: number) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button onClick={() => onChange({ ...block, ordered: false })}
          className={`text-xs px-2 py-1 rounded border transition-colors ${!block.ordered ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
          • Liste simple
        </button>
        <button onClick={() => onChange({ ...block, ordered: true })}
          className={`text-xs px-2 py-1 rounded border transition-colors ${block.ordered ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
          1. Liste numérotée
        </button>
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-muted-foreground text-sm w-5 shrink-0">{block.ordered ? `${i + 1}.` : '•'}</span>
          <input value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={`Élément ${i + 1}`}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground" />
          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-xs">✕</button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-[#F4C430] hover:underline">+ Ajouter un élément</button>
    </div>
  );
}
```

**Step 8: VideoBlock**

```tsx
// components/admin/blog/blocks/VideoBlock.tsx
'use client';
import { VideoBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function VideoBlock({ block, onChange }: Props) {
  return (
    <div className="space-y-2">
      <input
        value={block.youtubeId}
        onChange={e => onChange({ ...block, youtubeId: e.target.value })}
        placeholder="ID YouTube (ex: dQw4w9WgXcQ) ou URL complète"
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F4C430]/50"
      />
      {block.youtubeId && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${block.youtubeId}`}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      )}
      <input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
    </div>
  );
}
```

**Step 9: TableBlock**

```tsx
// components/admin/blog/blocks/TableBlock.tsx
'use client';
import { TableBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function TableBlock({ block, onChange }: Props) {
  const setHeader = (i: number, val: string) => {
    const headers = [...block.headers];
    headers[i] = val;
    onChange({ ...block, headers });
  };
  const setCell = (r: number, c: number, val: string) => {
    const rows = block.rows.map(row => [...row]);
    rows[r][c] = val;
    onChange({ ...block, rows });
  };
  const addCol = () => onChange({ ...block, headers: [...block.headers, ''], rows: block.rows.map(r => [...r, '']) });
  const addRow = () => onChange({ ...block, rows: [...block.rows, block.headers.map(() => '')] });

  return (
    <div className="overflow-x-auto space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              {block.headers.map((h, i) => (
                <th key={i} className="border-b border-border p-2">
                  <input value={h} onChange={e => setHeader(i, e.target.value)}
                    placeholder={`En-tête ${i + 1}`}
                    className="w-full bg-transparent font-semibold text-foreground text-center outline-none" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border-b border-border p-2">
                    <input value={cell} onChange={e => setCell(r, c, e.target.value)}
                      placeholder="—"
                      className="w-full bg-transparent text-foreground text-center outline-none" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button onClick={addRow} className="text-xs text-[#F4C430] hover:underline">+ Ligne</button>
        <button onClick={addCol} className="text-xs text-[#F4C430] hover:underline">+ Colonne</button>
      </div>
    </div>
  );
}
```

**Step 10: GalleryBlock**

```tsx
// components/admin/blog/blocks/GalleryBlock.tsx
'use client';
import { GalleryBlock as T, GalleryImage } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function GalleryBlock({ block, onChange }: Props) {
  const updateImage = (i: number, img: Partial<GalleryImage>) => {
    const images = block.images.map((im, idx) => idx === i ? { ...im, ...img } : im);
    onChange({ ...block, images });
  };
  const addImage = () => onChange({ ...block, images: [...block.images, { cloudinaryId: '', alt: '' }] });
  const removeImage = (i: number) => onChange({ ...block, images: block.images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${block.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {block.images.map((img, i) => (
          <div key={i} className="relative bg-muted rounded-lg p-3 space-y-2 border border-border">
            <button onClick={() => removeImage(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-xs">✕</button>
            <input value={img.cloudinaryId} onChange={e => updateImage(i, { cloudinaryId: e.target.value })}
              placeholder="Cloudinary public_id"
              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-[#F4C430]/50" />
            <input value={img.caption ?? ''} onChange={e => updateImage(i, { caption: e.target.value })}
              placeholder="Légende"
              className="w-full bg-transparent text-xs text-muted-foreground outline-none border-none" />
          </div>
        ))}
      </div>
      <button onClick={addImage} className="text-xs text-[#F4C430] hover:underline">+ Ajouter une image</button>
    </div>
  );
}
```

**Step 11: Dispatcher index**

```tsx
// components/admin/blog/blocks/index.tsx
'use client';
import { ArticleBlock } from '@/types/article';
import { HeadingBlock } from './HeadingBlock';
import { ParagraphBlock } from './ParagraphBlock';
import { QuoteBlock } from './QuoteBlock';
import { ImageBlock } from './ImageBlock';
import { GalleryBlock } from './GalleryBlock';
import { CalloutBlock } from './CalloutBlock';
import { CtaBlock } from './CtaBlock';
import { TableBlock } from './TableBlock';
import { ListBlock } from './ListBlock';
import { VideoBlock } from './VideoBlock';

interface Props {
  block: ArticleBlock;
  onChange: (b: ArticleBlock) => void;
}

export function BlockEditor({ block, onChange }: Props) {
  switch (block.type) {
    case 'heading':   return <HeadingBlock block={block} onChange={onChange} />;
    case 'paragraph': return <ParagraphBlock block={block} onChange={onChange} />;
    case 'quote':     return <QuoteBlock block={block} onChange={onChange} />;
    case 'image':     return <ImageBlock block={block} onChange={onChange} />;
    case 'gallery':   return <GalleryBlock block={block} onChange={onChange} />;
    case 'callout':   return <CalloutBlock block={block} onChange={onChange} />;
    case 'cta':       return <CtaBlock block={block} onChange={onChange} />;
    case 'table':     return <TableBlock block={block} onChange={onChange} />;
    case 'list':      return <ListBlock block={block} onChange={onChange} />;
    case 'video':     return <VideoBlock block={block} onChange={onChange} />;
  }
}
```

**Step 12: Commit**

```bash
git add components/admin/blog/blocks/
git commit -m "feat(blog): add 10 block editor components"
```

---

### Task 9: Canvas drag-and-drop + toolbar d'ajout

**Files:**
- Create: `components/admin/blog/BlockCanvas.tsx`

**Step 1: BlockCanvas avec dnd-kit**

```tsx
// components/admin/blog/BlockCanvas.tsx
'use client';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArticleBlock, BlockType } from '@/types/article';
import { BlockEditor } from './blocks';

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: '# Titre',
  paragraph: '¶ Paragraphe',
  quote: '❝ Citation',
  image: '🖼 Image',
  gallery: '🗂 Galerie',
  callout: '📌 À retenir',
  cta: '🔗 CTA',
  table: '⊞ Tableau',
  list: '☰ Liste',
  video: '▶ Vidéo',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function createBlock(type: BlockType): ArticleBlock {
  const id = uid();
  switch (type) {
    case 'heading':   return { id, type, level: 2, text: '' };
    case 'paragraph': return { id, type, text: '' };
    case 'quote':     return { id, type, text: '', author: '' };
    case 'image':     return { id, type, cloudinaryId: '', caption: '' };
    case 'gallery':   return { id, type, images: [] };
    case 'callout':   return { id, type, title: 'À retenir', items: [''] };
    case 'cta':       return { id, type, text: 'En savoir plus', href: '#', style: 'primary' };
    case 'table':     return { id, type, headers: ['Colonne 1', 'Colonne 2'], rows: [['', '']] };
    case 'list':      return { id, type, ordered: false, items: [''] };
    case 'video':     return { id, type, youtubeId: '', caption: '' };
  }
}

function SortableBlock({
  block, onChange, onRemove,
}: { block: ArticleBlock; onChange: (b: ArticleBlock) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group relative rounded-xl border border-border bg-card p-4 hover:border-[#F4C430]/30 transition-colors">
      {/* Drag handle */}
      <div {...attributes} {...listeners}
        className="absolute left-2 top-4 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted-foreground select-none">
        ⠿
      </div>
      {/* Remove */}
      <button onClick={onRemove}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 text-xs">
        ✕
      </button>
      <div className="ml-4">
        <BlockEditor block={block} onChange={onChange} />
      </div>
    </div>
  );
}

interface Props {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}

export function BlockCanvas({ blocks, onChange }: Props) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const [open, setOpen] = React.useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  function updateBlock(id: string, updated: ArticleBlock) {
    onChange(blocks.map(b => b.id === id ? updated : b));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter(b => b.id !== id));
  }

  function addBlock(type: BlockType) {
    onChange([...blocks, createBlock(type)]);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map(block => (
            <SortableBlock key={block.id} block={block}
              onChange={updated => updateBlock(block.id, updated)}
              onRemove={() => removeBlock(block.id)} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add block menu */}
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[#F4C430]/50 hover:text-[#F4C430] transition-colors">
          + Ajouter un bloc
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-2 z-20 grid grid-cols-2 gap-1 w-64 bg-card border border-border rounded-xl p-2 shadow-xl">
            {(Object.entries(BLOCK_LABELS) as [BlockType, string][]).map(([type, label]) => (
              <button key={type} onClick={() => addBlock(type)}
                className="text-left px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted hover:text-[#F4C430] transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

Note: Ajouter `import React from 'react'` en haut si nécessaire.

**Step 2: Commit**

```bash
git add components/admin/blog/BlockCanvas.tsx
git commit -m "feat(blog): add drag-and-drop BlockCanvas with dnd-kit"
```

---

### Task 10: Panel SEO + shell éditeur + pages new/edit

**Files:**
- Create: `components/admin/blog/SeoPanel.tsx`
- Create: `components/admin/blog/ArticleEditor.tsx`
- Create: `app/(workspace)/admin/blog/new/page.tsx`
- Create: `app/(workspace)/admin/blog/[id]/edit/page.tsx`

**Step 1: SeoPanel**

```tsx
// components/admin/blog/SeoPanel.tsx
'use client';
import { ArticleCategory, ArticleStatus } from '@/types/article';
import { titleToSlug } from '@/lib/blog/slug';

const CATEGORIES: ArticleCategory[] = ['Guides', 'Investissement', 'Juridique', 'Conseils', 'Marché', 'Innovation'];

interface SeoValues {
  slug: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  category: ArticleCategory | '';
  author_name: string;
}

interface Props {
  values: SeoValues;
  title: string;
  onChange: (v: SeoValues) => void;
}

const inputClass = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F4C430]/50 transition-colors';

export function SeoPanel({ values, title, onChange }: Props) {
  const set = (key: keyof SeoValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4 p-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO & Paramètres</p>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Slug (URL)</label>
        <div className="flex gap-2">
          <input value={values.slug} onChange={set('slug')} placeholder="mon-article" className={inputClass} />
          <button onClick={() => onChange({ ...values, slug: titleToSlug(title) })}
            className="shrink-0 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted text-muted-foreground">
            Auto
          </button>
        </div>
        <p className="text-xs text-muted-foreground">/pro/blog/{values.slug || 'mon-article'}</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Catégorie</label>
        <select value={values.category} onChange={set('category')} className={inputClass}>
          <option value="">Choisir...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Extrait (card blog)</label>
        <textarea value={values.excerpt} onChange={set('excerpt')} rows={2}
          placeholder="Résumé visible dans les cards et previews..." className={inputClass} />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Meta title</label>
        <input value={values.meta_title} onChange={set('meta_title')}
          placeholder={title || 'Titre SEO'} className={inputClass} />
        <p className="text-xs text-muted-foreground">{values.meta_title.length}/60 caractères</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Meta description</label>
        <textarea value={values.meta_description} onChange={set('meta_description')} rows={3}
          placeholder="Description pour les moteurs de recherche..." className={inputClass} />
        <p className="text-xs text-muted-foreground">{values.meta_description.length}/160 caractères</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Auteur</label>
        <input value={values.author_name} onChange={set('author_name')}
          placeholder="Équipe Doussel" className={inputClass} />
      </div>
    </div>
  );
}
```

**Step 2: ArticleEditor (shell complet)**

```tsx
// components/admin/blog/ArticleEditor.tsx
'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Article, ArticleBlock, ArticleTemplate } from '@/types/article';
import { BlockCanvas } from './BlockCanvas';
import { SeoPanel } from './SeoPanel';
import { TemplateSelector } from './TemplateSelector';
import { ARTICLE_TEMPLATES } from '@/lib/blog/templates';
import { createArticle, updateArticle, publishArticle } from '@/lib/actions/blog';
import { titleToSlug } from '@/lib/blog/slug';
import { ArticleRenderer } from '@/components/blog/ArticleRenderer';

interface Props {
  article?: Article; // undefined = creation mode
}

export function ArticleEditor({ article }: Props) {
  const isNew = !article;
  const [showTemplateSelector, setShowTemplateSelector] = useState(isNew);
  const [title, setTitle] = useState(article?.title ?? '');
  const [blocks, setBlocks] = useState<ArticleBlock[]>(article?.blocks ?? []);
  const [seo, setSeo] = useState({
    slug: article?.slug ?? '',
    meta_title: article?.meta_title ?? '',
    meta_description: article?.meta_description ?? '',
    excerpt: article?.excerpt ?? '',
    category: (article?.category ?? '') as any,
    author_name: article?.author_name ?? 'Équipe Doussel',
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');

  function handleTemplateSelect(template: ArticleTemplate) {
    setBlocks(ARTICLE_TEMPLATES[template].blocks.map(b => ({ ...b, id: Math.random().toString(36).slice(2, 9) })));
    setShowTemplateSelector(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { title, blocks, ...seo, slug: seo.slug || titleToSlug(title) };
      if (isNew) {
        await createArticle({ ...payload, status: 'draft', template: 'standard', content_markdown: null, cover_image: null, author_avatar: null });
      } else {
        await updateArticle(article!.id, payload);
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
          <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Blog</Link>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre de l'article..."
            className="flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setTab('editor')}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === 'editor' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Édition
              </button>
              <button onClick={() => setTab('preview')}
                className={`px-3 py-1.5 text-xs transition-colors ${tab === 'preview' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Aperçu
              </button>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {!isNew && article?.status === 'draft' && (
              <button onClick={handlePublish}
                className="px-4 py-1.5 text-sm rounded-lg bg-[#F4C430] text-black font-semibold hover:bg-[#E5B82A] transition-colors">
                Publier
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor / Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'editor' ? (
              <div className="max-w-2xl mx-auto">
                <BlockCanvas blocks={blocks} onChange={setBlocks} />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <ArticleRenderer title={title} blocks={blocks} />
              </div>
            )}
          </div>

          {/* SEO panel */}
          <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card">
            <SeoPanel values={seo} title={title} onChange={setSeo} />
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 3: Page new**

```typescript
// app/(workspace)/admin/blog/new/page.tsx
import { requireAnyRole } from '@/lib/permissions';
import { ArticleEditor } from '@/components/admin/blog/ArticleEditor';

export default async function NewArticlePage() {
  await requireAnyRole(['admin', 'superadmin']);
  return <ArticleEditor />;
}
```

**Step 4: Page edit**

```typescript
// app/(workspace)/admin/blog/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/permissions';
import { getArticleById } from '@/lib/actions/blog';
import { ArticleEditor } from '@/components/admin/blog/ArticleEditor';

interface Props { params: { id: string } }

export default async function EditArticlePage({ params }: Props) {
  await requireAnyRole(['admin', 'superadmin']);
  const article = await getArticleById(params.id);
  if (!article) notFound();
  return <ArticleEditor article={article} />;
}
```

**Step 5: Commit**

```bash
git add components/admin/blog/SeoPanel.tsx components/admin/blog/ArticleEditor.tsx
git add app/\(workspace\)/admin/blog/new/page.tsx app/\(workspace\)/admin/blog/\[id\]/edit/page.tsx
git commit -m "feat(blog): add full article editor with SEO panel and admin pages"
```

---

## Phase 3 — Pages publiques

### Task 11: Renderers publics (10 composants)

**Files:**
- Create: `components/blog/ArticleRenderer.tsx`

```tsx
// components/blog/ArticleRenderer.tsx
import Image from 'next/image';
import { ArticleBlock } from '@/types/article';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';
function cldUrl(id: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${id}`;
}

function HeadingRenderer({ block }: { block: Extract<ArticleBlock, { type: 'heading' }> }) {
  const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
  const cls = { 1: 'text-4xl font-bold mt-8 mb-4', 2: 'text-2xl font-semibold mt-6 mb-3', 3: 'text-xl font-semibold mt-4 mb-2' }[block.level];
  return <Tag className={`${cls} text-foreground font-display`}>{block.text}</Tag>;
}

function ParagraphRenderer({ block }: { block: Extract<ArticleBlock, { type: 'paragraph' }> }) {
  return <p className="text-foreground/90 leading-8 text-lg mb-6">{block.text}</p>;
}

function QuoteRenderer({ block }: { block: Extract<ArticleBlock, { type: 'quote' }> }) {
  return (
    <blockquote className="my-8 border-l-4 border-[#F4C430] pl-6">
      <p className="text-xl italic text-foreground leading-relaxed">"{block.text}"</p>
      {block.author && <cite className="block mt-2 text-sm text-muted-foreground not-italic">— {block.author}</cite>}
    </blockquote>
  );
}

function ImageRenderer({ block }: { block: Extract<ArticleBlock, { type: 'image' }> }) {
  if (!block.cloudinaryId) return null;
  return (
    <figure className="my-8">
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <Image src={cldUrl(block.cloudinaryId)} alt={block.alt ?? ''} fill className="object-cover" />
      </div>
      {block.caption && <figcaption className="mt-2 text-sm text-center text-muted-foreground">{block.caption}</figcaption>}
    </figure>
  );
}

function GalleryRenderer({ block }: { block: Extract<ArticleBlock, { type: 'gallery' }> }) {
  if (!block.images.length) return null;
  return (
    <div className={`my-8 grid gap-3 ${block.images.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {block.images.map((img, i) => (
        <figure key={i}>
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image src={cldUrl(img.cloudinaryId)} alt={img.alt ?? ''} fill className="object-cover" />
          </div>
          {img.caption && <figcaption className="mt-1 text-xs text-center text-muted-foreground">{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function CalloutRenderer({ block }: { block: Extract<ArticleBlock, { type: 'callout' }> }) {
  return (
    <div className="my-8 rounded-2xl border border-[#F4C430]/30 bg-[#F4C430]/5 p-6">
      <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span>📌</span> {block.title}
      </p>
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-foreground/80">
            <span className="text-[#F4C430] mt-1">✓</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaRenderer({ block }: { block: Extract<ArticleBlock, { type: 'cta' }> }) {
  return (
    <div className="my-8 flex justify-center">
      <a href={block.href}
        className={`inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold transition-all ${
          block.style === 'secondary'
            ? 'border border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430]/10'
            : 'bg-[#F4C430] text-black hover:bg-[#E5B82A]'
        }`}>
        {block.text} →
      </a>
    </div>
  );
}

function TableRenderer({ block }: { block: Extract<ArticleBlock, { type: 'table' }> }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F4C430]/10">
            {block.headers.map((h, i) => <th key={i} className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {row.map((cell, c) => <td key={c} className="px-4 py-3 text-foreground/80">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRenderer({ block }: { block: Extract<ArticleBlock, { type: 'list' }> }) {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className={`my-6 space-y-2 ${block.ordered ? 'list-decimal list-inside' : ''}`}>
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-foreground/90">
          {!block.ordered && <span className="text-[#F4C430] mt-1.5 shrink-0">•</span>}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}

function VideoRenderer({ block }: { block: Extract<ArticleBlock, { type: 'video' }> }) {
  if (!block.youtubeId) return null;
  return (
    <figure className="my-8">
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <iframe src={`https://www.youtube.com/embed/${block.youtubeId}`} className="absolute inset-0 w-full h-full" allowFullScreen />
      </div>
      {block.caption && <figcaption className="mt-2 text-sm text-center text-muted-foreground">{block.caption}</figcaption>}
    </figure>
  );
}

interface Props {
  title: string;
  blocks: ArticleBlock[];
  authorName?: string;
  publishedAt?: string;
  category?: string;
  readTime?: number;
}

export function ArticleRenderer({ title, blocks, authorName, publishedAt, category, readTime }: Props) {
  return (
    <article className="max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        {category && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F4C430] mb-4">{category}</p>
        )}
        {title && (
          <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground leading-tight mb-6">{title}</h1>
        )}
        {(authorName || publishedAt || readTime) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {authorName && <span>{authorName}</span>}
            {publishedAt && <><span>·</span><span>{new Date(publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></>}
            {readTime && <><span>·</span><span>{readTime} min de lecture</span></>}
          </div>
        )}
        <div className="mt-6 h-px bg-border" />
      </header>

      {/* Blocks */}
      {blocks.map(block => {
        switch (block.type) {
          case 'heading':   return <HeadingRenderer key={block.id} block={block} />;
          case 'paragraph': return <ParagraphRenderer key={block.id} block={block} />;
          case 'quote':     return <QuoteRenderer key={block.id} block={block} />;
          case 'image':     return <ImageRenderer key={block.id} block={block} />;
          case 'gallery':   return <GalleryRenderer key={block.id} block={block} />;
          case 'callout':   return <CalloutRenderer key={block.id} block={block} />;
          case 'cta':       return <CtaRenderer key={block.id} block={block} />;
          case 'table':     return <TableRenderer key={block.id} block={block} />;
          case 'list':      return <ListRenderer key={block.id} block={block} />;
          case 'video':     return <VideoRenderer key={block.id} block={block} />;
        }
      })}
    </article>
  );
}
```

**Step 2: Commit**

```bash
git add components/blog/ArticleRenderer.tsx
git commit -m "feat(blog): add ArticleRenderer with all 10 block renderers"
```

---

### Task 12: Pages publiques `/pro/blog/[slug]` et `/blog/[slug]`

**Files:**
- Create: `app/pro/blog/[slug]/page.tsx`
- Create: `app/(vitrine)/blog/[slug]/page.tsx`

**Step 1: Page pro/blog/[slug]**

```typescript
// app/pro/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
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
    openGraph: article.cover_image ? {
      images: [`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe'}/image/upload/${article.cover_image}`],
    } : undefined,
  };
}

export default async function ProBlogArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article || article.status !== 'published') notFound();

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
              image: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe'}/image/upload/${article.cover_image}`,
            }),
            ...(article.read_time_minutes && { timeRequired: `PT${article.read_time_minutes}M` }),
          }),
        }}
      />
      <div className="min-h-screen bg-[#050505] py-16 px-4">
        <ArticleRenderer
          title={article.title}
          blocks={article.blocks}
          authorName={article.author_name}
          publishedAt={article.published_at ?? undefined}
          category={article.category ?? undefined}
          readTime={article.read_time_minutes ?? undefined}
        />
      </div>
    </>
  );
}
```

**Step 2: Page (vitrine)/blog/[slug] (même pattern)**

```typescript
// app/(vitrine)/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
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
```

**Step 3: Commit**

```bash
git add app/pro/blog/\[slug\]/page.tsx app/\(vitrine\)/blog/\[slug\]/page.tsx
git commit -m "feat(blog): add public article pages with ISR and JSON-LD schema"
```

---

### Task 13: Migrer les listes existantes vers Supabase

**Files:**
- Modify: `app/pro/blog/page.tsx` (remplacer articles hardcodés par query Supabase)
- Modify: `app/(vitrine)/blog/page.tsx` (idem)

**Step 1: Modifier pro/blog/page.tsx**

En haut du fichier, remplacer la `const articles = [...]` hardcodée par :

```typescript
import { getArticles } from '@/lib/actions/blog';
// ...
const articles = await getArticles('published');
```

Puis adapter le `.map()` des cards pour utiliser les champs `Article` :
- `article.title` → titre
- `article.excerpt` → extrait
- `article.category` → catégorie
- `article.read_time_minutes + ' min'` → temps de lecture
- `article.published_at` → date formatée
- `href={'/pro/blog/' + article.slug}` → lien

**Step 2: Idem pour (vitrine)/blog/page.tsx**

Même pattern. Supprimer l'interface `Article` hardcodée locale et importer le type depuis `@/types/article`.

**Step 3: Commit**

```bash
git add app/pro/blog/page.tsx app/\(vitrine\)/blog/page.tsx
git commit -m "feat(blog): migrate blog listing pages to Supabase query"
```

---

### Task 14: Ajouter le lien Blog dans la nav admin

**Files:**
- Modify: La sidebar admin existante (vérifier `app/(workspace)/admin/` pour la nav)

**Step 1: Trouver la nav admin**

```bash
grep -r "abonnements\|admin/dashboard" app/\(workspace\)/ --include="*.tsx" -l
```

**Step 2: Ajouter l'entrée Blog**

Dans le composant de navigation admin trouvé, ajouter :

```tsx
{ href: '/admin/blog', label: 'Blog', icon: /* icône existante */ }
```

**Step 3: Commit**

```bash
git commit -am "feat(blog): add Blog link in admin navigation"
```

---

## Phase 4 — Vérification finale

### Task 15: Build + vérification

**Step 1: Vérifier le build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

Si erreurs TypeScript → corriger les types avant de continuer.

**Step 2: Vérifier les routes en dev**

```bash
npm run dev
```

Tester manuellement :
- [ ] `/admin/blog` charge la liste (vide = ok)
- [ ] `/admin/blog/new` ouvre le sélecteur de templates
- [ ] Sélectionner "Standard Éditorial" → blocs préremplis
- [ ] Modifier un bloc → preview se met à jour
- [ ] Sauvegarder → article créé en DB
- [ ] Publier → status passe à "published"
- [ ] `/pro/blog/[slug]` affiche l'article

**Step 3: Commit final**

```bash
git add -A
git commit -m "feat(blog): complete blog builder implementation"
```

---

## Résumé des fichiers créés

| Fichier | Rôle |
|---------|------|
| `types/article.ts` | Types TS (Article, blocs) |
| `supabase/migrations/..._create_articles.sql` | Migration DB |
| `lib/blog/slug.ts` | titleToSlug() |
| `lib/blog/read-time.ts` | calculateReadTime() |
| `lib/blog/markdown-to-blocks.ts` | markdown → blocs (automations) |
| `lib/blog/templates.ts` | 3 templates préremplis |
| `lib/actions/blog/index.ts` | Server Actions CRUD |
| `components/admin/blog/TemplateSelector.tsx` | Modal sélection template |
| `components/admin/blog/blocks/*.tsx` | 11 fichiers (10 blocs + index) |
| `components/admin/blog/BlockCanvas.tsx` | Drag-and-drop (dnd-kit) |
| `components/admin/blog/SeoPanel.tsx` | Panel SEO sidebar |
| `components/admin/blog/ArticleEditor.tsx` | Shell éditeur complet |
| `components/blog/ArticleRenderer.tsx` | Rendu public (10 renderers) |
| `app/(workspace)/admin/blog/page.tsx` | Liste admin |
| `app/(workspace)/admin/blog/new/page.tsx` | Création article |
| `app/(workspace)/admin/blog/[id]/edit/page.tsx` | Modification article |
| `app/pro/blog/[slug]/page.tsx` | Article public pro (ISR) |
| `app/(vitrine)/blog/[slug]/page.tsx` | Article public vitrine (ISR) |
