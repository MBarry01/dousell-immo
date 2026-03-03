// types/article.ts

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'quote'
  | 'image'
  | 'gallery'
  | 'callout'
  | 'cta'
  | 'table'
  | 'list'
  | 'video';

export type ArticleStatus = 'draft' | 'published';
export type ArticleTemplate = 'standard' | 'grand-reportage' | 'guide-pratique';
export type ArticleCategory =
  | 'Guides'
  | 'Investissement'
  | 'Juridique'
  | 'Conseils'
  | 'Marché'
  | 'Innovation';

// --- Bloc types ---

export interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface QuoteBlock {
  id: string;
  type: 'quote';
  text: string;
  author?: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  cloudinaryId: string;
  caption?: string;
  alt?: string;
}

export interface GalleryImage {
  cloudinaryId: string;
  alt?: string;
  caption?: string;
}

export interface GalleryBlock {
  id: string;
  type: 'gallery';
  images: GalleryImage[];
}

export interface CalloutBlock {
  id: string;
  type: 'callout';
  title: string;
  items: string[];
  icon?: string;
}

export interface CtaBlock {
  id: string;
  type: 'cta';
  text: string;
  href: string;
  style?: 'primary' | 'secondary';
}

export interface TableBlock {
  id: string;
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ListBlock {
  id: string;
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface VideoBlock {
  id: string;
  type: 'video';
  youtubeId: string;
  caption?: string;
}

export type ArticleBlock =
  | HeadingBlock
  | ParagraphBlock
  | QuoteBlock
  | ImageBlock
  | GalleryBlock
  | CalloutBlock
  | CtaBlock
  | TableBlock
  | ListBlock
  | VideoBlock;

// --- Article ---

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  blocks: ArticleBlock[];
  content_markdown: string | null;
  template: ArticleTemplate;
  status: ArticleStatus;
  author_name: string;
  author_avatar: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category: ArticleCategory | null;
  published_at: string | null;
  read_time_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateArticleInput = Pick<
  Article,
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'cover_image'
  | 'blocks'
  | 'content_markdown'
  | 'template'
  | 'status'
  | 'author_name'
  | 'author_avatar'
  | 'meta_title'
  | 'meta_description'
  | 'category'
>;

export type UpdateArticleInput = Partial<CreateArticleInput>;
