# Exemples d'utilisation des modèles 3D

## 🏠 Landing Page Immobilier (actuel)

**Modèle** : `house.glb`
**Config** : Rotation + Transition au scroll
**URL** : `/landing-3d`

```tsx
model: {
  path: "/3D/house.glb",
  scale: 1.5,
}
```

---

## 💰 Landing Page Paiements / Finance

**Modèle** : `coin.glb`
**Concept** : "Vos loyers, automatiquement"

### Variations possibles

```tsx
// Config pour la pièce d'or
{
  model: {
    path: "/3D/coin.glb",
    scale: 2.0,
  },
  rotation: {
    duration: 10,  // Rotation rapide (comme une pièce qui tourne)
  },
  scrollTransition: {
    finalPosition: {
      x: 0,   // Reste centré
      z: -2,  // S'éloigne (zoom out)
    },
    finalRotation: {
      y: Math.PI,  // 180° flip
    }
  }
}
```

### Cas d'usage
- Page de tarification
- Tableau de bord comptable
- Section "Paiements sécurisés"

---

## 🔒 Landing Page Sécurité / Contrats

**Modèle** : `lock.glb`
**Concept** : "Vos données, protégées"

### Config recommandée

```tsx
{
  model: {
    path: "/3D/lock.glb",
    scale: 1.8,
  },
  rotation: {
    duration: 25,  // Rotation lente (symbolise la stabilité)
  },
  float: {
    enabled: true,
    speed: 1,  // Mouvement très lent
    floatIntensity: 0.3,
  },
  scrollTransition: {
    finalPosition: {
      x: -1.5,
      z: 0.5,
    },
    // Animation d'ouverture du cadenas (si le modèle le permet)
  }
}
```

### Cas d'usage
- Page "Documents légaux"
- Section "Stockage sécurisé"
- Page de connexion

---

## 📱 Landing Page Mobile / App

**Modèle** : `phone.glb` ou `tablet.glb`
**Concept** : "Votre agence dans votre poche"

### Config pour téléphone

```tsx
{
  model: {
    path: "/3D/phone.glb",
    scale: 2.5,
    initialPosition: {
      x: 0,
      y: 0,
      z: 0,
    }
  },
  rotation: {
    enabled: false,  // Pas de rotation pour un téléphone
  },
  float: {
    enabled: true,
    speed: 2,
    rotationIntensity: 0.2,  // Légère oscillation
    floatIntensity: 0.8,
  },
  scrollTransition: {
    finalPosition: {
      x: 2,   // Décale à droite
      z: 1,
    },
    finalRotation: {
      y: -0.3,  // Tourne légèrement vers le contenu
    }
  }
}
```

### Cas d'usage
- Page "Téléchargez l'app"
- Section "Mobile-first"
- PWA showcase

---

## 🔧 Landing Page Maintenance / SAV

**Modèle** : `toolbox.glb`, `wrench.glb`, `drill.glb`, `screwdriver.glb`
**Concept** : "Vos incidents, résolus"

### Config pour boîte à outils

```tsx
{
  model: {
    path: "/3D/toolbox.glb",
    scale: 1.5,
  },
  rotation: {
    duration: 15,
  },
  scrollTransition: {
    // Animation d'ouverture de la boîte au scroll
    finalPosition: {
      x: -2,
      z: 1,
    },
    finalRotation: {
      x: 0.2,  // Inclinaison pour "ouvrir" la boîte
    }
  }
}
```

### Cas d'usage
- Page "Gestion des interventions"
- Section "Maintenance"
- Tableau de bord technique

---

## 📄 Landing Page Documents / GED

**Modèle** : `papers.glb`
**Concept** : "Tous vos documents, un seul endroit"

### Config recommandée

```tsx
{
  model: {
    path: "/3D/papers.glb",
    scale: 1.8,
  },
  rotation: {
    duration: 30,  // Rotation très lente
  },
  float: {
    enabled: true,
    speed: 1.5,
    floatIntensity: 0.4,
  },
  scrollTransition: {
    finalPosition: {
      x: 0,
      z: -1,  // S'éloigne pour montrer plusieurs documents
    },
  }
}
```

### Cas d'usage
- Page "Documents légaux"
- GED (Gestion Électronique de Documents)
- Section "Contrats"

---

## 🎨 Combiner plusieurs modèles

### Exemple : Landing Page avec 3 étapes

```tsx
// Étape 1 : Chercher (Maison)
<HouseModel config={{ path: "/3D/house.glb" }} />

// Scroll vers le bas...

// Étape 2 : Signer (Documents)
<HouseModel config={{ path: "/3D/papers.glb" }} />

// Scroll encore...

// Étape 3 : Payer (Pièce)
<HouseModel config={{ path: "/3D/coin.glb" }} />
```

