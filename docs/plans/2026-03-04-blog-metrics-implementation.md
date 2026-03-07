# Blog Metrics — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ajouter des métriques éditoriales professionnelles (PostHog comportemental + Supabase leads) au dashboard admin du blog Dousell, avec double score éditorial/business et une page analytics par article.

**Architecture:** PostHog JS SDK pour tracker vues, scroll, temps de lecture et clics CTA côté client. Supabase pour les conversions business via `article_id FK` sur la table `leads` et `profiles`. Admin Server Components qui agrègent les deux sources via PostHog HogQL Query API + requêtes Supabase.

**Tech Stack:** `posthog-js`, `posthog-node`, Next.js 16 Server Components, Supabase, Tailwind CSS

**Design doc:** `docs/plans/2026-03-04-blog-metrics-design.md`

---

## Prérequis

Avant de commencer :
1. Créer un compte PostHog sur https://eu.posthog.com (EU pour RGPD)
2. Créer un projet "Dousell Blog"
3. Récupérer :
   - `NEXT_PUBLIC_POSTHOG_KEY` (Project API key, format `phc_…`)
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://eu.posthog.com`
   - `POSTHOG_PERSONAL_API_KEY` (Personal API key, format `phx_…`, dans Account settings)
   - `POSTHOG_PROJECT_ID` (numérique, dans Project settings)
4. Ajouter ces 4 vars dans `.env.local`

---

## Task 1 : Installer PostHog et créer les helpers

**Files:**
- Modify: `package.json` (via npm install)
- Create: `lib/posthog.ts`
- Modify: `.env.local` (vars manuelles)
- Modify: `.env.local.example`

**Step 1: Installer les packages**

```bash
npm install posthog-js posthog-node
```

Expected: packages ajoutés dans node_modules, `package.json` mis à jour.

**Step 2: Créer `lib/posthog.ts`**

```typescript
// lib/posthog.ts
import { PostHog } from 'posthog-node';

// ── Server-side client (Node.js) ──────────────────────────────
let _serverClient: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!_serverClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';
    if (!apiKey) throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not set');
    _serverClient = new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 });
  }
  return _serverClient;
}

// ── PostHog HogQL Query API ────────────────────────────────────
// Fetches analytics data for a given article via HogQL
export interface ArticlePostHogMetrics {
  views: number;
  uniqueVisitors: number;
  avgScrollDepth: number;   // 0–100
  completionRate: number;   // 0–1
  ctaClickRate: number;     // 0–1
}

export async function fetchArticlePostHogMetrics(
  articleId: string,
): Promise<ArticlePostHogMetrics> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';

  if (!apiKey || !projectId) {
    // Not configured yet → return zeros (graceful degradation)
    return { views: 0, uniqueVisitors: 0, avgScrollDepth: 0, completionRate: 0, ctaClickRate: 0 };
  }

  async function hogql(query: string): Promise<number> {
    const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      next: { revalidate: 300 }, // cache 5 min côté Next.js
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return Number(json?.results?.[0]?.[0] ?? 0);
  }

  const [views, uniqueVisitors, avgScrollDepth, completions, ctaClicks] =
    await Promise.all([
      hogql(`SELECT count() FROM events WHERE event = 'article_viewed' AND properties.article_id = '${articleId}'`),
      hogql(`SELECT count(DISTINCT session_id) FROM events WHERE event = 'article_viewed' AND properties.article_id = '${articleId}'`),
      hogql(`SELECT avg(toFloat64OrZero(properties.depth)) FROM events WHERE event = 'article_scroll' AND properties.article_id = '${articleId}'`),
      hogql(`SELECT count() FROM events WHERE event = 'article_read_complete' AND properties.article_id = '${articleId}'`),
      hogql(`SELECT count() FROM events WHERE event = 'cta_clicked' AND properties.article_id = '${articleId}'`),
    ]);

  return {
    views,
    uniqueVisitors,
    avgScrollDepth,
    completionRate: views > 0 ? completions / views : 0,
    ctaClickRate: views > 0 ? ctaClicks / views : 0,
  };
}

// Batch version for the admin list (N articles in parallel)
export async function fetchMultipleArticlesMetrics(
  articleIds: string[],
): Promise<Record<string, ArticlePostHogMetrics>> {
  const results = await Promise.all(
    articleIds.map(id => fetchArticlePostHogMetrics(id).then(m => [id, m] as const)),
  );
  return Object.fromEntries(results);
}
```

