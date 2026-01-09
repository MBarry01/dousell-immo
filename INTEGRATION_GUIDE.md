# 🔌 Guide d'Intégration - Landing Page 3D

Ce guide explique comment intégrer la landing page 3D dans votre site.

---

## 🎯 Options d'intégration

Vous avez **3 options** pour utiliser cette landing page :

### Option 1 : Route dédiée (Actuel) ✅
**URL** : `/landing-3d`
**Avantages** :
- ✅ Facile à tester
- ✅ Pas de modification de l'existant
- ✅ Peut coexister avec la page d'accueil actuelle

**Inconvénient** :
- ⚠️ Les visiteurs doivent connaître l'URL

**Utilisation** :
```tsx
// Déjà configuré !
// Visitez : http://localhost:3000/landing-3d
```

---

### Option 2 : Remplacer la page d'accueil 🔄
**URL** : `/` (page d'accueil)
**Avantages** :
- ✅ Tous les visiteurs voient la version 3D
- ✅ Maximum d'impact

**Inconvénients** :
- ⚠️ Perd la page d'accueil actuelle (sauf backup)
- ⚠️ Nécessite des tests approfondis

**Instructions** :

#### Étape 1 : Backup de l'ancienne page
```bash
# Sauvegarder l'ancienne page d'accueil
cp app/\(vitrine\)/page.tsx app/\(vitrine\)/page.backup.tsx
```

#### Étape 2 : Remplacer par la nouvelle
```bash
# Copier la landing 3D
cp app/\(vitrine\)/landing-3d/page.tsx app/\(vitrine\)/page.tsx
```

#### Étape 3 : Mettre à jour les métadonnées
Éditez `app/(vitrine)/page.tsx` :

```tsx
export const metadata = {
  title: "Dousell Immo - Agence Immobilière de Luxe au Sénégal",
  description: "Trouvez, habitez et gérez vos biens immobiliers de luxe au Sénégal avec Dousell Immo.",
};
```

#### Pour revenir en arrière
```bash
# Restaurer l'ancienne page
cp app/\(vitrine\)/page.backup.tsx app/\(vitrine\)/page.tsx
```

---

### Option 3 : A/B Testing (Recommandé) 🎯
**URL** : `/` avec redirection conditionnelle
**Avantages** :
- ✅ Tester les 2 versions
- ✅ Mesurer la conversion
- ✅ Choix basé sur les données

**Inconvénients** :
- ⚠️ Nécessite une configuration A/B

**Instructions** :

#### Utiliser Next.js Middleware pour l'A/B test

Créez `middleware.ts` à la racine :

```tsx
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // A/B Test uniquement sur la page d'accueil
  if (request.nextUrl.pathname === '/') {
    const random = Math.random();
    const variant = random < 0.5 ? 'original' : '3d';

    const response = NextResponse.next();
    response.cookies.set('ab-variant', variant, {
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    // Rediriger 50% des utilisateurs vers la version 3D
    if (variant === '3d') {
      return NextResponse.rewrite(
        new URL('/landing-3d', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
```

Puis trackez les conversions :
```tsx
// Dans votre système d'analytics
const variant = getCookie('ab-variant');
trackEvent('cta_click', { variant });
```

---

## 🔗 Créer un lien vers la landing 3D

Si vous gardez l'Option 1 (route dédiée), ajoutez un lien dans votre navigation :

### Dans le header
Éditez votre composant Header :

```tsx
<Link
  href="/landing-3d"
  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-full font-semibold"
>
  Découvrir l'expérience 3D ✨
</Link>
```

### Bouton sur la page d'accueil actuelle
Ajoutez un CTA dans `app/(vitrine)/page.tsx` :

```tsx
<section className="py-16 text-center">
  <h2 className="text-3xl font-bold mb-4">
    Découvrez notre nouvelle expérience immersive
  </h2>
  <p className="text-gray-600 mb-8">
    Une landing page 3D interactive qui raconte l'histoire de votre bien
  </p>
  <Link
    href="/landing-3d"
    className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-full font-bold hover:scale-105 transition-transform"
  >
    Voir la version 3D 🚀
  </Link>
</section>
```

---

## 📊 Comparaison des options

| Critère | Option 1 (Dédiée) | Option 2 (Remplacement) | Option 3 (A/B Test) |
|---------|------------------|------------------------|-------------------|
| **Facilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Risque** | ⭐ Faible | ⭐⭐⭐⭐ Élevé | ⭐⭐ Moyen |
| **Impact** | ⭐⭐ Limité | ⭐⭐⭐⭐⭐ Maximum | ⭐⭐⭐⭐ Optimal |
| **Données** | ⭐ Peu | ⭐⭐⭐ Quelques | ⭐⭐⭐⭐⭐ Beaucoup |
| **Temps** | 5 min | 30 min | 2h |

---

## 🎯 Recommandation

### Phase 1 : Test interne (Actuel)
- ✅ **Option 1** : Route dédiée `/landing-3d`
- ✅ Partager l'URL avec l'équipe
- ✅ Recueillir les feedbacks
- ✅ Optimiser la page

### Phase 2 : Test public
- ✅ **Option 3** : A/B Testing
- ✅ 50% des visiteurs voient la version 3D
- ✅ Mesurer les conversions
- ✅ Analyser les données (1-2 semaines)

### Phase 3 : Décision
- Si conversion 3D > Original : **Option 2** (Remplacement)
- Si conversion Original > 3D : Garder **Option 1** (Accès secondaire)

---

## 📈 Métriques à suivre

### Taux de conversion
```tsx
// À tracker avec Google Analytics ou autre
trackEvent('cta_click', {
  version: '3d',
  cta: 'je-cherche-un-bien' | 'je-suis-proprietaire',
  scroll_depth: scrollProgress,
});
```

### Métriques clés
1. **Taux de clic CTA** : Combien cliquent sur les boutons ?
2. **Scroll depth** : Combien atteignent la section SaaS ?
3. **Temps passé** : Plus de temps = plus d'engagement ?
4. **Taux de rebond** : Moins de rebond = mieux !
5. **Conversions** : Inscriptions, demandes de contact, etc.

---

## 🔧 Intégration avec l'existant

### Réutiliser les composants 3D ailleurs

#### Dans une page "À propos"
```tsx
import Scene from "@/components/3d/Scene";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <Scene />
      <div className="relative z-10 p-8">
        <h1>À propos de Dousell Immo</h1>
        {/* Votre contenu */}
      </div>
    </div>
  );
}
```

#### Changer le modèle 3D par page
```tsx
// Page Finance
<HouseModel config={{ path: "/3D/coin.glb" }} />

// Page Sécurité
<HouseModel config={{ path: "/3D/lock.glb" }} />

// Page Mobile
<HouseModel config={{ path: "/3D/phone.glb" }} />
```

---

## 🎨 Harmoniser le design

Pour que la landing 3D s'intègre parfaitement :

### 1. Utiliser les mêmes couleurs
```tsx
// Landing 3D utilise déjà :
--color-primary: #F4C430 (Or)

// Si vous avez d'autres couleurs de marque :
// Modifiez dans landing-3d/page.tsx
// Cherchez "amber" et remplacez
```

### 2. Utiliser les mêmes fonts
```tsx
// Landing 3D utilise Outfit (configuré dans globals.css)
// Si vous utilisez une autre font :
import { VotreFont } from "next/font/google";
```

### 3. Reprendre les composants Header/Footer
```tsx
// Ajoutez dans landing-3d/page.tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Landing3D() {
  return (
    <>
      <Header />
      {/* Votre contenu 3D */}
      <Footer />
    </>
  );
}
```

---

## ✅ Checklist d'intégration

Avant de passer en production :

### Tests
- [ ] La page fonctionne sur tous les navigateurs
- [ ] Les CTA redirigent vers les bonnes URLs
- [ ] Le scroll est fluide
- [ ] Les animations ne saccadent pas
- [ ] Mobile : tout s'affiche correctement
- [ ] Tablet : layout responsive OK

### SEO
- [ ] Métadonnées à jour (title, description)
- [ ] Open Graph tags (Facebook, Twitter)
- [ ] Structured data (JSON-LD)
- [ ] Sitemap mis à jour

### Analytics
- [ ] Google Analytics configuré
- [ ] Events de tracking ajoutés
- [ ] Heatmap installée (Hotjar, etc.)
- [ ] A/B test configuré (si Option 3)

### Performance
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] Bundle JS < 500KB
- [ ] Images optimisées

---

## 🚀 Déploiement

### Si vous utilisez Vercel

```bash
# Commit les changements
git add .
git commit -m "feat: add 3D landing page experience"

# Push vers Vercel
git push origin main

# Vercel déploie automatiquement
```

### Variables d'environnement

Aucune variable spécifique n'est requise pour la landing 3D.

---

## 📝 Notes finales

**La landing page 3D est prête à être intégrée !**

**Recommandation** :
1. Commencez par **Option 1** (route dédiée)
2. Testez pendant 1 semaine
3. Passez à **Option 3** (A/B test) pendant 2 semaines
4. Décidez ensuite : Remplacer ou Garder en secondaire

**Bon lancement ! 🚀**
