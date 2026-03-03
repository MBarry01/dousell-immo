// components/admin/blog/SeoPanel.tsx
'use client';
import { titleToSlug } from '@/lib/blog/slug';
import type { ArticleCategory } from '@/types/article';

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
  const set = (key: keyof SeoValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => onChange({ ...values, [key]: e.target.value });

  return (
    <div className="space-y-4 p-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO & Paramètres</p>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Slug (URL)</label>
        <div className="flex gap-2">
          <input value={values.slug} onChange={set('slug')} placeholder="mon-article" className={inputClass} />
          <button
            onClick={() => onChange({ ...values, slug: titleToSlug(title) })}
            className="shrink-0 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted text-muted-foreground"
          >
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