**Step 3: Ajouter les vars dans `.env.local.example`**

Ajouter à la fin :
```
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_PROJECT_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_YOUR_PERSONAL_KEY
POSTHOG_PROJECT_ID=12345
```

**Step 4: Commit**

```bash
git add lib/posthog.ts .env.local.example package.json package-lock.json
git commit -m "feat(analytics): install posthog-js/posthog-node and create server helpers"
```

---

## Task 2 : Composant `ArticleTracker` (client)

**Files:**
- Create: `components/blog/ArticleTracker.tsx`

**Step 1: Créer le composant**

```typescript
// components/blog/ArticleTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

interface Props {
  articleId: string;
  slug: string;
  category?: string;
  readTimeMinutes?: number;
}

export function ArticleTracker({ articleId, slug, category, readTimeMinutes }: Props) {
  const startTimeRef = useRef<number>(Date.now());
  const firedDepths = useRef<Set<number>>(new Set());

  // ── Init PostHog once ──────────────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // on gère manuellement
      autocapture: false,
      persistence: 'memory', // RGPD : pas de cookie
    });
  }, []);

  // ── Track article_viewed ───────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem('last_article_id', articleId);
    posthog.capture('article_viewed', {
      article_id: articleId,
      slug,
      category: category ?? null,
      read_time_minutes: readTimeMinutes ?? null,
    });
  }, [articleId, slug, category, readTimeMinutes]);

  // ── Track scroll depth via IntersectionObserver ────────────
  useEffect(() => {
    const sentinels: HTMLElement[] = [];
    const article = document.querySelector('article');
    if (!article) return;

    [25, 50, 75, 100].forEach(depth => {
      const el = document.createElement('div');
      el.setAttribute('data-scroll-sentinel', String(depth));
      el.style.cssText = 'position:absolute;height:1px;width:1px;pointer-events:none;';
      el.style.top = `${depth}%`;
      article.style.position = 'relative';
      article.appendChild(el);
      sentinels.push(el);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const depth = Number(entry.target.getAttribute('data-scroll-sentinel'));
        if (firedDepths.current.has(depth)) return;
        firedDepths.current.add(depth);

        posthog.capture('article_scroll', { article_id: articleId, depth });

        if (depth >= 70) {
          const timeSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
          posthog.capture('article_read_complete', { article_id: articleId, time_seconds: timeSecs });
        }
      });
    }, { threshold: 0 });

    sentinels.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      sentinels.forEach(el => el.remove());
    };
  }, [articleId]);

  // ── Track read time on leave ───────────────────────────────
  useEffect(() => {
    const handleLeave = () => {
      const timeSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSecs < 3) return; // ignore bounces immédiats
      posthog.capture('article_read_time', { article_id: articleId, time_seconds: timeSecs });
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleLeave();
    });
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, [articleId]);

  return null; // pas de rendu visuel
}
```

**Step 2: Commit**

```bash
git add components/blog/ArticleTracker.tsx
git commit -m "feat(analytics): add ArticleTracker client component (scroll, read time, PostHog)"
```

---

## Task 3 : Tracking CTA dans `ArticleRenderer`

Le `CtaRenderer` dans `ArticleRenderer` doit capturer les clics. Problème : `ArticleRenderer` est un Server Component — on crée un sous-composant client pour le CTA.

**Files:**
- Create: `components/blog/CtaBlockRenderer.tsx`
- Modify: `components/blog/ArticleRenderer.tsx` (remplacer `CtaRenderer` inline)

**Step 1: Créer `CtaBlockRenderer.tsx`**

