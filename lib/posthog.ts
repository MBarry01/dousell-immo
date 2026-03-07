// lib/posthog.ts
import { PostHog } from 'posthog-node';

// ── Server-side client (Node.js) ──────────────────────────────
let _serverClient: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!_serverClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.posthog.com';
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
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.posthog.com';

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
