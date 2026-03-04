// components/blog/ArticleRenderer.tsx
import Image from 'next/image';
import type { ArticleBlock } from '@/types/article';
import { CtaBlockRenderer } from './CtaBlockRenderer';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

function cldUrl(id: string, transform = ''): string {
  if (!id) return '';
  if (id.startsWith('http')) return id;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}${id}`;
}

/** Parses inline markdown links [label](url) and renders them as <a> elements */
function parseInlineText(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#F4C430] hover:text-[#E5B82A] underline underline-offset-2 decoration-[#F4C430]/50 transition-colors"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function HeadingRenderer({ block }: { block: Extract<ArticleBlock, { type: 'heading' }> }) {
  const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3';
  const cls = {
    1: 'text-4xl font-bold mt-10 mb-4',
    2: 'text-2xl font-semibold mt-8 mb-3 border-b border-border pb-2',
    3: 'text-xl font-semibold mt-6 mb-2',
  }[block.level];
  return <Tag className={`${cls} text-foreground font-display`}>{block.text}</Tag>;
}

function ParagraphRenderer({ block }: { block: Extract<ArticleBlock, { type: 'paragraph' }> }) {
  return <p className="text-foreground/90 leading-8 text-lg mb-6">{parseInlineText(block.text)}</p>;
}

function QuoteRenderer({ block }: { block: Extract<ArticleBlock, { type: 'quote' }> }) {
  return (
    <blockquote className="my-8 border-l-4 border-[#F4C430] pl-6">
      <p className="text-xl italic text-foreground leading-relaxed">&ldquo;{block.text}&rdquo;</p>
      {block.author && (
        <cite className="block mt-2 text-sm text-muted-foreground not-italic">— {block.author}</cite>
      )}
    </blockquote>
  );
}

function ImageRenderer({ block }: { block: Extract<ArticleBlock, { type: 'image' }> }) {
  if (!block.cloudinaryId) return null;
  return (
    <figure className="my-8">
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <Image src={cldUrl(block.cloudinaryId, 'w_800,q_auto,f_auto/')} alt={block.alt ?? ''} fill className="object-cover" />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-sm text-center text-muted-foreground">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function GalleryRenderer({ block }: { block: Extract<ArticleBlock, { type: 'gallery' }> }) {
  const images = block.images.filter(img => img.cloudinaryId);
  if (!images.length) return null;
  return (
    <div className={`my-8 grid gap-3 ${images.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {images.map((img, i) => (
        <figure key={i}>
          <div className="relative aspect-square rounded-xl overflow-hidden">
            <Image src={cldUrl(img.cloudinaryId, 'w_400,q_auto,f_auto/')} alt={img.alt ?? ''} fill className="object-cover" />
          </div>
          {img.caption && (
            <figcaption className="mt-1 text-xs text-center text-muted-foreground">{img.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function CalloutRenderer({ block }: { block: Extract<ArticleBlock, { type: 'callout' }> }) {
  return (
    <div className="my-8 rounded-2xl border border-[#F4C430]/30 bg-[#F4C430]/5 p-6">
      <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <span>📌</span> {block.title}
      </p>
      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-foreground/80">
            <span className="text-[#F4C430] mt-1 shrink-0">✓</span> {parseInlineText(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaRenderer({ block }: { block: Extract<ArticleBlock, { type: 'cta' }> }) {
  return (
    <div className="my-8 flex justify-center">
      <a
        href={block.href}
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

function TableRenderer({ block }: { block: Extract<ArticleBlock, { type: 'table' }> }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F4C430]/10">
            {block.headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {row.map((cell, c) => (
                <td key={c} className="px-4 py-3 text-foreground/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRenderer({ block }: { block: Extract<ArticleBlock, { type: 'list' }> }) {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className="my-6 space-y-2">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-foreground/90">
          {block.ordered ? (
            <span className="text-[#F4C430] font-semibold shrink-0 w-5">{i + 1}.</span>
          ) : (
            <span className="text-[#F4C430] mt-1.5 shrink-0">•</span>
          )}
          <span>{parseInlineText(item)}</span>
        </li>
      ))}
    </Tag>
  );
}

function VideoRenderer({ block }: { block: Extract<ArticleBlock, { type: 'video' }> }) {
  if (!block.youtubeId) return null;
  let id = block.youtubeId;
  if (id.includes('youtube.com')) {
    try { id = new URL(id).searchParams.get('v') ?? id; } catch { /* malformed URL */ }
  }
  return (
    <figure className="my-8">
      <div className="relative aspect-video rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          title={block.caption ?? 'Vidéo'}
        />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-sm text-center text-muted-foreground">{block.caption}</figcaption>
      )}
    </figure>
  );
}

interface Props {
  title: string;
  excerpt?: string;
  blocks: ArticleBlock[];
  authorName?: string;
  publishedAt?: string;
  category?: string;
  readTime?: number;
  coverImage?: string;
  articleId?: string;
}

export function ArticleRenderer({ title, excerpt, blocks, authorName, publishedAt, category, readTime, coverImage, articleId }: Props) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <article className="max-w-3xl mx-auto">

      {/* ── Header style Le Monde ── */}
      <header className="mb-0">

        {/* Catégorie */}
        {category && (
          <p className="text-xs font-bold uppercase tracking-widest text-[#F4C430] mb-5">
            {category}
          </p>
        )}

        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground leading-tight mb-5">
          {title}
        </h1>

        {/* Chapeau / excerpt */}
        {excerpt && (
          <p className="text-lg text-foreground/70 leading-relaxed mb-5 border-l-2 border-[#F4C430]/50 pl-4">
            {excerpt}
          </p>
        )}

        {/* Auteur + date + temps de lecture */}
        {(authorName || formattedDate || readTime) && (
          <div className="text-sm text-muted-foreground mb-5 space-y-1">
            {authorName && (
              <p>
                <span className="text-foreground/50">Par</span>{' '}
                <span className="font-medium text-foreground/80">{authorName}</span>
              </p>
            )}
            {(formattedDate || readTime) && (
              <p className="flex items-center gap-1.5 flex-wrap">
                {formattedDate && <span>Publié le {formattedDate}</span>}
                {formattedDate && readTime && <span aria-hidden>·</span>}
                {readTime && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Lecture {readTime} min.
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="h-px bg-border mb-8" />

        {/* Photo de couverture pleine largeur */}
        {coverImage && (
          <figure className="mb-10 -mx-4 md:mx-0">
            <div className="relative aspect-[16/9] md:rounded-xl overflow-hidden">
              <Image
                src={cldUrl(coverImage, 'w_1200,q_auto,f_auto/')}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </figure>
        )}
      </header>

      {/* ── Corps de l'article ── */}
      {blocks.map(block => {
        switch (block.type) {
          case 'heading':   return <HeadingRenderer   key={block.id} block={block} />;
          case 'paragraph': return <ParagraphRenderer key={block.id} block={block} />;
          case 'quote':     return <QuoteRenderer     key={block.id} block={block} />;
          case 'image':     return <ImageRenderer     key={block.id} block={block} />;
          case 'gallery':   return <GalleryRenderer   key={block.id} block={block} />;
          case 'callout':   return <CalloutRenderer   key={block.id} block={block} />;
          case 'cta':       return articleId
            ? <CtaBlockRenderer key={block.id} block={block} articleId={articleId} />
            : <CtaRenderer      key={block.id} block={block} />;
          case 'table':     return <TableRenderer     key={block.id} block={block} />;
          case 'list':      return <ListRenderer      key={block.id} block={block} />;
          case 'video':     return <VideoRenderer     key={block.id} block={block} />;
        }
      })}
    </article>
  );
}
