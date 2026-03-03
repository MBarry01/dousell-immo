'use client';
import type { GalleryBlock as T, GalleryImage } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function GalleryBlock({ block, onChange }: Props) {
  const updateImage = (i: number, img: Partial<GalleryImage>) => {
    const images = block.images.map((im, idx) => idx === i ? { ...im, ...img } : im);
    onChange({ ...block, images });
  };
  const addImage = () => onChange({ ...block, images: [...block.images, { cloudinaryId: '', alt: '' }] });
  const removeImage = (i: number) => onChange({ ...block, images: block.images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${block.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {block.images.map((img, i) => (
          <div key={i} className="relative bg-muted rounded-lg p-3 space-y-2 border border-border">
            <button onClick={() => removeImage(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 text-xs">✕</button>
            <input value={img.cloudinaryId} onChange={e => updateImage(i, { cloudinaryId: e.target.value })}
              placeholder="Cloudinary public_id"
              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:border-[#F4C430]/50" />
            <input value={img.caption ?? ''} onChange={e => updateImage(i, { caption: e.target.value })}
              placeholder="Légende"
              className="w-full bg-transparent text-xs text-muted-foreground outline-none border-none" />
          </div>
        ))}
      </div>
      <button onClick={addImage} className="text-xs text-[#F4C430] hover:underline">+ Ajouter une image</button>
    </div>
  );
}
