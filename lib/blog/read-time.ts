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
