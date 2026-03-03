'use client';
import type { ImageBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function ImageBlock({ block, onChange }: Props) {
  return (
    <div className="space-y-2">
      <input
        value={block.cloudinaryId}
        onChange={e => onChange({ ...block, cloudinaryId: e.target.value })}
        placeholder="Cloudinary public_id (ex: blog/photo-xyz)"
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F4C430]/50"
      />
      {block.cloudinaryId && (
        <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center text-xs text-muted-foreground">
          Image: {block.cloudinaryId}
        </div>
      )}
      <input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
      />
    </div>
  );
}
