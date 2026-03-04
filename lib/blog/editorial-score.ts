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
  const scroll = i.avgScrollDepth >= 80 ? 15 : i.avgScrollDepth >= 50 ? 10 : i.avgScrollDepth >= 25 ? 5 : 0;
  const completion = i.completionRate >= 0.5 ? 15 : i.completionRate >= 0.25 ? 8 : i.completionRate > 0 ? 3 : 0;
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
