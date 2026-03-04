// lib/blog/__tests__/editorial-score.test.ts
import { describe, it, expect } from 'vitest';
import { computeEditorialScore, computeBusinessScore } from '../editorial-score';
import type { ScoreInput } from '../editorial-score';

const perfect: ScoreInput = {
  views: 1000,
  maxViews: 1000,
  uniqueVisitors: 1000,
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