```typescript
// components/blog/CtaBlockRenderer.tsx
'use client';

import posthog from 'posthog-js';
import type { CtaBlock } from '@/types/article';

interface Props {
  block: CtaBlock;
  articleId: string;
}

export function CtaBlockRenderer({ block, articleId }: Props) {
  return (
    <div className="my-8 flex justify-center">
      <a
        href={block.href}
        onClick={() =>
          posthog.capture('cta_clicked', {
            article_id: articleId,
            cta_label: block.text,
            cta_href: block.href,
          })
        }
        className={`inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold transition-all ${
          block.style === 'secondary'
            ? 'border border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430]/10'
            : 'bg-[#F4C430] text-black hover:bg-[#E5B82A]'
        }`}
      >
        {block.text} →
      </a>
    </div>
  );
}
```

**Step 2: Modifier `ArticleRenderer`**

Dans `components/blog/ArticleRenderer.tsx` :

1. Ajouter l'import en haut :
```typescript
import { CtaBlockRenderer } from './CtaBlockRenderer';
```

2. Ajouter `articleId` à la Props interface :
```typescript
interface Props {
  title: string;
  excerpt?: string;
  blocks: ArticleBlock[];
  authorName?: string;
  publishedAt?: string;
  category?: string;
  readTime?: number;
  coverImage?: string;
  articleId?: string;  // ← nouveau
}
```

3. Mettre à jour la signature de la fonction :
```typescript
export function ArticleRenderer({ title, excerpt, blocks, authorName, publishedAt, category, readTime, coverImage, articleId }: Props) {
```

4. Remplacer le case `'cta'` dans le switch :
```typescript
case 'cta': return articleId
  ? <CtaBlockRenderer key={block.id} block={block} articleId={articleId} />
  : <CtaRenderer       key={block.id} block={block} />;
```

**Step 3: Commit**

```bash
git add components/blog/CtaBlockRenderer.tsx components/blog/ArticleRenderer.tsx
git commit -m "feat(analytics): add CTA click tracking via CtaBlockRenderer client component"
```

---

## Task 4 : Brancher `ArticleTracker` sur les pages article

**Files:**
- Modify: `app/(vitrine)/blog/[slug]/page.tsx`
- Modify: `app/pro/blog/[slug]/page.tsx`

**Step 1: Modifier `app/(vitrine)/blog/[slug]/page.tsx`**

Ajouter les imports :
```typescript
import { ArticleTracker } from '@/components/blog/ArticleTracker';
```

Dans le JSX, après `<ArticleRenderer … />`, ajouter :
```tsx
<ArticleTracker
  articleId={article.id}
  slug={article.slug}
  category={article.category ?? undefined}
  readTimeMinutes={article.read_time_minutes ?? undefined}
/>
```

Passer `articleId` à `ArticleRenderer` :
```tsx
<ArticleRenderer
  …
  articleId={article.id}
/>
```

**Step 2: Même modification dans `app/pro/blog/[slug]/page.tsx`**

Même pattern, même imports, même props.

**Step 3: Vérification manuelle**

```bash
npm run dev
```

Naviguer sur un article de blog → ouvrir DevTools Network → filtrer "posthog" → vérifier les calls `capture` pour `article_viewed` et `article_scroll`.

**Step 4: Commit**

```bash
git add "app/(vitrine)/blog/[slug]/page.tsx" "app/pro/blog/[slug]/page.tsx"
git commit -m "feat(analytics): wire ArticleTracker into both blog article pages"
```

---

## Task 5 : Migration Supabase — `article_id` sur `leads` et `profiles`

**Files:**
- Create: `supabase/migrations/20260304000001_add_article_id_to_leads.sql`

**Step 1: Créer la migration**

```sql
-- supabase/migrations/20260304000001_add_article_id_to_leads.sql
-- Ajoute l'attribution article aux leads et inscriptions

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_article_id_idx ON leads (article_id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_article_id UUID REFERENCES articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_signup_article_id_idx ON profiles (signup_article_id);

COMMENT ON COLUMN leads.article_id IS 'Article source du lead (attribution blog)';
COMMENT ON COLUMN profiles.signup_article_id IS 'Article lu avant inscription (attribution blog)';
```

**Step 2: Appliquer la migration**

Via Supabase MCP (préférable) ou :
```bash
npx supabase db push
```

Vérifier : les colonnes `article_id` et `signup_article_id` existent dans Supabase Studio.

