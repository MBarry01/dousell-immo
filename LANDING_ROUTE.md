# Route Landing Indépendante - Dousell Immo

## 🎯 Architecture

La page `/landing` est une **route racine indépendante**, complètement isolée du reste de l'application, tout comme la webapp de gestion locative.

### Structure du Projet

```
app/
├── (vitrine)/              # Pages publiques (avec header/footer commun)
│   ├── page.tsx            # Homepage
│   ├── a-propos/
│   ├── contact/
│   └── ...
│
├── (webapp)/               # Application gestion locative (indépendante)
│   ├── gestion-locative/
│   ├── etats-lieux/
│   └── ...
│
└── landing/                # Landing page INDÉPENDANTE ✨
    ├── layout.tsx          # Layout dédié (pas d'héritage)
    └── page.tsx            # Page scroll animation
```

## ✨ Caractéristiques

### Indépendance Totale
- ✅ **Route racine** : Hors des groupes `(vitrine)` et `(webapp)`
- ✅ **Pas de layout parent** : Aucun header/footer/navigation
- ✅ **Pas de dépendances** : Uniquement React, Next/Image, Framer Motion
- ✅ **Plein écran** : 100vw × 100vh (min-h-screen)
- ✅ **Layout minimaliste** : Retourne directement `{children}`

### Métadonnées SEO Dédiées

```tsx
export const metadata: Metadata = {
  title: "Dousell Immo - Plateforme de Gestion Immobilière",
  description: "Découvrez la puissance de Dousell Immo pour gérer votre patrimoine immobilier au Sénégal",
};
```

## 📁 Fichiers

### 1. `app/landing/page.tsx` (36 lignes)

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

**Détails** :
- Client component (`"use client"`) pour Framer Motion
- Background `bg-zinc-950` (noir profond)
- Flexbox centré verticalement et horizontalement
- Overflow hidden pour éviter les scrollbars horizontales

### 2. `app/landing/layout.tsx`

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

**Détails** :
- Layout minimal qui retourne directement les enfants
- Pas d'héritage du RootLayout des groupes de routes
- Métadonnées SEO personnalisées

### 3. `components/ui/container-scroll-animation.tsx`

Composant réutilisable avec :
- Animation 3D (rotation, scale, translation)
- Responsive mobile/desktop
- Perspective 1000px
- Shadow complexe 6 couches

## 🎨 Design Dousell Immo

### Couleurs
- **Gradient or** : `from-[#F4C430] to-[#FFD700]`
- **Background** : `bg-zinc-950` (#18181b)
- **Texte** : `text-white`

### Typographie
- **Titre principal** : `text-4xl font-semibold`
- **Titre hero** : `md:text-[6rem] font-bold` (responsive)

## 🚀 Accès

### URL
```
http://localhost:3000/landing
```

### Production
```
https://votre-domaine.com/landing
```

## 📊 Performance

### Build Output
```
├ ○ /landing    # Static (○)
```

- **Type** : Page statique
- **Taille** : Minimaliste (~2KB JS + image)
- **Animations** : GPU-accelerated (Framer Motion)
- **Images** : Optimisées par Next/Image

## 🔄 Comparaison avec les autres routes

| Route | Type | Layout Parent | Header/Footer | Indépendante |
|-------|------|---------------|---------------|--------------|
| `(vitrine)/` | Public | RootLayout | ✅ Oui | ❌ Non |
| `(webapp)/gestion-locative` | App | Custom | ❌ Non | ✅ Oui |
| `landing/` | Landing | Minimal | ❌ Non | ✅ Oui |

## ✅ Avantages de cette Architecture

1. **Isolation complète** : Aucun conflit avec les styles/layouts existants
2. **Performance** : Pas de code inutile chargé (header, footer, navigation)
3. **Maintenabilité** : Facile à modifier sans affecter le reste du site
4. **SEO dédié** : Métadonnées personnalisées pour cette page
5. **Scalabilité** : Facilite l'ajout d'autres landing pages (`landing2/`, `landing-promo/`, etc.)

## 🎯 Cas d'Usage

- **Campagnes marketing** : Landing page pour des campagnes publicitaires
- **A/B Testing** : Tester différentes versions de landing
- **Événements** : Page dédiée pour un lancement/événement
- **Démos** : Showcase du produit sans distraction

## 📝 Notes de Développement

- La page utilise l'image `/public/couv.png` (1400×720px recommandé)
- Framer Motion v12.23.24 requis
- Client component obligatoire pour les animations
- Pas besoin de middleware ou authentification
- Compatible avec tous les navigateurs modernes

## 🔜 Évolutions Possibles

1. **Variantes** : Créer `landing-promo/`, `landing-demo/`, etc.
2. **Vidéo** : Remplacer l'image par une vidéo de démonstration
3. **CTA** : Ajouter un bouton d'action en bas de page
4. **Analytics** : Intégrer tracking dédié (Google Analytics, Plausible)
5. **Formulaire** : Capturer des emails en overlay
