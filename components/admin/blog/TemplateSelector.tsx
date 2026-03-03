// components/admin/blog/TemplateSelector.tsx
'use client';

import { ARTICLE_TEMPLATES } from '@/lib/blog/templates';
import type { ArticleTemplate } from '@/types/article';

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
          {(Object.entries(ARTICLE_TEMPLATES) as [ArticleTemplate, (typeof ARTICLE_TEMPLATES)[ArticleTemplate]][]).map(
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
