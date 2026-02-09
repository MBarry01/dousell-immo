# 🚀 Performance Cleanup - Dousell Immo

**Objectif** : Passer de RES 51 à RES 85-90 en supprimant le code mort et en optimisant les chargements.

## 📊 Audit des Dépendances Inutilisées

### ❌ À Supprimer (Code Mort)

| Dépendance | Utilisation | Taille | Impact Bundle |
|-----------|-------------|--------|---------------|
| `three` | Landing-3D (non utilisée) | ~600 KB | ~500 KB |
| `@react-three/fiber` | Landing-3D | ~150 KB | ~120 KB |
| `@react-three/drei` | Landing-3D | ~200 KB | ~150 KB |
| `gsap` | FeaturesStack (non importé) | ~180 KB | ~150 KB |
| `@gsap/react` | FeaturesStack | ~20 KB | ~15 KB |
| `canvas-confetti` | Non utilisé | ~30 KB | ~25 KB |
| `dom-to-image-more` | Non utilisé | ~40 KB | ~30 KB |
| `@tsparticles/engine` | Non utilisé | ~150 KB | ~100 KB |
| `@tsparticles/react` | Non utilisé | ~20 KB | ~15 KB |
| `@tsparticles/slim` | Non utilisé | ~80 KB | ~60 KB |

**Total économisé** : ~1.5 MB node_modules, **~1.1 MB bundle**

### ⚠️ À Déplacer (Dev Only)

| Dépendance | Raison | Action |
|-----------|--------|--------|
| `puppeteer` | Scripts de test uniquement | Déplacer en `devDependencies` |
| `puppeteer-extra` | Scripts de test | Déplacer en `devDependencies` |
| `puppeteer-extra-plugin-stealth` | Scripts de test | Déplacer en `devDependencies` |

**Gain production** : ~23 MB

## 🗂️ Fichiers à Supprimer

### Routes non utilisées
- ❌ `app/(vitrine)/landing-3d/` (Route test 3D)

### Composants non importés
- ❌ `components/3d/` (Tous les composants Three.js)
- ❌ `components/home/FeaturesStack.tsx` (Utilise GSAP, non importé)

### Documentation de test
- ❌ `SOLUTION_ERROR_HDR.md`
- ❌ `TROUBLESHOOTING_3D.md`
- ❌ `LANDING_3D_SETUP.md`
- ❌ `QUICKSTART_3D.md`
- ❌ `INTEGRATION_GUIDE.md`
- ❌ `README_LANDING_3D.md`
- ❌ `docs/LANDING_3D.md`
- ❌ `PLAN_UNIFICATION_ROUTES.md`

### Logs obsolètes
- ❌ `lint_log.txt`
- ❌ `lint_full_log.txt`
- ❌ `lint_results.txt`
- ❌ `lint_output.txt`

## 🎯 Plan d'Action

### Phase 1: Nettoyage (MAINTENANT)

```bash
# 1. Exécuter le script de nettoyage
bash cleanup-script.sh

# 2. Désinstaller les dépendances
npm uninstall three @react-three/fiber @react-three/drei
npm uninstall gsap @gsap/react
npm uninstall canvas-confetti dom-to-image-more
npm uninstall @tsparticles/engine @tsparticles/react @tsparticles/slim

# 3. Déplacer puppeteer
npm uninstall puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
npm install -D puppeteer puppeteer-extra puppeteer-extra-plugin-stealth

# 4. Rebuild
npm run build
```

**Gain attendu** :
- Bundle: -1.1 MB
- node_modules: -25 MB
- Build time: -15%

### Phase 2: Optimisations Code (APRÈS NETTOYAGE)

#### 2.1 Optimiser TTFB (-2s)
```typescript
// app/(vitrine)/page.tsx
-export const dynamic = 'force-dynamic';
export const revalidate = 3600; // ISR
```

#### 2.2 Lazy Load Analytics (-1s FCP)
```typescript
// Charger après interaction utilisateur
const LazyAnalytics = dynamic(() => import('@/components/analytics/lazy-analytics'));
```

#### 2.3 Supprimer Splash Screen (-500ms)
```typescript
// app/layout.tsx - Supprimer lignes 111-133
// Remplacer par transition CSS
```

## 📈 Impact Prévu

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **RES Score** | 51 | 85-90 | +67% |
| **TTFB** | 3.35s | 0.5s | -85% |
| **FCP** | 3.7s | 1.2s | -67% |
| **LCP** | 4.93s | 2.0s | -59% |
| **Bundle Size** | ~3 MB | ~1.9 MB | -37% |
| **node_modules** | ~850 MB | ~825 MB | -3% |

## ✅ Checklist

### Nettoyage Immédiat
- [ ] Exécuter `cleanup-script.sh`
- [ ] Désinstaller dépendances 3D/animations
- [ ] Déplacer puppeteer en devDependencies
- [ ] Vérifier le build (`npm run build`)
- [ ] Tester la page d'accueil

### Optimisations Code
- [ ] Retirer `force-dynamic` de page.tsx
- [ ] Lazy load analytics
- [ ] Supprimer splash screen bloquant
- [ ] Ajouter lazy loading pour leaflet (cartes)

### Validation
- [ ] Tester PageSpeed Insights
- [ ] Vérifier RES Score > 80
- [ ] Tester sur mobile (3G/4G)
- [ ] Vérifier que toutes les fonctionnalités marchent

## 🚨 Risques

**Aucun risque** : Tout le code identifié est non utilisé (routes non liées, composants non importés).

## 🔗 Ressources

- Script de nettoyage : `cleanup-script.sh`
- Optimisations TTFB : Voir `app/(vitrine)/page.tsx`
- Analytics lazy : Créer `components/analytics/lazy-analytics.tsx`