**Step 3: Commit**

```bash
git add supabase/migrations/20260304000001_add_article_id_to_leads.sql
git commit -m "feat(analytics): add article_id attribution columns to leads and profiles"
```

---

## Task 6 : Attribution `article_id` dans les Server Actions

L'attribution se fait via `sessionStorage` (posé par `ArticleTracker`) → lu dans les formulaires → envoyé dans le payload.

**Files:**
- Modify: `lib/actions/blog/index.ts` (ajouter helper)
- Identifier les Server Actions qui créent des `leads` (grep dans `lib/actions/`)

**Step 1: Identifier les Server Actions leads**

```bash
grep -rn "from.*leads\|into.*leads\|\.from('leads')" lib/actions/ --include="*.ts" -l
```

Pour chaque fichier trouvé, repérer la fonction qui fait l'INSERT sur `leads`.

**Step 2: Modifier les Server Actions leads concernées**

Pattern à appliquer dans chaque Server Action qui insère un lead :

```typescript
// Avant l'insert, accepter article_id optionnel dans l'input
async function createLead(input: { name: string; phone: string; /* … */; article_id?: string | null }) {
  await supabaseAdmin
    .from('leads')
    .insert({ ...input, source: input.article_id ? 'blog' : input.source });
}
```

**Step 3: Modifier le formulaire client pour passer `article_id`**

Dans chaque formulaire côté client qui soumet vers une Server Action lead :

```typescript
// Lire l'attribution depuis sessionStorage
const articleId = typeof window !== 'undefined'
  ? sessionStorage.getItem('last_article_id')
  : null;

// Ajouter au payload
await createLeadAction({ …formData, article_id: articleId });
```

**Step 4: Attribution signup**

Trouver la Server Action qui crée un profil (signup). Ajouter :

```typescript
const signup_article_id = formData.get('signup_article_id') as string | null;
await supabaseAdmin
  .from('profiles')
  .update({ signup_article_id })
  .eq('id', userId);
```

**Step 5: Commit**

```bash
git add lib/actions/
git commit -m "feat(analytics): pass article_id attribution to leads and signup Server Actions"
```

---

## Task 7 : Utilitaire `editorial-score.ts`

**Files:**
- Create: `lib/blog/editorial-score.ts`
- Create: `lib/blog/__tests__/editorial-score.test.ts`

**Step 1: Écrire les tests en premier (TDD)**

```typescript
// lib/blog/__tests__/editorial-score.test.ts
import { computeEditorialScore, computeBusinessScore, ScoreInput } from '../editorial-score';

const perfect: ScoreInput = {
  views: 1000,
  maxViews: 1000,
  uniqueVisitors: 800,
  avgScrollDepth: 90,
  completionRate: 0.6,
  ctaClickRate: 0.08,
  leadsGenerated: 50,
  maxLeads: 50,
  hasMeta: true,
};

const empty: ScoreInput = {
  views: 0,
  maxViews: 1000,
  uniqueVisitors: 0,
  avgScrollDepth: 0,
  completionRate: 0,
  ctaClickRate: 0,
  leadsGenerated: 0,
  maxLeads: 50,
  hasMeta: false,
};

describe('computeEditorialScore', () => {
  it('returns 100 for perfect article', () => {
    expect(computeEditorialScore(perfect)).toBe(100);
  });
  it('returns 0 for empty article', () => {
    expect(computeEditorialScore(empty)).toBe(0);
  });
  it('returns value between 0 and 100', () => {
    const mid: ScoreInput = { ...perfect, views: 300, avgScrollDepth: 50, completionRate: 0.2, leadsGenerated: 5 };
    const score = computeEditorialScore(mid);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('computeBusinessScore', () => {
  it('returns 100 for perfect article', () => {
    expect(computeBusinessScore(perfect)).toBe(100);
  });
  it('returns 0 for empty article', () => {
    expect(computeBusinessScore(empty)).toBe(0);
  });
});
```

**Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
npx jest lib/blog/__tests__/editorial-score.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../editorial-score'`

**Step 3: Créer `lib/blog/editorial-score.ts`**

