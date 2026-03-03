'use client';
import type { HeadingBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function HeadingBlock({ block, onChange }: Props) {
  const sizes = { 1: 'text-3xl font-bold', 2: 'text-2xl font-semibold', 3: 'text-xl font-semibold' };
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {([1, 2, 3] as const).map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${block.level === l ? 'bg-[#F4C430] text-black' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            H{l}
          </button>
        ))}
      </div>
      <input
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder={`Titre H${block.level}`}
        className={`w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground ${sizes[block.level]}`}
      />
    </div>
  );
}
