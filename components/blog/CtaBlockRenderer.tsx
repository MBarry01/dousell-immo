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