```typescript
// lib/blog/editorial-score.ts

export interface ScoreInput {
  views: number;
  maxViews: number;         // max views dans le corpus (pour normaliser)
  uniqueVisitors: number;
  avgScrollDepth: number;   // 0–100
  completionRate: number;   // 0–1
  ctaClickRate: number;     // 0–1
  leadsGenerated: number;
  maxLeads: number;         // max leads dans le corpus
  hasMeta: boolean;         // meta_title + meta_description + cover_image + excerpt
}

// ── Helpers ────────────────────────────────────────────────────

function norm(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(value / max, 1);
}

function clamp100(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

// ── Composantes ────────────────────────────────────────────────

function audienceScore(i: ScoreInput): number {
  const viewsNorm = norm(i.views, i.maxViews) * 15;
  const freshnessRatio = i.views > 0 ? Math.min(i.uniqueVisitors / i.views, 1) * 15 : 0;
  return viewsNorm + freshnessRatio;
}

function engagementScore(i: ScoreInput): number {
  const scroll = i.avgScrollDepth >= 80 ? 15 : i.avgScrollDepth >= 50 ? 10 : 5;
  const completion = i.completionRate >= 0.5 ? 15 : i.completionRate >= 0.25 ? 8 : 3;
  return scroll + completion;
}

function conversionScore(i: ScoreInput): number {
  const leadsNorm = norm(i.leadsGenerated, i.maxLeads) * 15;
  const ctr = i.ctaClickRate >= 0.05 ? 10 : i.ctaClickRate >= 0.02 ? 5 : 0;
  return leadsNorm + ctr;
}

function seoScore(i: ScoreInput): number {
  return i.hasMeta ? 15 : 0; // simplifié v1 : full ou rien
}

// ── Scores publics ─────────────────────────────────────────────

// Poids éditorial : 40% engagement · 35% audience · 15% SEO · 10% conversion
export function computeEditorialScore(i: ScoreInput): number {
  const raw =
    engagementScore(i) * (40 / 30) +
    audienceScore(i)   * (35 / 30) +
    seoScore(i)        * (15 / 15) +
    conversionScore(i) * (10 / 25);
  return clamp100(raw);
}

// Poids business : 50% conversion · 25% engagement · 15% audience · 10% SEO
export function computeBusinessScore(i: ScoreInput): number {
  const raw =
    conversionScore(i) * (50 / 25) +
    engagementScore(i) * (25 / 30) +
    audienceScore(i)   * (15 / 30) +
    seoScore(i)        * (10 / 15);
  return clamp100(raw);
}

// ── Badges ────────────────────────────────────────────────────

export type ScoreBadge = 'top' | 'good' | 'improve' | 'weak';

export function scoreBadge(score: number): ScoreBadge {
  if (score >= 70) return 'top';
  if (score >= 45) return 'good';
  if (score >= 25) return 'improve';
  return 'weak';
}

export const BADGE_STYLES: Record<ScoreBadge, string> = {
  top:     'bg-green-500/10 text-green-600 dark:text-green-400',
  good:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  improve: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  weak:    'bg-red-500/10 text-red-500',
};
```

**Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
npx jest lib/blog/__tests__/editorial-score.test.ts --no-coverage
```

Expected: PASS (3 suites, 6 tests)

**Step 5: Commit**

```bash
git add lib/blog/editorial-score.ts lib/blog/__tests__/editorial-score.test.ts
git commit -m "feat(analytics): add editorial-score.ts with TDD (dual editorial/business scores)"
```

---

## Task 8 : Server Action `lib/actions/blog/metrics.ts`

Agrège PostHog + Supabase pour alimenter l'admin.

**Files:**
- Create: `lib/actions/blog/metrics.ts`

**Step 1: Créer le fichier**

```typescript
// lib/actions/blog/metrics.ts
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fetchArticlePostHogMetrics, fetchMultipleArticlesMetrics } from '@/lib/posthog';
import {
  computeEditorialScore,
  computeBusinessScore,
  scoreBadge,
  type ScoreInput,
} from '@/lib/blog/editorial-score';

