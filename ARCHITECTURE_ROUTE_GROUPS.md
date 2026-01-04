# Architecture Route Groups - Dousell Immo

## 🎯 Objectif

Séparer l'application en **deux univers visuels distincts** sans modifier les URLs :
- **Site Vitrine** : Design classique avec Header/Footer
- **WebApp Gestion Locative** : Interface plein écran type logiciel métier

## 📁 Structure

```
app/
├── layout.tsx                    # Layout RACINE (juste <html> + Providers)
│
├── (vitrine)/                    # ✨ GROUPE 1 : Site Vitrine
│   ├── layout.tsx                # Header + Footer + Breadcrumbs
│   ├── page.tsx                  # Page d'accueil
│   ├── biens/
│   ├── compte/
│   ├── admin/
│   └── ...                       # Toutes les pages du site
│
└── (webapp)/                     # 🚀 GROUPE 2 : Application Métier
    ├── layout.tsx                # Header minimaliste + Plein écran
    ├── gestion-locative/         # Dashboard gestion
    ├── documents-legaux/         # Documents (contrats, baux...)
    ├── etats-lieux/              # États des lieux
    └── interventions/            # Gestion des interventions
```

## 🔗 Correspondance URL → Route Group

### Site Vitrine (vitrine)
- `dousell.sn/` → `app/(vitrine)/page.tsx`
- `dousell.sn/biens/[id]` → `app/(vitrine)/biens/[id]/page.tsx`
- `dousell.sn/compte` → `app/(vitrine)/compte/page.tsx`
- `dousell.sn/login` → `app/(vitrine)/login/page.tsx`

### WebApp Gestion (webapp)
- `dousell.sn/gestion-locative` → `app/(webapp)/gestion-locative/page.tsx`
- `dousell.sn/documents-legaux` → `app/(webapp)/documents-legaux/page.tsx`
- `dousell.sn/etats-lieux` → `app/(webapp)/etats-lieux/page.tsx`
- `dousell.sn/interventions` → `app/(webapp)/interventions/page.tsx`

> ⚠️ **Important** : Les parenthèses `(vitrine)` et `(webapp)` n'apparaissent PAS dans les URLs !

### 🔄 Changement d'URL Important

**L'URL de la gestion locative a changé suite à la migration Route Groups :**

- ❌ **Ancien** : `/compte/gestion-locative`
- ✅ **Nouveau** : `/gestion-locative`

Tous les liens internes ont été mis à jour automatiquement.

## 🎨 Layouts

### Layout Racine (`app/layout.tsx`)
- Juste `<html>`, `<body>` et les Providers globaux
- Aucun élément visuel (pas de Header/Footer)
- Permet à chaque Route Group d'avoir son propre design

### Layout Vitrine (`app/(vitrine)/layout.tsx`)
- **Header** : Navbar classique Dousell
- **Footer** : Footer du site
- **Container** : max-width centré
- **Breadcrumbs** : Fil d'Ariane
- **BottomNav** : Navigation mobile

### Layout WebApp (`app/(webapp)/layout.tsx`)
- **Header minimaliste** : Logo + Titre "Gestion Locative" + Bouton "Quitter"
- **Plein écran** : `h-screen w-screen overflow-hidden`
- **Background** : Dégradé dark (#05080c → #040507)
- **Pas de Footer** : Interface application pure

## 🔄 Migration des imports

Tous les imports absolus `@/app/...` ont été mis à jour :

**Avant** :
```ts
import { someAction } from '@/app/compte/actions';
```

**Après** :
```ts
import { someAction } from '@/app/(vitrine)/compte/actions';
```

## ✅ Résultats

- ✅ Build Next.js réussi sans erreurs
- ✅ Séparation claire entre Site et WebApp
- ✅ URLs inchangées
- ✅ Deux expériences UX distinctes

## 📝 Notes

1. Le dossier `legal` a été renommé en `documents-legaux` dans `(webapp)` pour éviter les conflits avec `(vitrine)/legal`
2. L'ancien Route Group `(gestion)` a été supprimé au profit de `(webapp)`
3. Tous les fichiers de `gestion-locative` sont maintenant dans `(webapp)`

## 🚀 Avantages

- **Séparation des contextes** : Code métier isolé du site vitrine
- **Maintenance facilitée** : Modifications sur le site n'impactent pas l'app et vice-versa
- **Performances** : Chaque groupe peut avoir sa propre stratégie de cache/ISR
- **UX cohérente** : Interface adaptée au contexte (site web vs logiciel)
