'use client';
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ArticleBlock, BlockType } from '@/types/article';
import { BlockEditor } from './blocks';

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: '# Titre',
  paragraph: '¶ Paragraphe',
  quote: '❝ Citation',
  image: '🖼 Image',
  gallery: '🗂 Galerie',
  callout: '📌 À retenir',
  cta: '🔗 CTA',
  table: '⊞ Tableau',
  list: '☰ Liste',
  video: '▶ Vidéo',
};

function uid() { return Math.random().toString(36).slice(2, 9); }

function createBlock(type: BlockType): ArticleBlock {
  const id = uid();
  switch (type) {
    case 'heading':   return { id, type, level: 2, text: '' };
    case 'paragraph': return { id, type, text: '' };
    case 'quote':     return { id, type, text: '', author: '' };
    case 'image':     return { id, type, cloudinaryId: '', caption: '' };
    case 'gallery':   return { id, type, images: [] };
    case 'callout':   return { id, type, title: 'À retenir', items: [''] };
    case 'cta':       return { id, type, text: 'En savoir plus', href: '#', style: 'primary' };
    case 'table':     return { id, type, headers: ['Colonne 1', 'Colonne 2'], rows: [['', '']] };
    case 'list':      return { id, type, ordered: false, items: [''] };
    case 'video':     return { id, type, youtubeId: '', caption: '' };
  }
}

interface SortableBlockProps {
  block: ArticleBlock;
  onChange: (b: ArticleBlock) => void;
  onRemove: () => void;
}

function SortableBlock({ block, onChange, onRemove }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-xl border border-border bg-card p-4 hover:border-[#F4C430]/30 transition-colors"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 cursor-grab opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity text-muted-foreground select-none text-lg"
      >
        ⠿
      </div>
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 text-xs px-1"
      >
        ✕
      </button>
      <div className="ml-6">
        <BlockEditor block={block} onChange={onChange} />
      </div>
    </div>
  );
}

interface Props {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[]) => void;
}

export function BlockCanvas({ blocks, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  function updateBlock(id: string, updated: ArticleBlock) {
    onChange(blocks.map(b => b.id === id ? updated : b));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter(b => b.id !== id));
  }

  function addBlock(type: BlockType) {
    onChange([...blocks, createBlock(type)]);
    setMenuOpen(false);
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map(block => (
            <SortableBlock
              key={block.id}
              block={block}
              onChange={updated => updateBlock(block.id, updated)}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add block menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[#F4C430]/50 hover:text-[#F4C430] transition-colors"
        >
          + Ajouter un bloc
        </button>
        {menuOpen && (
          <div className="absolute top-full left-0 mt-2 z-20 grid grid-cols-2 gap-1 w-64 bg-card border border-border rounded-xl p-2 shadow-xl">
            {(Object.entries(BLOCK_LABELS) as [BlockType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="text-left px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted hover:text-[#F4C430] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
