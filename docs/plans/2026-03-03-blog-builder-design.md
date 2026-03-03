# Blog Builder — Design Document
**Date :** 3 mars 2026
**Statut :** Approuvé
**Stack :** Next.js 16 App Router · Supabase · Tailwind CSS · dnd-kit

---

## 1. Objectif

Transformer le blog Doussel (actuellement hardcodé) en un CMS léger intégré, avec :
- Un éditeur de blocs visuel dans `/admin/blog` (admin uniquement)
- Des templates éditoriaux "Le Monde"
- Des pages publiques ISR sur `/pro/blog/[slug]` et `/blog/[slug]`
- Une compatibilité native avec les outils d'automatisation (n8n, Make)

---

## 2. Décisions architecturales

| Décision | Choix retenu | Raison |
|----------|-------------|--------|
| Emplacement éditeur | `/admin/blog` | Admin interne uniquement, plus simple à sécuriser |
| Stockage | Supabase DB + JSONB blocks | Recherche dynamique, Realtime, PostgREST pour automations |
| Éditeur | Builder custom léger (dnd-kit) | 100% contrôle du design Doussel, zéro dépendance lourde |
| Permissions | Admin uniquement (`requireAdmin()`) | Seul l'admin Doussel publie des articles |
| Compatibilité automation | `content_markdown` + API REST Supabase | n8n/Make envoient du markdown, conversion en blocs au save |
| Rendu public | ISR (`revalidate = 3600`) | SEO optimal, pas de rebuild complet |

---

## 3. Schéma de données

### Table `articles`

```sql
CREATE TABLE articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text UNIQUE NOT NULL,
  excerpt             text,
  cover_image         text,                        -- Cloudinary public_id
  blocks              jsonb NOT NULL DEFAULT '[]', -- [{id, type, ...data}]
  content_markdown    text,                        -- source pour automations n8n/Make
  template            text DEFAULT 'standard',     -- standard | grand-reportage | guide-pratique
  status              text DEFAULT 'draft',        -- draft | published
  author_name         text DEFAULT 'Équipe Doussel',
  author_avatar       text,                        -- Cloudinary public_id
  meta_title          text,
  meta_description    text,
  category            text,                        -- Guides | Investissement | Juridique | Conseils | Marché | Innovation
  published_at        timestamptz,
  read_time_minutes   int,                         -- calculé automatiquement côté serveur
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Index pour recherche et filtrage
CREATE INDEX articles_slug_idx ON articles (slug);
CREATE INDEX articles_status_idx ON articles (status);
CREATE INDEX articles_category_idx ON articles (category);
CREATE INDEX articles_published_at_idx ON articles (published_at DESC);
```

### Format d'un bloc JSON

```json
[
  { "id": "b1", "type": "heading",   "level": 1, "text": "Titre H1" },
  { "id": "b2", "type": "paragraph", "text": "Contenu du paragraphe..." },
  { "id": "b3", "type": "quote",     "text": "Citation", "author": "Source" },
  { "id": "b4", "type": "callout",   "title": "À retenir", "items": ["Point 1", "Point 2"] },
  { "id": "b5", "type": "image",     "cloudinaryId": "blog/photo-xyz", "caption": "Légende" },
  { "id": "b6", "type": "gallery",   "images": [{ "cloudinaryId": "...", "alt": "..." }] },
  { "id": "b7", "type": "cta",       "text": "Télécharger le guide", "href": "/guide.pdf", "style": "primary" },
  { "id": "b8", "type": "table",     "headers": ["Col1", "Col2"], "rows": [["A", "B"]] },
  { "id": "b9", "type": "list",      "ordered": false, "items": ["Item 1", "Item 2"] },
  { "id": "b10","type": "video",     "youtubeId": "dQw4w9WgXcQ", "caption": "Légende vidéo" }
]
```

### Compatibilité automation (n8n / Make)

Les automations peuvent appeler directement l'API REST Supabase :

```http
POST https://[project].supabase.co/rest/v1/articles
Authorization: Bearer [SERVICE_ROLE_KEY]
Content-Type: application/json

{
  "title": "Article généré par n8n",
  "slug": "article-n8n-auto",
  "content_markdown": "## Titre\n\nContenu en markdown...\n\n> Citation",
  "category": "Guides",
  "status": "draft"
}
```

