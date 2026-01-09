# Composants 3D - Guide Technique

## 🎯 Vue d'ensemble

Ce dossier contient les composants pour l'expérience 3D immersive de la landing page.

## 📁 Structure

```
components/3d/
├── HouseModel.tsx    # Modèle 3D de la maison + animations GSAP
└── Scene.tsx         # Canvas Three.js (wrapper global)
```

## 🏠 HouseModel.tsx

### Rôle
Charge et anime le modèle 3D de la maison avec React Three Fiber et GSAP.

### Props
Aucune (utilise le modèle par défaut `/3D/house.glb`)

### Animations

#### Animation 1 : Rotation infinie (Vitrine)
```tsx
gsap.to(houseRef.current.rotation, {
  y: Math.PI * 2,  // 360° en radians
  duration: 20,     // 20 secondes par tour
  repeat: -1,       // Infini
  ease: "linear"    // Vitesse constante
});
```

#### Animation 2 : Transition au scroll (Vers SaaS)
```tsx
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#saas-section",  // Déclenche quand cette section arrive
    start: "top bottom",        // Commence quand le haut touche le bas de l'écran
    end: "top top",             // Finit quand le haut touche le haut de l'écran
    scrub: true                 // Synchronisé avec le scroll
  }
});

tl.to(houseRef.current.position, {
  x: -2,  // Décale à gauche
  z: 1    // Zoom avant
});

tl.to(houseRef.current.rotation, {
  y: 0.5  // Angle fixe pour la façade
}, "<");  // En même temps que l'animation précédente
```

### Utilisation

```tsx
import { HouseModel } from "@/components/3d/HouseModel";

// Dans votre composant Canvas
<Canvas>
  <HouseModel />
</Canvas>
```

### Changer le modèle 3D

Pour utiliser un autre modèle :

```tsx
const { scene } = useGLTF("/3D/autre-modele.glb");
```

N'oubliez pas de mettre à jour le preload :
```tsx
useGLTF.preload("/3D/autre-modele.glb");
```

## 🎨 Scene.tsx

### Rôle
Wrapper global qui crée le Canvas Three.js en arrière-plan fixé.

### Structure

```tsx
<div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
  <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
    {/* Lumières */}
    <ambientLight intensity={0.5} />
    <directionalLight position={[5, 5, 5]} intensity={1} />

    {/* Environnement (reflets) */}
    <Environment preset="city" />

    {/* Modèle avec effet Float */}
    <Suspense fallback={null}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <HouseModel />
      </Float>
    </Suspense>
  </Canvas>
</div>
```

### Paramètres clés

#### Camera
- `position: [0, 0, 5]` - Distance de la caméra (x, y, z)
- `fov: 50` - Champ de vision (field of view)

#### Lumières
- **ambientLight** : Lumière ambiante uniforme (évite les zones trop sombres)
- **directionalLight** : Lumière directionnelle (comme le soleil)

#### Environment
- `preset: "city"` - Environnement HDRI pour les reflets
- Autres presets : `sunset`, `dawn`, `night`, `warehouse`, `forest`, `apartment`

#### Float (de @react-three/drei)
- `speed: 2` - Vitesse de l'oscillation
- `rotationIntensity: 0.5` - Intensité de la rotation
- `floatIntensity: 0.5` - Amplitude du mouvement vertical

### Utilisation

```tsx
import Scene from "@/components/3d/Scene";

export default function Page() {
  return (
    <div className="relative">
      {/* Arrière-plan 3D */}
      <Scene />

      {/* Contenu HTML par-dessus */}
      <div className="relative z-10">
        <h1>Mon contenu</h1>
      </div>
    </div>
  );
}
```

## 🔧 Optimisations

### Suspense
```tsx
<Suspense fallback={null}>
  <HouseModel />
</Suspense>
```
- Affiche `null` pendant le chargement
- Évite le blocage du rendu
- Alternative : Afficher un loader

### Préchargement
```tsx
useGLTF.preload("/3D/house.glb");
```
- Commence à charger le modèle avant le premier rendu
- Réduit le temps d'affichage initial

### pointer-events-none
```tsx
<div className="... pointer-events-none">
```
- Le Canvas ne capture pas les événements souris/touch
- Permet le scroll HTML normal

## 🎬 Timeline GSAP - Explication

### Qu'est-ce qu'une timeline ?
Une timeline GSAP regroupe plusieurs animations qui se jouent séquentiellement ou en parallèle.

### Position des animations
- **Par défaut** : Les animations se jouent l'une après l'autre
- **`"<"`** : Commence en même temps que l'animation précédente
- **`"-=0.5"`** : Commence 0.5s avant la fin de l'animation précédente
- **`"+=0.5"`** : Commence 0.5s après la fin de l'animation précédente

### Exemple
```tsx
const tl = gsap.timeline();

tl.to(obj, { x: 100 });      // Animation 1
tl.to(obj, { y: 100 }, "<"); // En même temps que Animation 1
tl.to(obj, { scale: 2 });    // Après Animation 1
```

## 📊 Système de coordonnées 3D

```
       Y (haut)
       |
       |
       |_______ X (droite)
      /
     /
    Z (vers la caméra)
```

### Position
- `x: -2` → Déplace à gauche
- `x: 2` → Déplace à droite
- `y: 1` → Déplace en haut
- `z: -1` → Déplace en arrière (s'éloigne)
- `z: 1` → Déplace en avant (zoom)

### Rotation (en radians)
- `Math.PI * 2` = 360°
- `Math.PI` = 180°
- `Math.PI / 2` = 90°

## 🐛 Debug

### La maison n'apparaît pas
1. Vérifier la console (F12)
2. Vérifier le chemin : `/3D/house.glb` existe ?
3. Tester avec un modèle simple : `/3D/coin.glb`

### La maison est trop petite/grande
Ajuster le `scale` :
```tsx
<primitive object={scene} ref={houseRef} scale={2.5} />
```

### La maison est mal positionnée
Ajuster la position initiale :
```tsx
<primitive
  object={scene}
  ref={houseRef}
  scale={1.5}
  position={[0, -1, 0]}  // Descendre de 1 unité
/>
```

### Les animations ne fonctionnent pas
1. Vérifier que GSAP est bien installé : `npm list gsap`
2. Vérifier la console pour les erreurs ScrollTrigger
3. Vérifier que `#saas-section` existe dans le HTML

## 📚 Ressources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [Drei Helpers](https://github.com/pmndrs/drei) (Float, Environment, etc.)
- [GSAP Docs](https://gsap.com/docs/v3/)
- [ScrollTrigger Demos](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
