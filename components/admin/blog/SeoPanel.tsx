// components/admin/blog/SeoPanel.tsx
'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { titleToSlug } from '@/lib/blog/slug';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import type { ArticleCategory } from '@/types/article';

const CATEGORIES: ArticleCategory[] = ['Guides', 'Investissement', 'Juridique', 'Conseils', 'Marché', 'Innovation'];
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

export interface SeoValues {
  slug: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  category: ArticleCategory | '';
  author_name: string;
  cover_image: string;
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

  const coverInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error: uploadError } = useCloudinaryUpload();

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result) onChange({ ...values, cover_image: result.publicId });
  }

  const coverUrl = values.cover_image
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_400,q_auto,f_auto/${values.cover_image}`
    : null;

  return (
    <div className="space-y-4 p-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO & Paramètres</p>

      {/* Cover image */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Image de couverture</label>
        {coverUrl ? (
          <div className="relative rounded-lg overflow-hidden aspect-video group">
            <Image src={coverUrl} alt="Cover" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-2.5 py-1 bg-white/90 text-black text-xs rounded-lg font-medium"
              >
                Changer
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...values, cover_image: '' })}
                className="px-2.5 py-1 bg-red-500/90 text-white text-xs rounded-lg font-medium"
              >
                Retirer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg border-2 border-dashed border-border hover:border-[#F4C430]/50 bg-muted py-6 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xl">🖼</span>
            )}
            <span className="text-xs">{uploading ? 'Upload...' : 'Ajouter une couverture'}</span>
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      </div>

      {/* Slug */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Slug (URL)</label>
        <div className="flex gap-2">
          <input value={values.slug} onChange={set('slug')} placeholder="mon-article" className={inputClass} />
          <button
            type="button"
            onClick={() => onChange({ ...values, slug: titleToSlug(title) })}
            className="shrink-0 px-3 py-2 text-xs rounded-lg border border-border hover:bg-muted text-muted-foreground"
          >
            Auto
          </button>
        </div>
        <p className="text-xs text-muted-foreground">/pro/blog/{values.slug || 'mon-article'}</p>
      </div>

      {/* Catégorie */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Catégorie</label>
        <select value={values.category} onChange={set('category')} className={inputClass}>
          <option value="">Choisir...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Extrait */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Extrait (chapeau)</label>
        <textarea value={values.excerpt} onChange={set('excerpt')} rows={2}
          placeholder="Résumé visible dans les cards et sous le titre..." className={inputClass} />
      </div>

      {/* Meta title */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Meta title</label>
        <input value={values.meta_title} onChange={set('meta_title')}
          placeholder={title || 'Titre SEO'} className={inputClass} />
        <p className="text-xs text-muted-foreground">{values.meta_title.length}/60 caractères</p>
      </div>

      {/* Meta description */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Meta description</label>
        <textarea value={values.meta_description} onChange={set('meta_description')} rows={3}
          placeholder="Description pour les moteurs de recherche..." className={inputClass} />
        <p className="text-xs text-muted-foreground">{values.meta_description.length}/160 caractères</p>
      </div>

      {/* Auteur */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Auteur</label>
        <input value={values.author_name} onChange={set('author_name')}
          placeholder="Équipe Doussel" className={inputClass} />
      </div>
    </div>
  );
}
