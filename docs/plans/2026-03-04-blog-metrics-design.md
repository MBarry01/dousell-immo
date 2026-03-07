# Design — Métriques éditoriales professionnelles (Blog Dousell)

**Date** : 2026-03-04
**Statut** : Approuvé

---

## Objectif

Ajouter des métriques éditoriales professionnelles au dashboard admin du blog Dousell pour mesurer audience, engagement, et performance business de chaque article.

---

## Approche retenue : PostHog (comportemental) + Supabase (leads business)

- **PostHog** : vues, visiteurs uniques, scroll depth, temps de lecture, CTR CTA
- **Supabase** : leads générés (inscriptions, contacts, biens consultés) via `article_id FK` sur les tables existantes
- **Pas de cache intermédiaire en v1** — admin lit les deux sources à chaque rendu (Server Components)

---

## Architecture

```
Blog Article Page (ISR + ArticleTracker client component)
  ├── PostHog.capture('article_viewed',       { article_id, slug, category })
  ├── PostHog.capture('article_scroll',       { article_id, depth: 25|50|75|100 })
  ├── PostHog.capture('article_read_complete',{ article_id, time_seconds })
  └── PostHog.capture('cta_clicked',          { article_id, cta_label, cta_href })

sessionStorage('last_article_id') → formulaires signup/contact → Server Actions → Supabase

Admin (Server Components)
  ├── /admin/blog              → liste + mini-stats (vues, score éditorial, score business)
  └── /admin/blog/[id]/analytics → dashboard complet
```

---

## Tracking comportemental (PostHog)

### Events

| Event | Propriétés | Déclencheur |
|---|---|---|
| `article_viewed` | article_id, slug, category, read_time_minutes | mount du composant |
| `article_scroll` | article_id, depth (25/50/75/100) | IntersectionObserver, fire-once |
| `article_read_complete` | article_id, time_seconds | scroll > 70% |
| `cta_clicked` | article_id, cta_label, cta_href | clic sur CtaBlock |

### Composant

`components/blog/ArticleTracker.tsx` — client component `'use client'`, ajouté dans :
- `app/(vitrine)/blog/[slug]/page.tsx`
- `app/pro/blog/[slug]/page.tsx`

### Métriques dérivées (PostHog Query API)

| Métrique | Calcul |
|---|---|
| Vues totales | `count(article_viewed)` filtrés par `article_id` |
| Visiteurs uniques | `count(distinct session_id)` |
| Scroll depth moyen | `avg(depth)` sur `article_scroll` |
| Taux de complétion | `count(article_read_complete) / vues` |
| CTR CTA | `count(cta_clicked) / vues` |

---

## Leads business (Supabase)

### Migrations

```sql
ALTER TABLE leads         ADD COLUMN article_id UUID REFERENCES articles(id) ON DELETE SET NULL;
ALTER TABLE contacts      ADD COLUMN article_id UUID REFERENCES articles(id) ON DELETE SET NULL;
ALTER TABLE property_views ADD COLUMN article_id UUID REFERENCES articles(id) ON DELETE SET NULL;
```

> Adapter selon les tables réellement présentes en DB (leads, contacts, property_views).

### Passage de l'article_id

`ArticleTracker` → `sessionStorage.setItem('last_article_id', articleId)`
Formulaires signup/contact → lisent `sessionStorage` → envoient `article_id` dans le payload
Server Actions → insèrent avec `article_id` en DB

RGPD-safe : pas de cookie, pas de tracking cross-session.

---

## Score éditorial double

Calculé dans `lib/blog/editorial-score.ts`.

### Score éditorial (qualité média)
```
40% Engagement  (scroll depth moyen + taux de complétion)
35% Audience    (vues normalisées + ratio visiteurs uniques/vues)
15% SEO         (meta_title, meta_description, cover_image, excerpt, read_time)
10% Conversion
```

### Score business (valeur SaaS)
```
50% Conversion  (leads normalisés + CTR CTA)
25% Engagement
15% Audience
10% SEO
```

### Badges visuels
| Score | Badge |
|---|---|
| ≥ 70 | vert |
| ≥ 45 | orange |
| < 45 | rouge |

SEO (15/10 pts) : proxy technique en v1 (meta remplis, image, excerpt). Connexion Google Search Console possible en v2.

---

## UI Admin

### Liste `/admin/blog`

Colonnes ajoutées : Vues · Score éditorial · Score business
Scores colorés selon les seuils. Vues en format compact (1.2K). `—` pour les brouillons.
Clic ligne → `/admin/blog/[id]/analytics`

### Page détail `/admin/blog/[id]/analytics`

4 KPI cards : Vues · Visiteurs uniques · Temps de lecture moyen · Scroll depth moyen
2 barres de score : éditorial + business
Section leads : CTA cliqués (CTR%), Inscriptions, Demandes contact, Biens consultés
Taux de complétion (% lecteurs > 70% de l'article)

---

## Variables d'environnement requises

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com   # ou app.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_...                  # pour Query API côté serveur
```

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `components/blog/ArticleTracker.tsx` | Créer |
| `lib/posthog.ts` | Créer (client + server helpers) |
| `lib/blog/editorial-score.ts` | Créer |
| `lib/actions/blog/metrics.ts` | Créer (fetch PostHog + Supabase leads) |
| `app/(vitrine)/blog/[slug]/page.tsx` | Modifier (ajouter ArticleTracker) |
| `app/pro/blog/[slug]/page.tsx` | Modifier (ajouter ArticleTracker) |
| `app/(workspace)/admin/blog/page.tsx` | Modifier (colonnes métriques) |
| `app/(workspace)/admin/blog/[id]/analytics/page.tsx` | Créer |
| `supabase/migrations/…_add_article_id_to_leads.sql` | Créer |

---

## Hors périmètre v1

- Google Search Console (position, mots-clés, trafic organique)
- Backlinks
- Heatmap scroll
- Cohortes lecteurs
- Cache Supabase des métriques PostHog (nightly sync)
