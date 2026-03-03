'use client';
import type { VideoBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function VideoBlock({ block, onChange }: Props) {
  return (
    <div className="space-y-2">
      <input
        value={block.youtubeId}
        onChange={e => onChange({ ...block, youtubeId: e.target.value })}
        placeholder="ID YouTube (ex: dQw4w9WgXcQ) ou URL complète"
        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#F4C430]/50"
      />
      {block.youtubeId && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${block.youtubeId}`}
            className="w-full h-full"
            allowFullScreen
          />
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
