'use client';
import type { QuoteBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function QuoteBlock({ block, onChange }: Props) {
  return (
    <div className="border-l-4 border-[#F4C430] pl-4 space-y-2">
      <textarea
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte de la citation..."
        rows={3}
        className="w-full bg-transparent border-none outline-none text-foreground italic text-lg leading-relaxed resize-none"
      />
      <input
        value={block.author ?? ''}
        onChange={e => onChange({ ...block, author: e.target.value })}
        placeholder="— Source (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
    </div>
  );
}
