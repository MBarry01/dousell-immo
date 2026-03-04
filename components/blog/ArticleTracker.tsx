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
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleLeave();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, [articleId]);

  return null; // pas de rendu visuel
}