Le champ `content_markdown` est converti en `blocks` automatiquement lors de la publication.

---

## 4. Architecture Admin `/admin/blog`

### Routes

```
app/admin/blog/
├── page.tsx                  ← Liste articles (draft + publiés)
├── new/page.tsx              ← Éditeur — création
└── [id]/edit/page.tsx        ← Éditeur — modification
```

### Composants

```
components/admin/blog/
├── ArticleList.tsx           ← Tableau: titre, statut, date, actions
├── ArticleEditor.tsx         ← Shell éditeur layout 2 colonnes
├── BlockCanvas.tsx           ← Zone drag-and-drop (dnd-kit)
├── BlockToolbar.tsx          ← Sidebar ajout de blocs
├── blocks/
│   ├── HeadingBlock.tsx
│   ├── ParagraphBlock.tsx
│   ├── QuoteBlock.tsx
│   ├── ImageBlock.tsx
│   ├── GalleryBlock.tsx
│   ├── CalloutBlock.tsx
│   ├── CtaBlock.tsx
│   ├── TableBlock.tsx
│   ├── ListBlock.tsx
│   └── VideoBlock.tsx
├── ArticlePreview.tsx        ← Preview temps réel
├── SeoPanel.tsx              ← meta title, description, slug, catégorie
├── TemplateSelector.tsx      ← Choix template au démarrage
└── PublishButton.tsx         ← Draft → Publié + validation
```

### Layout éditeur

```
┌─────────────────────────────────────────────────────────┐
│ [← Retour]  "Titre de l'article..."         [Publier ▼] │
├──────────────────────────────────┬──────────────────────┤
│  BLOCS (drag-and-drop)           │  PREVIEW LIVE        │
│  ┌──────────────────────────┐    │                      │
│  │ ≡ Heading H1             │    │  # Titre...          │
│  ├──────────────────────────┤    │                      │
│  │ ≡ Paragraphe             │    │  Contenu...          │
│  ├──────────────────────────┤    │                      │
│  │ ≡ Citation               │    │  > Citation          │
│  └──────────────────────────┘    │                      │
│                                  │                      │
│  [+ Ajouter un bloc ▼]           │                      │
│                                  │                      │
│  [SEO]  [Auteur]  [Paramètres]   │                      │
└──────────────────────────────────┴──────────────────────┘
```

### Server Actions

```
lib/actions/blog/
├── createArticle.ts          ← createArticle(data) → article
├── updateArticle.ts          ← updateArticle(id, data) → article
├── publishArticle.ts         ← publishArticle(id) → convert markdown + set status
├── deleteArticle.ts          ← deleteArticle(id)
└── generateSlug.ts           ← generateSlug(title) → slug unique
```

### Sécurité

```typescript
// Toutes les pages et Server Actions admin commencent par :
await requireAdmin();
```

---

## 5. Templates éditoriaux

### Template 1 — "Standard Éditorial"
*Articles classiques, analyses, actualités*

Blocs préremplis :
1. `heading(H1)` — Titre
2. `paragraph` — Chapeau d'introduction
3. `image` — Image cover
4. `paragraph` — Corps
5. `heading(H2)` — Sous-titre
6. `paragraph` — Corps
7. `quote` — Citation mise en exergue
8. `paragraph` — Conclusion

### Template 2 — "Grand Reportage"
*Guides approfondis, dossiers thématiques (ex: diaspora guide)*

Blocs préremplis :
1. `image(hero)` — Image pleine largeur avec overlay
2. `paragraph` — Accroche
3. `callout` — À retenir (points clés)
4. `heading(H2)` — Chapitre 1
5. `paragraph` — Contenu
6. `gallery` — Galerie images
7. `heading(H2)` — Chapitre 2
8. `paragraph` — Contenu
9. `quote` — Pull quote
10. `cta` — Appel à l'action final

### Template 3 — "Guide Pratique"
*Tutoriels pas-à-pas, checklists, modes d'emploi*

Blocs préremplis :
1. `heading(H1)` — Titre "Comment faire X"
2. `callout` — Ce que vous allez apprendre
3. `heading(H2)` — Étape 1
4. `paragraph` — Contenu
5. `image` — Illustration optionnelle
6. `heading(H2)` — Étape 2
7. `paragraph` — Contenu
8. `heading(H2)` — Étape 3
9. `paragraph` — Contenu
10. `cta` — Pour aller plus loin

