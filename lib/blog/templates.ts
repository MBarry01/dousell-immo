// lib/blog/templates.ts
import type { ArticleBlock, ArticleTemplate } from '@/types/article';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const ARTICLE_TEMPLATES: Record<
  ArticleTemplate,
  { label: string; description: string; blocks: ArticleBlock[] }
> = {
  standard: {
    label: 'Standard Éditorial',
    description: 'Article classique : titre, chapeau, image, paragraphes, citation.',
    blocks: [
      { id: uid(), type: 'heading', level: 1, text: 'Titre de votre article' },
      { id: uid(), type: 'paragraph', text: "Chapeau d'introduction — présentez l'essentiel en 2-3 lignes." },
      { id: uid(), type: 'image', cloudinaryId: '', caption: "Légende de l'image principale", alt: '' },
      { id: uid(), type: 'paragraph', text: 'Développez votre premier argument ici...' },
      { id: uid(), type: 'heading', level: 2, text: 'Sous-titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la deuxième partie...' },
      { id: uid(), type: 'quote', text: 'Citation marquante à mettre en valeur.', author: 'Source' },
      { id: uid(), type: 'paragraph', text: "Conclusion et appel à l'action..." },
    ],
  },
  'grand-reportage': {
    label: 'Grand Reportage',
    description: 'Guide approfondi, dossier thématique avec galerie et CTA.',
    blocks: [
      { id: uid(), type: 'image', cloudinaryId: '', caption: 'Image héro', alt: '' },
      { id: uid(), type: 'paragraph', text: "Paragraphe d'accroche — captez l'attention immédiatement." },
      { id: uid(), type: 'callout', title: 'À retenir', items: ['Point clé 1', 'Point clé 2', 'Point clé 3'] },
      { id: uid(), type: 'heading', level: 2, text: 'Chapitre 1' },
      { id: uid(), type: 'paragraph', text: 'Contenu du chapitre 1...' },
      { id: uid(), type: 'gallery', images: [] },
      { id: uid(), type: 'heading', level: 2, text: 'Chapitre 2' },
      { id: uid(), type: 'paragraph', text: 'Contenu du chapitre 2...' },
      { id: uid(), type: 'quote', text: 'Citation emblématique du reportage.', author: 'Source' },
      { id: uid(), type: 'cta', text: 'Télécharger le guide complet', href: '#', style: 'primary' },
    ],
  },
  'guide-pratique': {
    label: 'Guide Pratique',
    description: 'Tutoriel pas-à-pas avec étapes numérotées et checklist finale.',
    blocks: [
      { id: uid(), type: 'heading', level: 1, text: 'Comment faire X en Y étapes' },
      { id: uid(), type: 'callout', title: 'Ce que vous allez apprendre', items: ['Étape 1 : ...', 'Étape 2 : ...', 'Étape 3 : ...'] },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 1 — Premier titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu détaillé de la première étape...' },
      { id: uid(), type: 'image', cloudinaryId: '', caption: 'Illustration optionnelle', alt: '' },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 2 — Deuxième titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la deuxième étape...' },
      { id: uid(), type: 'heading', level: 2, text: 'Étape 3 — Troisième titre' },
      { id: uid(), type: 'paragraph', text: 'Contenu de la troisième étape...' },
      { id: uid(), type: 'cta', text: 'Prendre rendez-vous', href: '/contact', style: 'primary' },
    ],
  },
};
