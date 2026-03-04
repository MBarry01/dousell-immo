'use client';
import { useRef } from 'react';
import Image from 'next/image';
import type { GalleryBlock as T, GalleryImage } from '@/types/article';
import { useCloudinaryUpload } from '../useCloudinaryUpload';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

interface Props { block: T; onChange: (b: T) => void; }

function GalleryImageItem({
  img, onUpdate, onRemove,
}: { img: GalleryImage; onUpdate: (img: Partial<GalleryImage>) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useCloudinaryUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result) onUpdate({ cloudinaryId: result.publicId });
  }

  const imageUrl = img.cloudinaryId
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_400,q_auto,f_auto/${img.cloudinaryId}`
    : null;

  return (
    <div className="relative bg-muted rounded-lg overflow-hidden border border-border group">
      <div className="aspect-square relative cursor-pointer" onClick={() => !img.cloudinaryId && inputRef.current?.click()}>
        {img.cloudinaryId ? (
          <Image src={imageUrl!} alt={img.alt ?? ''} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-2xl">+</span>
            <span className="text-xs">{uploading ? 'Upload...' : 'Image'}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-muted/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {img.cloudinaryId && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-1">
            <button onClick={() => inputRef.current?.click()} className="px-2 py-1 bg-white/90 text-black text-xs rounded font-medium">Changer</button>
          </div>
        )}
      </div>
      <div className="p-2">
        <input value={img.caption ?? ''} onChange={e => onUpdate({ caption: e.target.value })}
          placeholder="Légende" className="w-full bg-transparent text-xs text-muted-foreground outline-none border-none" />
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1.5 border-t border-red-500/20 leading-tight">
          {error}
        </p>
      )}
      <button onClick={onRemove} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">✕</button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export function GalleryBlock({ block, onChange }: Props) {
  const addImage = () => onChange({ ...block, images: [...block.images, { cloudinaryId: '', alt: '' }] });
  const updateImage = (i: number, img: Partial<GalleryImage>) => onChange({ ...block, images: block.images.map((im, idx) => idx === i ? { ...im, ...img } : im) });
  const removeImage = (i: number) => onChange({ ...block, images: block.images.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${block.images.length >= 3 ? 'grid-cols-3' : block.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {block.images.map((img, i) => (
          <GalleryImageItem key={i} img={img} onUpdate={upd => updateImage(i, upd)} onRemove={() => removeImage(i)} />
        ))}
        <button onClick={addImage} className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-[#F4C430]/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#F4C430] transition-colors">
          <span className="text-xl">+</span>
          <span className="text-xs">Ajouter</span>
        </button>
      </div>
    </div>
  );
}
