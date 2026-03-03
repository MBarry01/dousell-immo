'use client';
import type { ParagraphBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ParagraphBlock({ block, onChange }: Props) {
  return (
    <textarea
      value={block.text}
      onChange={e => onChange({ ...block, text: e.target.value })}
      placeholder="Commencez à écrire..."
      rows={4}
      className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base leading-relaxed resize-none"
    />
  );
}
