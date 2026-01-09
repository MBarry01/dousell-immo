# Landing Page 3D "Awwwards Style"

## 🎯 Concept : "Du Rêve à la Réalité"

Cette landing page utilise une expérience immersive en 3D avec React Three Fiber pour raconter l'histoire du bien immobilier à travers le scroll.

## 🏗️ Architecture

### Composants créés

1. **`components/3d/HouseModel.tsx`**
   - Charge le modèle 3D de la maison (`/3D/house.glb`)
   - Animations GSAP avec rotation automatique
   - Transition au scroll vers la section SaaS
   - Préchargement du modèle pour de meilleures performances

2. **`components/3d/Scene.tsx`**
   - Canvas Three.js en position fixed (arrière-plan)
   - Lumières et environnement optimisés
   - Composant Float pour effet de lévitation
   - Suspense pour le chargement progressif

3. **`components/home/FeaturesStack.tsx`**
   - Cartes empilées (Sticky Cards) avec effet de scroll
   - 4 fonctionnalités principales du SaaS
   - Animations d'apparition progressive
   - Effet de pin au scroll

4. **`components/home/SocialProof.tsx`**
   - Compteurs animés avec react-countup
   - Détection du scroll avec react-intersection-observer
   - 3 métriques clés (loyers sécurisés, propriétés, satisfaction)
   - Design gradient avec shimmer gold

5. **`app/(vitrine)/landing-3d/page.tsx`**
   - Page principale avec 3 sections :
     * **Section Vitrine** : Hero avec maison 3D en rotation
     * **Section Transition** : Zone de scroll pour la transformation 3D
     * **Section SaaS** : Fonctionnalités + preuve sociale

## 🎨 Design System

- **Couleur primaire** : `#F4C430` (Or - Luxe & Teranga)
- **Fond dark** : `#000000`, `#121212`, `slate-900`
- **Fond light** : `slate-50`, `white`
- **Fonts** : Outfit (déjà configuré)
- **Animations** : GSAP + ScrollTrigger
- **3D** : React Three Fiber + Drei

## 📦 Dépendances installées

```json
{
  "three": "^0.x.x",
  "@types/three": "^0.x.x",
  "@react-three/fiber": "^8.x.x",
  "@react-three/drei": "^9.x.x",
  "gsap": "^3.x.x",
  "@gsap/react": "^2.x.x",
  "react-countup": "^6.x.x",
  "react-intersection-observer": "^9.x.x"
}
```

## 🚀 Accès à la page

**URL de développement** : `http://localhost:3000/landing-3d`

## 🎬 Comportement au scroll

### Phase 1 : Vitrine (0% - 50%)
- Maison 3D en rotation douce (20s par tour)
- Hero avec titre gradient + 2 CTA
- Badge premium animé
- Micro-stats en bas

### Phase 2 : Transition (50% - 70%)
- La maison 3D se décale vers la gauche (x: -2)
- Zoom avant léger (z: 1)
- Rotation fixe pour montrer la façade (y: 0.5)

### Phase 3 : SaaS (70% - 100%)
- Fond devient blanc/slate-50
- Features Stack (cartes empilées avec effet sticky)
- Social Proof avec compteurs animés
- Final CTA

## 🔧 Optimisations de performance

1. **Préchargement du modèle 3D**
   ```tsx
   useGLTF.preload("/3D/house.glb");
   ```

2. **Suspense pour le chargement progressif**
   ```tsx
   <Suspense fallback={null}>
     <HouseModel />
   </Suspense>
   ```

3. **Canvas en pointer-events-none**
   - Évite les interférences avec le scroll HTML

4. **ScrollTrigger optimisé**
   - `scrub: true` pour des animations fluides
   - Cleanup avec `ScrollTrigger.getAll().forEach(trigger => trigger.kill())`

## 📝 Modifications futures possibles

### Variantes 3D
- Remplacer `house.glb` par un autre modèle
- Ajouter plusieurs maisons en parallaxe
- Mode Wireframe sur la transition (voir plan initial)

### Animations avancées
- Particules dorées autour de la maison
- Effet de "morphing" entre vitrine et SaaS
- Smooth scroll avec Lenis

### A/B Testing
- Version avec vidéo 3D pré-rendue (meilleure perfo mobile)
- Version sans 3D pour connexions lentes
- Analytics sur les conversions par CTA

## 🐛 Troubleshooting

### Le modèle 3D ne s'affiche pas
- Vérifier que `/public/3D/house.glb` existe
- Ouvrir la console pour les erreurs de chargement
- Tester avec un autre modèle (ex: `/3D/coin.glb`)

### Animations saccadées
- Désactiver le `Float` dans `Scene.tsx`
- Réduire la durée de rotation de 20s à 30s
- Vérifier la taille du fichier .glb (< 5MB recommandé)

### Erreur de build TypeScript
- Supprimer `.next` : `rm -rf .next`
- Relancer : `npm run dev`

## 📚 Ressources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Kenney 3D Assets](https://kenney.nl/assets)
- [Poly Pizza](https://poly.pizza/)
- [Sketchfab Low Poly](https://sketchfab.com/search?features=downloadable&q=low+poly+house&type=models)

## ✅ Checklist avant production

- [ ] Tester sur mobile (iOS + Android)
- [ ] Vérifier la taille du bundle JS (< 1MB pour la 3D)
- [ ] Ajouter un loader pendant le chargement du modèle
- [ ] Tester sur connexion 3G
- [ ] Analytics sur les taux de scroll (combien atteignent la section SaaS ?)
- [ ] A/B test : Landing classique vs Landing 3D
