'use client';
import { useRef } from 'react';
import Image from 'next/image';
import type { ImageBlock as T } from '@/types/article';
import { useCloudinaryUpload } from '../useCloudinaryUpload';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

interface Props { block: T; onChange: (b: T) => void; }

export function ImageBlock({ block, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useCloudinaryUpload();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result) onChange({ ...block, cloudinaryId: result.publicId });
  }

  const imageUrl = block.cloudinaryId
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_800,q_auto,f_auto/${block.cloudinaryId}`
    : null;

  return (
    <div className="space-y-3">
      {!block.cloudinaryId ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-border hover:border-[#F4C430]/50 bg-muted aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
        >
          <span className="text-3xl">🖼</span>
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {uploading ? 'Upload en cours...' : 'Cliquer pour uploader une image'}
          </p>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-xl">
              <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden group aspect-video">
          <Image src={imageUrl!} alt={block.alt ?? ''} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 text-black text-xs rounded-lg font-medium hover:bg-white"
            >
              Changer
            </button>
            <button
              onClick={() => onChange({ ...block, cloudinaryId: '' })}
              className="px-3 py-1.5 bg-red-500/90 text-white text-xs rounded-lg font-medium hover:bg-red-500"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {block.cloudinaryId && (
        <p className="text-xs text-muted-foreground truncate">ID: {block.cloudinaryId}</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        value={block.caption ?? ''}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende de l'image (optionnel)"
        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground placeholder:text-muted-foreground/50"
      />
      <input
        value={block.alt ?? ''}
        onChange={e => onChange({ ...block, alt: e.target.value })}
        placeholder="Texte alternatif (accessibilité)"
        className="w-full bg-transparent border-none outline-none text-xs text-muted-foreground/70 placeholder:text-muted-foreground/40"
      />
    </div>
  );
}
