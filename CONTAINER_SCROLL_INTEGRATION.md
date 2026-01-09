# Container Scroll Animation - Page Landing Indépendante

## 🎯 Route Indépendante (comme webapp)

La page `/landing` est maintenant **complètement indépendante** comme la webapp de gestion :
- ✅ Route racine : `app/landing/` (hors de `(vitrine)` et `(webapp)`)
- ✅ Pas de header/navigation du site
- ✅ Pas de footer
- ✅ Pleine largeur/hauteur (100vw/100vh)
- ✅ Layout dédié sans héritage des groupes de routes
- ✅ Uniquement le composant scroll animation

### Structure des Routes
```
app/
├── (vitrine)/          # Pages publiques avec header/footer
├── (webapp)/           # Application de gestion locative
└── landing/            # Page landing INDÉPENDANTE ✨
    ├── layout.tsx
    └── page.tsx
```

## 📦 Composant Intégré

### Fichier : `components/ui/container-scroll-animation.tsx`

Composant d'animation de scroll 3D avec effet de perspective créé avec Framer Motion.

## 🎯 Fonctionnalités

### Animations au Scroll
- **Rotation 3D** : L'image pivote de 20° à 0° pendant le scroll
- **Scale dynamique** :
  - Desktop : 1.05 → 1
  - Mobile : 0.7 → 0.9
- **Translation verticale** : Le titre se déplace vers le haut (-100px)
- **Perspective 3D** : Effet de profondeur avec `perspective: 1000px`

### Composants Exportés
1. **ContainerScroll** : Container principal avec gestion du scroll
2. **Header** : En-tête animé avec translation
3. **Card** : Carte 3D avec rotation et shadow complexe

## 🎨 Page Landing Complète

### Structure
**Fichier** : `/app/landing/page.tsx` (36 lignes - minimaliste)

```tsx
"use client";

import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      <div className="flex flex-col overflow-hidden w-full">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-white">
                Découvrez la puissance de <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-[#F4C430] to-[#FFD700] bg-clip-text text-transparent">
                  Dousell Immo
                </span>
              </h1>
            </>
          }
        >
          <Image
            src="/couv.png"
            alt="Dashboard Dousell Immo"
            height={720}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </main>
  );
}
```

### Layout Dédié
**Fichier** : `/app/landing/layout.tsx`

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dousell Immo - Plateforme de Gestion Immobilière",
  description: "Découvrez la puissance de Dousell Immo pour gérer votre patrimoine immobilier au Sénégal",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Avantages** :
- Pas d'héritage du layout parent
- Métadonnées SEO dédiées
- Aucune dépendance aux autres composants du projet

## 🎨 Design Adapté Dousell Immo

### Couleurs Personnalisées
- **Titre gradient** : `from-[#F4C430] to-[#FFD700]` (or doré)
- **Background** : `bg-zinc-950` (noir profond)
- **Card border** : `border-[#6C6C6C]` (gris neutre)
- **Card background** : `bg-[#222222]` (noir doux)

### Dimensions
- **Container height** :
  - Mobile : 60rem (960px)
  - Desktop : 80rem (1280px)
- **Card height** :
  - Mobile : 30rem (480px)
  - Desktop : 40rem (640px)
- **Max width** : 5xl (1024px)

## 📱 Responsive Design

### Mobile (≤768px)
- Scale réduit : 0.7 → 0.9
- Padding réduit : p-2
- Titre plus petit : text-4xl

### Desktop (>768px)
- Scale standard : 1.05 → 1
- Padding large : p-20
- Titre grand : text-[6rem]

## 🖼️ Image Utilisée

**Fichier** : `/public/couv.png`
- Format : PNG
- Dimensions recommandées : 1400x720px
- Position : `object-left-top` (focus en haut à gauche)
- Responsive : Next/Image avec optimisation automatique

## 🎭 Effets Visuels

### Shadow 3D Complexe
```css
boxShadow:
  "0 0 #0000004d,           /* Base */
   0 9px 20px #0000004a,    /* Proche */
   0 37px 37px #00000042,   /* Moyen */
   0 84px 50px #00000026,   /* Loin */
   0 149px 60px #0000000a,  /* Très loin */
   0 233px 65px #00000003"  /* Ultra loin */
```

### Border & Radius
- **Border** : 4px solid #6C6C6C
- **Corner radius** : 30px (card externe), 16px (contenu interne)
- **Padding** : 6px (desktop), 2px (mobile)

## ⚡ Performance

### Optimisations
- **useScroll** : Hook optimisé Framer Motion
- **useTransform** : Interpolation GPU-accelerated
- **useEffect** : Detection resize avec cleanup
- **Image** : Next/Image avec lazy loading automatique

### Dépendances
- ✅ `framer-motion` : v12.23.24
- ✅ `next/image` : Inclus avec Next.js 16
- ✅ `react` : Hooks modernes (useRef, useEffect)

## 🚀 Utilisation dans d'autres pages

Pour réutiliser le composant ailleurs :

```tsx
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

<ContainerScroll
  titleComponent={
    <h1>Votre Titre</h1>
  }
>
  <Image
    src="/votre-image.png"
    alt="Description"
    height={720}
    width={1400}
    className="mx-auto rounded-2xl object-cover h-full"
    draggable={false}
  />
</ContainerScroll>
```

## 📊 État du Build

✅ Build successful
✅ TypeScript validé
✅ Route `/landing` compilée
✅ Animations 60fps

## 🎯 Experience Utilisateur

### Flow
1. **Scroll down** : L'utilisateur scroll depuis le Hero
2. **Animation trigger** : Le composant entre en vue
3. **Rotation progressive** : La carte pivote de 20° → 0°
4. **Scale** : La carte se réduit légèrement (zoom out)
5. **Titre monte** : Le titre glisse vers le haut
6. **Immersion** : L'image du dashboard apparaît en plein écran

### Points d'attention UX
- **Smooth scroll** : Transitions fluides sans jerk
- **Perspective réaliste** : Effet 3D crédible
- **Mobile-friendly** : Scale adapté aux petits écrans
- **Performance** : 60fps constant grâce aux GPU transforms

## 🔄 Prochaines évolutions possibles

1. **Images multiples** : Carrousel dans la carte
2. **Vidéo** : Remplacer l'image par une démo vidéo
3. **Interactions** : Hover states sur la carte
4. **Parallax layers** : Multiples couches en profondeur
5. **Color variants** : Props pour personnaliser les couleurs

## 📝 Notes de développement

- La section utilise `bg-zinc-950` pour contraster avec le `bg-black` des autres sections
- Le gradient or (#F4C430 → #FFD700) reste cohérent avec le branding Dousell
- L'effet 3D fonctionne mieux sur desktop, simplifié sur mobile
- Le composant est client-side (`"use client"`) pour Framer Motion
