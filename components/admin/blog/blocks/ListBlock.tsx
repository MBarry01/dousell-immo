'use client';
import type { ListBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ListBlock({ block, onChange }: Props) {
  const updateItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onChange({ ...block, items });
  };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i: number) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button onClick={() => onChange({ ...block, ordered: false })}
          className={`text-xs px-2 py-1 rounded border transition-colors ${!block.ordered ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
          • Liste simple
        </button>
        <button onClick={() => onChange({ ...block, ordered: true })}
          className={`text-xs px-2 py-1 rounded border transition-colors ${block.ordered ? 'bg-[#F4C430] border-[#F4C430] text-black' : 'border-border text-muted-foreground'}`}>
          1. Liste numérotée
        </button>
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-muted-foreground text-sm w-5 shrink-0">{block.ordered ? `${i + 1}.` : '•'}</span>
          <input value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={`Élément ${i + 1}`}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground" />
          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-500 text-xs">✕</button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-[#F4C430] hover:underline">+ Ajouter un élément</button>
    </div>
  );
}
