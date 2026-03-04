// lib/actions/blog/metrics.ts
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fetchMultipleArticlesMetrics } from '@/lib/posthog';
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
      hasMeta: true, // calculé séparément (simplifié v1)
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