### Implémentation

```tsx
export function MultiModelScene() {
  const scrollProgress = useScrollProgress();  // 0 à 1

  const currentModel =
    scrollProgress < 0.33 ? "/3D/house.glb" :
    scrollProgress < 0.66 ? "/3D/papers.glb" :
    "/3D/coin.glb";

  return <HouseModel key={currentModel} config={{ path: currentModel }} />;
}
```

---

## 🎯 Presets thématiques

### **Preset Immobilier**
```tsx
export const REAL_ESTATE_PRESET = {
  model: { path: "/3D/house.glb", scale: 1.5 },
  environment: { preset: "city" },
  rotation: { duration: 20 },
};
```

### **Preset Finance**
```tsx
export const FINANCE_PRESET = {
  model: { path: "/3D/coin.glb", scale: 2.0 },
  environment: { preset: "warehouse" },
  lights: {
    ambient: { intensity: 0.7 },
    directional: { intensity: 1.2 },
  },
};
```

### **Preset Sécurité**
```tsx
export const SECURITY_PRESET = {
  model: { path: "/3D/lock.glb", scale: 1.8 },
  environment: { preset: "night" },
  rotation: { duration: 25 },
  float: { speed: 1, floatIntensity: 0.3 },
};
```

### **Preset Mobile**
```tsx
export const MOBILE_PRESET = {
  model: { path: "/3D/phone.glb", scale: 2.5 },
  rotation: { enabled: false },
  float: { enabled: true, speed: 2 },
};
```

---

## 🎬 Animations avancées

### **Animation d'apparition progressive**

```tsx
useGSAP(() => {
  if (!modelRef.current) return;

  // Commence invisible et petit
  gsap.from(modelRef.current.scale, {
    x: 0, y: 0, z: 0,
    duration: 1.5,
    ease: "elastic.out(1, 0.5)",
  });

  gsap.from(modelRef.current, {
    opacity: 0,
    duration: 1,
  });
});
```

### **Animation de "flip" au scroll**

```tsx
scrollTrigger: {
  trigger: "#next-section",
  start: "top bottom",
  end: "center center",
  scrub: true,
  onEnter: () => {
    gsap.to(modelRef.current.rotation, {
      y: Math.PI * 2,  // Tourne 360°
      duration: 1,
    });
  }
}
```

### **Animation de "morphing" (changement de modèle)**

```tsx
const [currentModel, setCurrentModel] = useState("/3D/house.glb");

const changeModel = (newModel: string) => {
  // Fade out
  gsap.to(modelRef.current, {
    opacity: 0,
    scale: 0.5,
    duration: 0.5,
    onComplete: () => {
      setCurrentModel(newModel);
      // Fade in
      gsap.to(modelRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
      });
    }
  });
};
```

---

## 🎨 Palettes de couleurs par thème

### **Immobilier (actuel)**
```tsx
// Couleurs Or
bg-gradient-to-br from-amber-500 to-yellow-600
text-amber-500
border-amber-500/20
```

### **Finance**
```tsx
// Couleurs Vertes (argent)
bg-gradient-to-br from-emerald-500 to-teal-600
text-emerald-500
border-emerald-500/20
```

### **Sécurité**
```tsx
// Couleurs Bleues (confiance)
bg-gradient-to-br from-blue-500 to-cyan-600
text-blue-500
border-blue-500/20
```

### **Tech**
```tsx
// Couleurs Violettes (innovation)
bg-gradient-to-br from-purple-500 to-pink-600
text-purple-500
border-purple-500/20
```

---

## 💡 Idées créatives

### **Landing Page "Timeline"**
Chaque modèle représente une étape du parcours utilisateur :
1. 🏠 House → "Trouvez votre bien"
2. 📄 Papers → "Signez le contrat"
3. 🔒 Lock → "Sécurisez vos données"
4. 💰 Coin → "Recevez vos loyers"
5. 📱 Phone → "Gérez depuis l'app"

### **Landing Page "Services"**
Sections parallaxe avec modèles dédiés :
- **Vitrine** : House (recherche)
- **Gestion** : Tablet (tableau de bord)
- **Maintenance** : Toolbox (interventions)
- **Documents** : Papers (GED)

### **Landing Page "Interactive"**
L'utilisateur clique pour changer de modèle :
```tsx
<button onClick={() => changeModel("/3D/house.glb")}>
  🏠 Immobilier
</button>
<button onClick={() => changeModel("/3D/coin.glb")}>
  💰 Finance
</button>
```

---

**Tous les modèles sont disponibles dans `public/3D/` et prêts à l'emploi !**
