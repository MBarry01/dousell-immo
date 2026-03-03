'use client';
import type { CalloutBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function CalloutBlock({ block, onChange }: Props) {
  const updateItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i: number) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-xl border border-[#F4C430]/30 bg-[#F4C430]/5 p-4 space-y-3">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        placeholder="Titre de l'encadré (ex: À retenir)"
        className="w-full bg-transparent border-none outline-none font-semibold text-foreground"
      />
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={e => updateItem(i, e.target.value)}
              placeholder={`Point ${i + 1}`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
            />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-xs">✕</button>
          </div>
        ))}
        <button onClick={addItem} className="text-xs text-[#F4C430] hover:underline">+ Ajouter un point</button>
      </div>
    </div>
  );
}
