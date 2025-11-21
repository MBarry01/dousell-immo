# Dousell Immo · Architecture & UX Notes

## Stack & Conventions
- **Framework**: Next.js 16 (App Router) en TypeScript.
- **Design System**: Tailwind CSS v4 + shadcn/ui (bouton, input) + utilitaire `cn`.
- **Animations & Interactions**: Framer Motion (hero, sections, fiche) + Embla Carousel + react-medium-image-zoom.
- **Icônes & Feedback**: Lucide React pour l’iconographie, Sonner pour les toasts globaux.
- **Safe Areas**: utilitaires `pt-safe` / `pb-safe` dans `app/globals.css` pour respecter iOS/Android.
- **Carte & Favoris**: Mapbox Static API (via `MapView`) et Zustand + persist pour la wishlist.

## App Shell & Navigation
- `AppShell` enveloppe toutes les pages (`app/layout.tsx`), injecte Header + BottomNav mobile pour les routes classiques et bascule automatiquement en mode “full screen” sur `/biens/[id]` (header/bottom-nav masqués).
- `Header` (desktop) + `BottomNav` (mobile) reprennent les conventions natif iOS/Material (boutons arrondis, glasspanel, safe-area).
- Toaster Sonner monté globalement pour les notifications (favoris, partages, copies lien).

## Données & Modèles
- `types/property.ts` définit le modèle complet d’un bien : localisation, specs, détails techniques, agent, proximités, galerie d’images.
- `data/properties.ts` expose :
  - `properties`: 5+ biens mockés (Unsplash) avec coordonnées, DPE, charges, etc.
  - `featuredProperties`: sélection utilisée sur la home.
  - `getPropertyById` / `getSimilarProperties`: utilitaires pour les routes dynamiques et carrousels.
- Helpers `formatCurrency` + `dpeColorMap` centralisés dans `lib/utils.ts`.

## Pages & Composants
### Accueil (`app/page.tsx`)
- Compose `HeroSection`, `QuickSearch`, `NewProperties`.
- Carrousel “Nouveautés” utilise `PropertyCard` (Airbnb style, `layoutId` prêt pour animations) et renvoie vers les fiches dynamiques.

### Agence (`app/agence/page.tsx`)
- Page narrative avec hero premium, chiffres clés animés (Framer Motion), portraits équipe (CTA WhatsApp direct) et valeurs (Transparence / Réactivité / Expertise).

### Contact (`app/contact/page.tsx`)
- Split layout infos siège + `MapView` (mode statique sans carousel) centré Sacré-Cœur. FAQ 3 entrées via accordion Radix.

### Recherche & Exploration (`app/recherche/page.tsx`)
- Barre sticky mobile-first avec champ “Ville ou code postal” et ouverture d’un `FilterDrawer` (Sheet shadcn) pour budget, type, rooms/bedrooms.
- `SearchExperience` synchronise tous les filtres avec l’URL via `useSearchFilters` + `URLSearchParams`. Le bouton flottant permet de basculer entre **Vue Liste** (grille `PropertyCard`) et **Vue Carte**.
- Vue carte : `MapView` (Mapbox Static API) affiche une carte sombre avec marqueurs colorés + deck de cards horizontales (`PropertyCard` variant `horizontal`). Sur mobile/data saver, la carte ne se charge qu’après un clic “Charger la carte”.
- Drawer mobile : slider double (prix), toggle group type, compteurs Pièces/Chambres + toggles “Groupe électrogène / Réservoir” avec prévisualisation instantanée (`searchProperties`).
- Page `/favoris`: client component connectée au store, montre les biens sauvegardés ou un message “wishlist vide” avec CTA.

### Fiche Bien (`app/biens/[id]`)
- **SEO**: `generateMetadata`, `generateStaticParams`, JSON-LD `RealEstateListing`.
- **Loading / 404**: skeleton minimaliste (`loading.tsx`) & fallback “Bien introuvable” (`not-found.tsx`).
- **`PropertyDetailView`** (client):
  - Galerie Embla 50vh (`PropertyGallery`) + zoom pinch.
  - Overlay contextuel (retour, favoris Zustand + toast, partage Web Share API / clipboard).
  - Sheet contenu via `PropertyInfo`: header, prix/specs, CostSimulator (location vs vente), description expandable, détails techniques, proximités (`ProximitiesSection`), carte statique (`StaticMap`), fiche agent (`AgentCard`), carrousel similaires (`SimilarProperties`).
  - Barre de conversion (`ContactBar`) sticky avec WhatsApp first, Appeler + safe-area.
  - `ContactBar` + boutons simulent un haptic feedback (`navigator.vibrate`) lorsque disponible.

## Assets & Config
- `public/manifest.json` + icône SVG pour PWA (theme/background #05080c).
- `next.config.ts` autorise Unsplash + Google Static Maps.
- `app/globals.css` gère variables de thème, gradients de fond, utilities safe area & glassmorphism.

## Prochaines étapes suggérées
- Connecter les données à une API (Headless CMS / GraphQL) au lieu des mocks.
- Générer les variantes PNG d’icônes PWA et injecter une clé `NEXT_PUBLIC_GOOGLE_MAPS_KEY` pour la carte statique.
- Étendre les routes `/recherche`, `/favoris`, `/compte` en réutilisant les mêmes composants.
- Côté recherche/favoris : brancher de vraies APIs (Autocomplete, backend filters) et synchroniser la wishlist avec un backend / compte utilisateur.

## Incidents rencontrés & résolutions
- **Module non résolu `react-map-gl` (Turbopack)** : l’import Mapbox cassait le build malgré la présence du package (erreur “Module not found: Can't resolve 'react-map-gl'”). La solution retenue : abandonner le runtime map interactif au profit de l’API statique Mapbox (compat Next/Image) avec chargement conditionnel (data-saver).
- **Format monétaire & data locale** : adaptation du formatage FCFA (éviter les espaces insécables émis par Intl) et ajout des repères (`landmark`) + équipements critiques (groupe électrogène, réservoir, gardiennage) dans les types et UI. Correction appliquée en central (`lib/utils.ts`, `types/property.ts`, `data/properties.ts`, `PropertyInfo`, `PropertyCard`, `FilterDrawer`).
- **Contact préférentiel WhatsApp** : demande de passer le bouton principal sur WhatsApp (avec message prérempli) et de conserver le call. Mise à jour effectuée dans `ContactBar` (gestion du lien `wa.me`, fallback au bouton d’appel).
- **Optimisation data mobile** : qualité `next/image` réglée à 75 sur les visuels critiques (cards, hero, map statique) + map qui ne se charge qu’après consentement en mode économie de données.

