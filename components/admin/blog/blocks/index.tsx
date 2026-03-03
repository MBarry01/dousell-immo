'use client';
import type { ArticleBlock } from '@/types/article';
import { HeadingBlock } from './HeadingBlock';
import { ParagraphBlock } from './ParagraphBlock';
import { QuoteBlock } from './QuoteBlock';
import { ImageBlock } from './ImageBlock';
import { GalleryBlock } from './GalleryBlock';
import { CalloutBlock } from './CalloutBlock';
import { CtaBlock } from './CtaBlock';
import { TableBlock } from './TableBlock';
import { ListBlock } from './ListBlock';
import { VideoBlock } from './VideoBlock';

interface Props {
  block: ArticleBlock;
  onChange: (b: ArticleBlock) => void;
}

export function BlockEditor({ block, onChange }: Props) {
  switch (block.type) {
    case 'heading':   return <HeadingBlock block={block} onChange={onChange} />;
    case 'paragraph': return <ParagraphBlock block={block} onChange={onChange} />;
    case 'quote':     return <QuoteBlock block={block} onChange={onChange} />;
    case 'image':     return <ImageBlock block={block} onChange={onChange} />;
    case 'gallery':   return <GalleryBlock block={block} onChange={onChange} />;
    case 'callout':   return <CalloutBlock block={block} onChange={onChange} />;
    case 'cta':       return <CtaBlock block={block} onChange={onChange} />;
    case 'table':     return <TableBlock block={block} onChange={onChange} />;
    case 'list':      return <ListBlock block={block} onChange={onChange} />;
    case 'video':     return <VideoBlock block={block} onChange={onChange} />;
  }
}
