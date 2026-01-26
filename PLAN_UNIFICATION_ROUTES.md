# Plan d'Unification Routes & Navigation - Dousell Immo

> **Date:** 16 Janvier 2026
> **Statut:** ✅ IMPLÉMENTÉ
> **Impact:** Majeur (navigation, layouts, UX)

---

## 📋 Résumé Exécutif

L'audit révèle **3 problèmes critiques** et **7 incohérences majeures** dans l'architecture des routes. Le projet combine actuellement deux applications parallèles (`(vitrine)` et `(webapp)`) sans cohésion claire, créant une UX fragmentée.

### Problèmes Critiques Identifiés

| # | Problème | Impact | Fichier |
|---|----------|--------|---------|
| 1 | Redirection vers `/auth` inexistante | Page blanche | `(webapp)/layout.tsx:44` |
| 2 | Tenant portal sans lien d'accès | Inaccessible | Navigation globale |
| 3 | Protection routes webapp (client-side only) | Sécurité faible | `middleware.ts` |

### Incohérences Majeures

1. `/cgu` et `/legal/cgu` dupliquées
2. `/compte/gestion-locative` vs `/gestion-locative` (deux accès)
3. Deux layouts différents (vitrine vs webapp)
4. Thème différent (dark fixe vs toggle)
5. Routes de test exposées en production
6. Naming illogique (`/(tenant)/portal`)
7. Bottom-nav pointe vers webapp (change d'app)

---

## 🎯 Stratégie Recommandée

### Option A: Unification Complète

Fusionner `(webapp)` dans `(vitrine)` sous un layout unifié.

**Avantages:** UX cohérente, un seul layout
**Inconvénients:** Perte de l'identité SaaS, assets marketing chargés inutilement

### Option B: Workspace Hybride (Recommandée ⭐)

Garder deux univers distincts **mais interconnectés** via une architecture "Bridge".

```
(vitrine)   = Marketing, Landing, Découverte → Layout riche (Header + Footer)
(workspace) = SaaS, Gestion, Productivité   → Layout applicatif (Sidebar + Header compact)
```

**Avantages:**
- UX adaptée au contexte (marketing ≠ outil de travail)
- Performance optimisée (pas d'assets marketing dans le workspace)
- Identité SaaS préservée
- Transitions fluides via View Transitions

**Inconvénients:**
- Deux layouts à maintenir (mais c'est voulu)
- Nécessite une "Bridge Navigation" bien pensée

### Option C: Pont de Transition Simple

Garder la structure actuelle avec corrections minimales.

**Avantages:** Moins de refactoring
**Inconvénients:** Dette technique persistante

---

## 📐 Architecture Cible (Option B - Workspace Hybride)

```
app/
├── layout.tsx                   # Root Layout (Providers globaux: Auth, Theme, Toast)
│
├── (vitrine)/                   # === UNIVERS MARKETING ===
│   ├── layout.tsx              # Layout Marketing (Header riche + Footer + BottomNav)
│   │
│   ├── # --- Pages Publiques ---
│   ├── page.tsx                # Landing "/"
│   ├── a-propos/
│   ├── contact/
│   ├── estimation/
│   ├── recherche/
│   ├── biens/[id]/
│   ├── legal/
│   │   ├── cgu/
│   │   └── privacy/
│   │
│   ├── # --- Authentification ---
│   ├── login/
│   ├── register/
│   └── auth/
│
├── (workspace)/                 # === UNIVERS SAAS / PRODUCTIVITÉ ===
│   ├── layout.tsx              # Layout App Shell (Sidebar + Header compact)
│   │
│   ├── # --- Espace Compte (tous users connectés) ---
│   ├── compte/
│   │   ├── page.tsx            # Dashboard profil
│   │   ├── profil/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── # --- Espace Locataire (rôle tenant) ---
│   ├── locataire/
│   │   ├── layout.tsx          # Sidebar contextuelle locataire
│   │   ├── page.tsx            # Dashboard locataire
│   │   ├── documents/
│   │   ├── paiements/
│   │   ├── maintenance/
│   │   └── messages/
│   │
│   ├── # --- Espace Propriétaire (rôle owner) ---
│   ├── gestion/
│   │   ├── layout.tsx          # Sidebar contextuelle propriétaire
│   │   ├── page.tsx            # Dashboard gestion
│   │   ├── biens/
│   │   ├── locataires/
│   │   ├── comptabilite/
│   │   ├── documents/
│   │   ├── etats-lieux/
│   │   └── interventions/
│   │
│   └── # --- Espace Admin (rôle admin) ---
│       admin/
│       ├── layout.tsx          # Sidebar contextuelle admin
│       └── ...
│
├── (presentation)/              # À SUPPRIMER (vide)
│
└── api/                         # Inchangé
```

### Bridge Navigation (Pont entre les univers)

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROOT LAYOUT                             │
│  (Auth Provider, Theme Provider, Notifications, View Transitions)│
└─────────────────────────────────────────────────────────────────┘
            │                                    │
            ▼                                    ▼
┌───────────────────────┐          ┌───────────────────────────────┐
│      (vitrine)        │          │         (workspace)           │
│  ┌─────────────────┐  │          │  ┌─────────────────────────┐  │
│  │  Header Marketing │  │◄────────┼──│ "Retour au site" (Logo) │  │
│  └─────────────────┘  │          │  └─────────────────────────┘  │
│                       │          │                               │
│  "Mon Espace" ────────┼─────────►│  Sidebar + Header compact     │
│  (selon rôle)         │          │                               │
│                       │          │                               │
│  ┌─────────────────┐  │          │  ┌─────────────────────────┐  │
│  │  Footer Rich    │  │          │  │  Pas de Footer          │  │
│  └─────────────────┘  │          │  └─────────────────────────┘  │
└───────────────────────┘          └───────────────────────────────┘
```

---

## 📝 Plan d'Implémentation (Option B - Workspace Hybride)

### Phase 1: Correctifs Critiques (Urgents)

#### 1.1 Fixer redirection `/auth` inexistante
**Fichier:** `app/(webapp)/layout.tsx`
```diff
- router.push('/auth');
+ router.push('/login');
```

#### 1.2 Protéger routes workspace au middleware
**Fichier:** `middleware.ts`
```typescript
const protectedPaths = [
  '/compte',
  '/admin',
  '/gestion',           // Nouveau chemin
  '/locataire',         // Nouveau chemin
  '/gestion-locative',  // Legacy (redirect)
  '/etats-lieux',       // Legacy (redirect)
];
```

#### 1.3 Ajouter redirects legacy → nouveau
**Fichier:** `next.config.js`
```javascript
redirects: async () => [
  { source: '/cgu', destination: '/legal/cgu', permanent: true },
  { source: '/gestion-locative/:path*', destination: '/gestion/:path*', permanent: true },
  { source: '/etats-lieux/:path*', destination: '/gestion/etats-lieux/:path*', permanent: true },
  { source: '/interventions', destination: '/gestion/interventions', permanent: true },
]
```

---

### Phase 2: Création du Groupe (workspace)

#### 2.1 Créer la structure workspace
```bash
app/(workspace)/
├── layout.tsx              # App Shell (Sidebar + Header compact)
├── compte/                 # Migré depuis (vitrine)/compte
├── locataire/              # Migré depuis (vitrine)/(tenant)/portal
├── gestion/                # Migré depuis (webapp)/gestion-locative
└── admin/                  # Migré depuis (vitrine)/admin
```

#### 2.2 Créer le Layout Workspace
**Fichier:** `app/(workspace)/layout.tsx`
```typescript
import { WorkspaceSidebar } from '@/components/workspace/sidebar';
import { WorkspaceHeader } from '@/components/workspace/header';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar - visible desktop, drawer mobile */}
      <WorkspaceSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header compact avec: Logo (→ vitrine), Search, Notifs, User */}
        <WorkspaceHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 2.3 Créer la Sidebar Intelligente
**Fichier:** `components/workspace/sidebar.tsx`
```typescript
// Sidebar qui adapte son menu selon le segment URL actif
// /gestion/* → Menu Propriétaire (Biens, Locataires, Comptabilité...)
// /locataire/* → Menu Locataire (Documents, Paiements, Maintenance...)
// /admin/* → Menu Admin (Users, Certifications, Stats...)
// /compte/* → Menu Profil (Profil, Notifications, Settings...)
```

#### 2.4 Migrer les routes
- [ ] Migrer `(vitrine)/compte/*` → `(workspace)/compte/*`
- [ ] Migrer `(vitrine)/(tenant)/portal/*` → `(workspace)/locataire/*`
- [ ] Migrer `(webapp)/gestion-locative/*` → `(workspace)/gestion/*`
- [ ] Migrer `(webapp)/etats-lieux/*` → `(workspace)/gestion/etats-lieux/*`
- [ ] Migrer `(webapp)/interventions/*` → `(workspace)/gestion/interventions/*`
- [ ] Migrer `(vitrine)/admin/*` → `(workspace)/admin/*`

---

### Phase 3: Bridge Navigation

#### 3.1 Pont Vitrine → Workspace
**Fichier:** `components/navigation/header.tsx` (vitrine)
```typescript
// Bouton "Mon Espace" qui redirige selon le rôle
const getWorkspaceRoute = (roles: string[]) => {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('owner')) return '/gestion';
  if (roles.includes('tenant')) return '/locataire';
  return '/compte';
};

<Button onClick={() => router.push(getWorkspaceRoute(userRoles))}>
  Mon Espace
</Button>
```

#### 3.2 Pont Workspace → Vitrine
**Fichier:** `components/workspace/header.tsx`
```typescript
// Logo cliquable qui ramène à la vitrine
<Link href="/" className="flex items-center gap-2">
  <Logo />
  <span className="text-xs text-muted-foreground">← Retour au site</span>
</Link>
```

#### 3.3 View Transitions (optionnel mais recommandé)
**Fichier:** `app/layout.tsx`
```typescript
import { ViewTransitions } from 'next-view-transitions';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ViewTransitions>
          <Providers>
            {children}
          </Providers>
        </ViewTransitions>
      </body>
    </html>
  );
}
```

#### 3.4 Redirections post-login intelligentes
**Fichier:** `lib/auth/post-login-redirect.ts`
```typescript
export function getPostLoginRedirect(roles: string[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('owner')) return '/gestion';
  if (roles.includes('tenant')) return '/locataire';
  return '/compte';
}
```

---

### Phase 4: Cleanup Vitrine

#### 4.1 Alléger le layout vitrine
**Fichier:** `app/(vitrine)/layout.tsx`
```typescript
// Layout marketing pur - plus de logique workspace
export default function VitrineLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-black">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav className="md:hidden" /> {/* Simplifié */}
    </div>
  );
}
```

#### 4.2 Supprimer les routes migrées de vitrine
- [ ] Supprimer `app/(vitrine)/compte/` (migré)
- [ ] Supprimer `app/(vitrine)/(tenant)/` (migré)
- [ ] Supprimer `app/(vitrine)/admin/` (migré)
- [ ] Supprimer `app/(vitrine)/cgu/` (doublon)

#### 4.3 Nettoyer routes de test
- [ ] Supprimer `/test-3d-simple`
- [ ] Supprimer `/test-design-system`
- [ ] Supprimer `/test-supabase`
- [ ] Supprimer `/landing-3d-debug`

---

### Phase 5: Suppression (webapp) et Finalisation

#### 5.1 Supprimer les anciens groupes
- [ ] Vérifier toutes les migrations complètes
- [ ] Supprimer `app/(webapp)/` entièrement
- [ ] Supprimer `app/(presentation)/` (vide)

#### 5.2 Mettre à jour les imports
```bash
# Chercher les imports cassés
grep -r "from.*webapp" --include="*.ts" --include="*.tsx"
grep -r "from.*tenant" --include="*.ts" --include="*.tsx"
```

#### 5.3 Tests de régression
- [ ] Navigation vitrine → workspace fluide
- [ ] Navigation workspace → vitrine fluide
- [ ] Auth flow complet (login/logout/register)
- [ ] Protection middleware fonctionne
- [ ] Redirections post-login par rôle
- [ ] Mobile responsive (sidebar drawer)
- [ ] `npm run build` passe

---

## 📊 Matrice de Migration des Routes

| Route Actuelle | Route Cible | Groupe | Action |
|----------------|-------------|--------|--------|
| `/` | `/` | vitrine | Inchangée |
| `/login` | `/login` | vitrine | Inchangée |
| `/recherche` | `/recherche` | vitrine | Inchangée |
| `/biens/[id]` | `/biens/[id]` | vitrine | Inchangée |
| `/cgu` | `/legal/cgu` | vitrine | Redirect 301 |
| `/compte` | `/compte` | **workspace** | Migration |
| `/compte/profil` | `/compte/profil` | **workspace** | Migration |
| `/(tenant)/portal` | `/locataire` | **workspace** | Migration |
| `/(tenant)/portal/documents` | `/locataire/documents` | **workspace** | Migration |
| `/(tenant)/portal/payments` | `/locataire/paiements` | **workspace** | Migration + Rename |
| `/(tenant)/portal/maintenance` | `/locataire/maintenance` | **workspace** | Migration |
| `/(tenant)/portal/messages` | `/locataire/messages` | **workspace** | Migration |
| `/gestion-locative` | `/gestion` | **workspace** | Migration + Redirect |
| `/gestion-locative/messages` | `/gestion/messages` | **workspace** | Migration |
| `/gestion-locative/documents` | `/gestion/documents` | **workspace** | Migration |
| `/gestion-locative/comptabilite` | `/gestion/comptabilite` | **workspace** | Migration |
| `/etats-lieux` | `/gestion/etats-lieux` | **workspace** | Migration + Redirect |
| `/etats-lieux/[id]` | `/gestion/etats-lieux/[id]` | **workspace** | Migration |
| `/interventions` | `/gestion/interventions` | **workspace** | Migration + Redirect |
| `/admin` | `/admin` | **workspace** | Migration |
| `/compte/gestion-locative` | SUPPRIMER | - | Doublon |
| `/test-*` | SUPPRIMER | - | Cleanup |

---

## ⏱️ Ordre d'Exécution

```
Phase 1 (Critiques)     ████████████░░░░░░░░  ~2h
Phase 2 (Unification)   ████████████████████  ~4h
Phase 3 (Navigation)    ████████████░░░░░░░░  ~2h
Phase 4 (Layout)        ████████░░░░░░░░░░░░  ~1.5h
Phase 5 (Cleanup)       ████████░░░░░░░░░░░░  ~1.5h
                        ────────────────────
                        Total: ~11h
```

---

## ✅ Critères de Succès

1. [ ] **Aucune page blanche** - Toutes les routes fonctionnent
2. [ ] **Navigation cohérente** - Un seul layout visible partout
3. [ ] **Accès par rôle** - Locataire/Propriétaire/Admin voient leurs espaces
4. [ ] **Mobile fluide** - Bottom-nav adapté au rôle
5. [ ] **Zéro route orpheline** - Toutes les pages accessibles via navigation
6. [ ] **Protection uniformisée** - Middleware protège toutes les routes sensibles
7. [ ] **Build réussi** - `npm run build` passe sans erreur

---

## 🚀 Prochaines Étapes

1. **Valider ce plan** avec l'équipe
2. **Créer branche** `feat/unify-routes`
3. **Implémenter Phase 1** (correctifs critiques)
4. **Tester** chaque phase avant de passer à la suivante
5. **Code review** avant merge

---

> **Note:** Ce plan suit les règles du `CLAUDE.md` - pas de réécriture complète, modifications partielles ciblées, validation à chaque étape.