export interface ArticleMetrics {
  articleId: string;
  views: number;
  uniqueVisitors: number;
  avgScrollDepth: number;
  completionRate: number;
  ctaClickRate: number;
  leadsCount: number;
  signupsCount: number;
  editorialScore: number;
  businessScore: number;
  editorialBadge: ReturnType<typeof scoreBadge>;
  businessBadge: ReturnType<typeof scoreBadge>;
}

// ── Pour la liste admin (N articles) ──────────────────────────

export async function getArticlesMetrics(
  articleIds: string[],
): Promise<Record<string, ArticleMetrics>> {
  if (articleIds.length === 0) return {};

  const [posthogMap, leadsRows, signupsRows] = await Promise.all([
    fetchMultipleArticlesMetrics(articleIds),
    supabaseAdmin
      .from('leads')
      .select('article_id')
      .in('article_id', articleIds),
    supabaseAdmin
      .from('profiles')
      .select('signup_article_id')
      .in('signup_article_id', articleIds),
  ]);

  // Compter les leads/signups par article
  const leadsCounts: Record<string, number> = {};
  const signupsCounts: Record<string, number> = {};
  for (const row of leadsRows.data ?? []) {
    if (row.article_id) leadsCounts[row.article_id] = (leadsCounts[row.article_id] ?? 0) + 1;
  }
  for (const row of signupsRows.data ?? []) {
    if (row.signup_article_id) signupsCounts[row.signup_article_id] = (signupsCounts[row.signup_article_id] ?? 0) + 1;
  }

  // Max pour normalisation
  const allViews = articleIds.map(id => posthogMap[id]?.views ?? 0);
  const allLeads = articleIds.map(id => (leadsCounts[id] ?? 0) + (signupsCounts[id] ?? 0));
  const maxViews = Math.max(...allViews, 1);
  const maxLeads = Math.max(...allLeads, 1);

  const result: Record<string, ArticleMetrics> = {};
  for (const articleId of articleIds) {
    const ph = posthogMap[articleId] ?? { views: 0, uniqueVisitors: 0, avgScrollDepth: 0, completionRate: 0, ctaClickRate: 0 };
    const leadsCount = leadsCounts[articleId] ?? 0;
    const signupsCount = signupsCounts[articleId] ?? 0;

    const input: ScoreInput = {
      views: ph.views,
      maxViews,
      uniqueVisitors: ph.uniqueVisitors,
      avgScrollDepth: ph.avgScrollDepth,
      completionRate: ph.completionRate,
      ctaClickRate: ph.ctaClickRate,
      leadsGenerated: leadsCount + signupsCount,
      maxLeads,
      hasMeta: true, // calculé séparément (on simplify ici)
    };

    const editorialScore = computeEditorialScore(input);
    const businessScore = computeBusinessScore(input);

    result[articleId] = {
      articleId,
      views: ph.views,
      uniqueVisitors: ph.uniqueVisitors,
      avgScrollDepth: ph.avgScrollDepth,
      completionRate: ph.completionRate,
      ctaClickRate: ph.ctaClickRate,
      leadsCount,
      signupsCount,
      editorialScore,
      businessScore,
      editorialBadge: scoreBadge(editorialScore),
      businessBadge: scoreBadge(businessScore),
    };
  }

  return result;
}

// ── Pour la page détail (1 article) ───────────────────────────

export async function getArticleDetailMetrics(articleId: string): Promise<ArticleMetrics> {
  const map = await getArticlesMetrics([articleId]);
  return map[articleId] ?? {
    articleId,
    views: 0, uniqueVisitors: 0, avgScrollDepth: 0, completionRate: 0, ctaClickRate: 0,
    leadsCount: 0, signupsCount: 0,
    editorialScore: 0, businessScore: 0,
    editorialBadge: 'weak', businessBadge: 'weak',
  };
}
```

**Step 2: Commit**

```bash
git add lib/actions/blog/metrics.ts
git commit -m "feat(analytics): add getArticlesMetrics action aggregating PostHog + Supabase"
```

---

## Task 9 : Mettre à jour la liste admin `/admin/blog`

**Files:**
- Modify: `app/(workspace)/admin/blog/page.tsx`

**Step 1: Modifier la page**

Remplacer le contenu de `app/(workspace)/admin/blog/page.tsx` par :

```typescript
// app/(workspace)/admin/blog/page.tsx
import Link from 'next/link';
import { requireAnyRole } from '@/lib/permissions';
import { getArticles, deleteArticle, publishArticle, unpublishArticle } from '@/lib/actions/blog';
import { getArticlesMetrics } from '@/lib/actions/blog/metrics';
import { GenerateArticleModal } from '@/components/admin/blog/GenerateArticleModal';
import { BADGE_STYLES } from '@/lib/blog/editorial-score';