---

## 6. Pages publiques + SEO

### Routes

```
app/
├── (vitrine)/blog/
│   ├── page.tsx              ← Liste (remplacer hardcoded par Supabase)
│   └── [slug]/page.tsx       ← Article public (ISR)
└── pro/blog/
    ├── page.tsx              ← Liste pro
    └── [slug]/page.tsx       ← Article public pro (ISR)
```

### Composants de rendu public

```
components/blog/blocks/
├── HeadingRenderer.tsx
├── ParagraphRenderer.tsx
├── QuoteRenderer.tsx
├── ImageRenderer.tsx
├── GalleryRenderer.tsx
├── CalloutRenderer.tsx
├── CtaRenderer.tsx
├── TableRenderer.tsx
├── ListRenderer.tsx
└── VideoRenderer.tsx
```

### ISR + Métadonnées

```typescript
export const revalidate = 3600; // Régénération toutes les heures

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug);
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt,
    openGraph: {
      images: [{ url: cloudinaryUrl(article.cover_image) }]
    }
  };
}
```

### Schema.org JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Titre de l'article",
  "author": { "@type": "Person", "name": "Équipe Doussel" },
  "datePublished": "2026-03-03T00:00:00Z",
  "image": "https://res.cloudinary.com/dkkirzpxe/...",
  "timeRequired": "PT8M"
}
```

### Calcul du temps de lecture

```typescript
// Dans publishArticle Server Action
const wordCount = blocks
  .filter(b => ['paragraph', 'heading', 'quote'].includes(b.type))
  .map(b => b.text ?? '')
  .join(' ')
  .split(/\s+/).length;

const read_time_minutes = Math.ceil(wordCount / 200); // 200 mots/min
```

---

## 7. Compatibilité Automation (n8n / Make)

### Flux d'automatisation type

```
n8n/Make
  └─→ POST /rest/v1/articles (Supabase REST)
        ├── title: "Article auto"
        ├── slug: "article-auto-2026-03"
        ├── content_markdown: "## Intro\n\nContenu..."
        ├── category: "Guides"
        └── status: "draft"
              └─→ Admin review dans /admin/blog
                    └─→ Publier → conversion markdown → blocks + ISR
```

### Nodes n8n disponibles

- **Supabase node** : INSERT/UPDATE/SELECT natifs
- **HTTP Request node** : pour déclencher revalidation Next.js si besoin

---

## 8. Fichiers à créer / modifier

### Nouveaux fichiers
- `supabase/migrations/[timestamp]_create_articles.sql`
- `app/admin/blog/page.tsx`
- `app/admin/blog/new/page.tsx`
- `app/admin/blog/[id]/edit/page.tsx`
- `app/(vitrine)/blog/[slug]/page.tsx`
- `app/pro/blog/[slug]/page.tsx`
- `components/admin/blog/*` (14 composants)
- `components/blog/blocks/*` (10 renderers)
- `lib/actions/blog/*` (5 Server Actions)
- `lib/blog/templates.ts` (3 templates)
- `lib/blog/markdown-to-blocks.ts` (conversion pour automations)

### Fichiers à modifier
- `app/(vitrine)/blog/page.tsx` — remplacer hardcoded par Supabase query
- `app/pro/blog/page.tsx` — idem
- `app/admin/layout.tsx` ou routage admin existant — ajouter lien Blog

---

## 9. Séquence d'implémentation recommandée

1. **Migration Supabase** — table `articles` + indexes
2. **Server Actions CRUD** — create, update, publish, delete
3. **Admin liste** — `/admin/blog/page.tsx`
4. **Sélecteur de templates** — `TemplateSelector.tsx`
5. **Blocs éditeur** — 10 composants bloc-par-bloc
6. **Canvas drag-and-drop** — dnd-kit
7. **Preview live** — `ArticlePreview.tsx`
8. **Panel SEO** — `SeoPanel.tsx`
9. **Pages publiques** — `/[slug]/page.tsx` + ISR
10. **Renderers publics** — 10 composants
11. **Migration listes existantes** — remplacer hardcoded
12. **JSON-LD + SEO** — par article
