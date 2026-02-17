---
name: PWA Native Standards 2026
description: Directives pour transformer une WebApp en expérience "Native-like" sur iOS et Android.
---

# PWA Native Standards 2026

Cette skill définit les standards pour garantir une expérience utilisateur (UX) proche d'une application native sur les Progressive Web Apps (PWA), en particulier pour iOS (Safari) et Android (Chrome).

## 1. Viewport & Safe Areas

### Configuration du Viewport
Utiliser `viewport-fit=cover` pour utiliser toute la surface de l'écran, y compris les encoches (notch).

```tsx
// layout.tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Empêche le zoom manuel
  userScalable: false, // Désactive le zoom
  viewportFit: "cover",
  themeColor: "#05080c",
};
```

### Gestion des Safe Areas
Utiliser les variables d'environnement CSS pour respecter les zones sûres (en haut et en bas).

```css
/* globals.css */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
}

.pt-safe {
  padding-top: calc(var(--safe-area-top) + 1rem);
}

.pb-safe {
  padding-bottom: calc(var(--safe-area-bottom) + 1rem);
}

/* Header spécifique PWA */
.pwa-header-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
```

## 2. Touch Targets (Cibles Tactiles)

Tous les éléments interactifs doivent respecter une taille minimale pour être facilement cliquables.

*   **Taille minimale** : 44x44px (Standard Apple)
*   **Espacement** : Prévoir une marge suffisante entre les éléments interactifs.

### Boutons et Icônes
```tsx
// Button.tsx (variant icon)
icon: "h-11 w-11", // 44px
```

### Inputs
Les champs de saisie doivent avoir une hauteur suffisante.
```tsx
// Input.tsx
className="h-12 ... text-base" // 48px hauteur, 16px font-size
```

## 3. Inputs & Formulaires sur iOS

### Prévention du Zoom Automatique
Sur iOS, les inputs avec une taille de police inférieure à 16px provoquent un zoom automatique.
**Règle** : Toujours utiliser `text-base` (16px) ou plus pour les inputs, selects et textareas.

```css
/* globals.css */
input, textarea, select {
  font-size: 16px !important;
}
```

### Claviers Virtuels et Overscroll
Gérer le comportement du clavier qui réduit le viewport visible.
*   Utiliser `dvh` (Dynamic Viewport Height) pour les modales plein écran.
*   S'assurer que les éléments fixes (boutons de validation) restent visibles ou scrollables.

## 4. Scrolling & Touch Behaviors

### Native-like Scrolling
Activer le défilement fluide et le rebond (momentum scrolling) sur iOS.

```css
/* globals.css */
html, body {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overscroll-behavior-y: none; /* Empêche le "pull-to-refresh" natif si non désiré */
}
```

### Gallery & Carousels
Pour les carousels d'images, utiliser `touch-pan-y` pour permettre de scroller la page verticalement même en touchant le carousel.

```tsx
<div className="touch-pan-y ...">
  {/* Carousel content */}
</div>
```

### Suppression des délais de tap
Le délai de 300ms sur les clics mobiles est supprimé par défaut sur les navigateurs modernes si le viewport est correctement configuré.

## 5. Feedback Visuel

### États Actifs
Fournir un feedback immédiat lors de l'interaction (tap). Utiliser `:active` ou des animations (framer-motion).

```tsx
<motion.button
  whileTap={{ scale: 0.96 }}
>
  Valider
</motion.button>
```

### Sélection de Texte
Désactiver la sélection de texte sur les éléments d'interface (boutons, navigation) pour éviter les surlignages accidentels.

```css
.no-select {
  user-select: none;
  -webkit-user-select: none;
}
```

## Checklist de Vérification

- [ ] Viewport avec `viewport-fit=cover`.
- [ ] Safe Areas (`pt-safe`, `pb-safe`) appliquées.
- [ ] Inputs avec `font-size: 16px`.
- [ ] Touch targets >= 44px.
- [ ] Scroll fluide (`-webkit-overflow-scrolling: touch`).
- [ ] Feedback tactile (`whileTap`, `:active`).
- [ ] Pas de zoom accidentel (max-scale=1).