export const dynamic = 'force-dynamic';

function formatViews(n: number): string {
  if (n === 0) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ScorePill({ score, badge }: { score: number; badge: keyof typeof BADGE_STYLES }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge]}`}>
      {score}
    </span>
  );
}

export default async function AdminBlogPage() {
  const [context, articles] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticles(),
  ]);
  const userEmail = context?.user?.email ?? '';

  const publishedIds = articles
    .filter(a => a.status === 'published')
    .map(a => a.id);

  const metricsMap = publishedIds.length > 0
    ? await getArticlesMetrics(publishedIds)
    : {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles du blog</h1>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} article(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateArticleModal userEmail={userEmail} />
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Nouvel article
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Aucun article. Créez votre premier article.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_64px_64px_100px_180px] gap-2 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted/50">
            <span>Article</span>
            <span className="text-center">Vues</span>
            <span className="text-center">📖 Édit.</span>
            <span className="text-center">🎯 Biz.</span>
            <span className="text-center">Statut</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {articles.map(article => {
              const m = metricsMap[article.id];
              return (
                <div
                  key={article.id}
                  className="grid grid-cols-[1fr_80px_64px_64px_100px_180px] gap-2 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  {/* Titre */}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/blog/${article.id}/analytics`}
                      className="font-medium text-foreground truncate block hover:text-primary transition-colors"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.category} · {article.read_time_minutes ?? '?'} min
                    </p>
                  </div>

                  {/* Vues */}
                  <span className="text-center text-sm font-mono text-foreground/80">
                    {m ? formatViews(m.views) : '—'}
                  </span>

                  {/* Score éditorial */}
                  <div className="flex justify-center">
                    {m ? <ScorePill score={m.editorialScore} badge={m.editorialBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>

                  {/* Score business */}
                  <div className="flex justify-center">
                    {m ? <ScorePill score={m.businessScore} badge={m.businessBadge} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>

                  {/* Statut */}
                  <span
                    className={`text-xs font-medium rounded-full px-2.5 py-0.5 w-fit ${
                      article.status === 'published'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {article.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/blog/${article.id}/edit`}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                    >
                      Éditer
                    </Link>
                    {article.status === 'published' && (
                      <Link
                        href={`/admin/blog/${article.id}/analytics`}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        Stats
                      </Link>
                    )}
                    {article.status === 'draft' ? (
                      <form action={publishArticle.bind(null, article.id)}>
                        <button type="submit" className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-500/10 transition-colors">
                          Publier
                        </button>
                      </form>
                    ) : (
                      <form action={unpublishArticle.bind(null, article.id)}>
                        <button type="submit" className="text-xs text-yellow-600 px-2 py-1 rounded hover:bg-yellow-500/10 transition-colors">
                          Dépublier
                        </button>
                      </form>
                    )}
                    <form action={deleteArticle.bind(null, article.id)}>
                      <button type="submit" className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Vérifier visuellement**

```bash
npm run dev
```

Naviguer sur `/admin/blog` → vérifier le tableau avec colonnes Vues / Score éditorial / Score business.

**Step 3: Commit**

```bash
git add "app/(workspace)/admin/blog/page.tsx"
git commit -m "feat(analytics): add metrics columns (views, editorial score, business score) to admin blog list"
```

---

## Task 10 : Page analytics `/admin/blog/[id]/analytics`

**Files:**
- Create: `app/(workspace)/admin/blog/[id]/analytics/page.tsx`

**Step 1: Créer la page**

```typescript
// app/(workspace)/admin/blog/[id]/analytics/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAnyRole } from '@/lib/permissions';
import { getArticleById } from '@/lib/actions/blog';
import { getArticleDetailMetrics } from '@/lib/actions/blog/metrics';
import { BADGE_STYLES } from '@/lib/blog/editorial-score';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, score, badge }: { label: string; score: number; badge: keyof typeof BADGE_STYLES }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className={`text-sm font-bold rounded-full px-3 py-1 ${BADGE_STYLES[badge]}`}>{score} / 100</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            badge === 'top' ? 'bg-green-500' : badge === 'good' ? 'bg-yellow-500' : badge === 'improve' ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function ArticleAnalyticsPage({ params }: Props) {
  const { id } = await params;
  const [, article, metrics] = await Promise.all([
    requireAnyRole(['admin', 'superadmin']),
    getArticleById(id),
    getArticleDetailMetrics(id),
  ]);

  if (!article) notFound();

  const avgReadTimeSecs = article.read_time_minutes
    ? Math.round(article.read_time_minutes * 60 * metrics.completionRate)
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/blog" className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
          ← Retour
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{article.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {article.category} · Publié le{' '}
            {article.published_at
              ? new Date(article.published_at).toLocaleDateString('fr-FR')
              : '—'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Vues totales"
          value={metrics.views.toLocaleString('fr-FR')}
          sub={`${metrics.uniqueVisitors.toLocaleString('fr-FR')} visiteurs uniques`}
        />
        <KpiCard
          label="Temps de lecture"
          value={avgReadTimeSecs > 0 ? formatDuration(avgReadTimeSecs) : '—'}
          sub="estimé (basé sur la complétion)"
        />
        <KpiCard
          label="Scroll moyen"
          value={`${Math.round(metrics.avgScrollDepth)}%`}
          sub="profondeur de lecture"
        />
        <KpiCard
          label="Taux de complétion"
          value={`${Math.round(metrics.completionRate * 100)}%`}
          sub="lecteurs > 70% de l'article"
        />
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar label="Score éditorial (qualité média)" score={metrics.editorialScore} badge={metrics.editorialBadge} />
        <ScoreBar label="Score business (valeur SaaS)" score={metrics.businessScore} badge={metrics.businessBadge} />
      </div>

      {/* Leads detail */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Leads générés depuis cet article</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Clics sur CTA</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {Math.round(metrics.ctaClickRate * metrics.views)}
              </span>
              <span className="text-xs text-muted-foreground">
                (CTR {(metrics.ctaClickRate * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Leads contact / biens</span>
            <span className="text-sm font-medium text-foreground">{metrics.leadsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Inscriptions attribuées</span>
            <span className="text-sm font-medium text-foreground">{metrics.signupsCount}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total leads</span>
            <span className="text-sm font-bold text-foreground">
              {metrics.leadsCount + metrics.signupsCount}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
```

**Step 2: Vérifier visuellement**

```bash
npm run dev
```

Naviguer sur `/admin/blog/[id]/analytics` → vérifier les 4 KPI cards, les 2 barres de score, et la section leads.

**Step 3: Build check**

```bash
npm run build
```

Expected: build sans erreurs TypeScript.

**Step 4: Commit final**

```bash
git add "app/(workspace)/admin/blog/[id]/analytics/page.tsx"
git commit -m "feat(analytics): add /admin/blog/[id]/analytics detail page with KPIs, scores, leads"
```

---

## Checklist finale

- [ ] PostHog reçoit `article_viewed` events (vérifier dans PostHog Live Events)
- [ ] `article_scroll` events se déclenchent à 25/50/75/100%
- [ ] `cta_clicked` se déclenche au clic sur un bouton CTA
- [ ] La migration Supabase est appliquée (colonnes `article_id` et `signup_article_id` présentes)
- [ ] La liste admin affiche les colonnes Vues / Score éditorial / Score business
- [ ] La page analytics s'affiche sans erreur (même avec des métriques à 0)
- [ ] `npm run build` passe sans erreur

---

## Variables d'environnement à ajouter dans Vercel

Avant déploiement prod :
```
NEXT_PUBLIC_POSTHOG_KEY=phc_…
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_…
POSTHOG_PROJECT_ID=…
```
