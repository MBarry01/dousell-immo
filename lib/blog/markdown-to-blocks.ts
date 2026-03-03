// lib/blog/markdown-to-blocks.ts
import { marked, Tokens } from 'marked';
import type { ArticleBlock } from '@/types/article';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function markdownToBlocks(markdown: string): ArticleBlock[] {
  const tokens = marked.lexer(markdown);
  const blocks: ArticleBlock[] = [];

  for (const token of tokens) {
    if (token.type === 'heading') {
      const t = token as Tokens.Heading;
      blocks.push({
        id: uid(),
        type: 'heading',
        level: Math.min(t.depth, 3) as 1 | 2 | 3,
        text: t.text,
      });
    } else if (token.type === 'paragraph') {
      const t = token as Tokens.Paragraph;
      blocks.push({ id: uid(), type: 'paragraph', text: t.text });
    } else if (token.type === 'blockquote') {
      const t = token as Tokens.Blockquote;
      const raw = t.text.replace(/^>\s?/gm, '').trim();
      blocks.push({ id: uid(), type: 'quote', text: raw });
    } else if (token.type === 'list') {
      const t = token as Tokens.List;
      blocks.push({
        id: uid(),
        type: 'list',
        ordered: t.ordered,
        items: t.items.map(i => i.text),
      });
    }
  }

  return blocks;
}
