'use client';
import type { CtaBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function CtaBlock({ block, onChange }: Props) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4 space-y-3">
      <input
        value={block.text}
        onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte du bouton"
        className="w-full bg-transparent border-none outline-none font-semibold text-foreground"
      />
      <input
        value={block.href}
        onChange={e => onChange({ ...block, href: e.target.value })}
        placeholder="URL (ex: /contact, https://...)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
      <div className="flex gap-2">
        {(['primary', 'secondary'] as const).map(s => (
          <button key={s} onClick={() => onChange({ ...block, style: s })}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${block.style === s ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
            {s === 'primary' ? 'Doré (principal)' : 'Secondaire'}
          </button>
        ))}
      </div>
    </div>
  );
}
