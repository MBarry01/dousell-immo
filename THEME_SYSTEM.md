# Système de Thème - WebApp Gestion Locative

## 📋 Vue d'ensemble

Le système de thème permet aux utilisateurs de basculer entre le **mode sombre** (par défaut) et le **mode clair** dans l'application de gestion locative.

## 🏗️ Architecture

### ThemeProvider (`app/(webapp)/theme-provider.tsx`)

Context React qui gère l'état global du thème pour toute l'application webapp.

```typescript
interface ThemeContextType {
  theme: Theme;        // "dark" | "light"
  toggleTheme: () => void;
  isDark: boolean;     // Helper pour vérifications rapides
}
```

**Fonctionnalités :**
- ✅ Persistance dans `localStorage` (clé : `webapp-theme`)
- ✅ Prévention du flash de mauvais thème au chargement
- ✅ Hook `useTheme()` pour accès dans les composants enfants

### Layout WebApp (`app/(webapp)/layout.tsx`)

Le layout principal enveloppe tous les enfants dans le `ThemeProvider` :

```typescript
export default function WebAppLayout({ children }) {
  return (
    <ThemeProvider>
      <WebAppLayoutContent>{children}</WebAppLayoutContent>
    </ThemeProvider>
  );
}
```

## 🎨 Styles Appliqués

### Header
- **Dark** : `bg-[#121212]`, `border-gray-800`
- **Light** : `bg-white`, `border-gray-200`

### Sidebar
- **Dark** : `bg-slate-900`, `border-slate-800`
- **Light** : `bg-white`, `border-gray-200`

### Navigation Active
- **Dark** : `bg-white/10`, `text-white`, `border-white/20`
- **Light** : `bg-[#F4C430]/10`, `text-gray-900`, `border-[#F4C430]/30` (Or Dousell)

### Main Content
- **Dark** : `bg-gradient-to-b from-[#05080c] via-[#05080c] to-[#040507]`
- **Light** : `bg-gray-50`

## 💻 Utilisation dans les Pages

### Méthode 1: Composants Thématiques (✅ Recommandée)

Utilisez les composants prêts à l'emploi dans `app/(webapp)/components/ThemedComponents.tsx`:

```typescript
"use client";

import {
  ThemedPage,
  ThemedCard,
  ThemedText,
  ThemedEmptyState,
  ThemedBadge,
  ThemedAlert,
  ThemedSectionHeader
} from '../components/ThemedComponents';

export function MaPageContent() {
  return (
    <ThemedPage>
      <ThemedSectionHeader
        title="Mon Titre"
        subtitle="Sous-titre optionnel"
        action={<button>Action</button>}
      />

      <ThemedCard className="p-4">
        <ThemedText variant="primary" as="h2">
          Titre de section
        </ThemedText>
        <ThemedText variant="muted">
          Texte secondaire
        </ThemedText>
      </ThemedCard>

      <ThemedEmptyState
        icon={FileIcon}
        title="Aucune donnée"
        description="Description de l'état vide"
        action={<button>Créer</button>}
      />

      <ThemedBadge variant="success">Actif</ThemedBadge>
      <ThemedAlert variant="info">Message d'information</ThemedAlert>
    </ThemedPage>
  );
}
```

**Composants disponibles :**
- `ThemedPage` - Wrapper de page avec espacement
- `ThemedCard` - Card avec background/bordures adaptés
- `ThemedText` - Texte avec variantes (primary, secondary, muted)
- `ThemedEmptyState` - État vide stylisé
- `ThemedBadge` - Badge de statut (default, success, warning, danger)
- `ThemedAlert` - Message d'alerte (info, success, warning, error)
- `ThemedSectionHeader` - En-tête de section avec titre et action

### Méthode 2: Hook useTheme (Pour cas spécifiques)

Pour un contrôle total :

```typescript
"use client";

import { useTheme } from "../theme-provider";

export default function MaPage() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}>
      {/* Votre contenu */}
    </div>
  );
}
```

## 🔄 Bouton Toggle

Situé dans le header (en haut à droite), le bouton affiche :
- **Mode sombre actif** : Icône Soleil ☀️ (pour passer en mode clair)
- **Mode clair actif** : Icône Lune 🌙 (pour passer en mode sombre)

## 🎯 Design System

### Couleurs Light Mode
- **Background** : `bg-gray-50`, `bg-white`
- **Text** : `text-gray-900`, `text-gray-600`
- **Borders** : `border-gray-200`
- **Hover** : `hover:bg-gray-100`, `hover:bg-gray-200`
- **Primary (Or)** : `#F4C430` pour les éléments actifs

### Couleurs Dark Mode
- **Background** : `bg-black`, `bg-[#121212]`, `bg-slate-900`
- **Text** : `text-white`, `text-slate-400`
- **Borders** : `border-gray-800`, `border-slate-800`
- **Hover** : `hover:bg-slate-800`
- **Gradient** : `from-[#05080c] via-[#05080c] to-[#040507]`

## ✅ État Actuel

- ✅ ThemeProvider créé et intégré
- ✅ Layout complet avec support thème (header, sidebar, main)
- ✅ Persistance localStorage
- ✅ Toggle fonctionnel
- ✅ Build Next.js réussi
- ✅ Transitions CSS fluides
- ✅ Composants thématiques réutilisables créés
- ✅ Pages implémentées : `/gestion-locative`, `/etats-lieux`

## 📝 Pages Implémentées

### ✅ Pages avec thème complet :
1. **Gestion Locative** (`/gestion-locative`)
   - Composants : `ThemedContent`, `ThemedWidget`
   - Support light/dark mode complet

2. **États des Lieux** (`/etats-lieux`)
   - Composant : `EtatsLieuxContent`
   - Utilise les composants thématiques partagés

### 🔄 Pages à implémenter :
- `/interventions` - Gestion des interventions
- `/documents-legaux` - Documents juridiques
- `/gestion-locative/comptabilite` - Comptabilité
- `/gestion-locative/messages` - Messagerie
- `/gestion-locative/documents` - GED
- `/gestion-locative/config` - Configuration

## 🔧 Maintenance

**Fichiers clés :**
- `app/(webapp)/theme-provider.tsx` - Context et logique du thème
- `app/(webapp)/layout.tsx` - Intégration et UI du layout
- `THEME_SYSTEM.md` - Cette documentation

**localStorage Key :** `webapp-theme`
