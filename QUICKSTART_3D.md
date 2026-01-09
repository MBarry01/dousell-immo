# ⚡ Quickstart - Landing Page 3D

## 🎯 En 3 étapes

### 1️⃣ **Installer & Démarrer** (2 min)
```bash
# Les dépendances sont déjà installées ✅
npm run dev
```

### 2️⃣ **Ouvrir la page** (30 sec)
```
http://localhost:3000/landing-3d
```

### 3️⃣ **Scrollez pour voir la magie** (10 sec)
Faites défiler la page vers le bas et observez la maison 3D se transformer !

---

## 🎨 Personnaliser en 1 minute

### **Changer la couleur du thème**
Fichier : [`app/(vitrine)/landing-3d/page.tsx`](app/(vitrine)/landing-3d/page.tsx)

Chercher et remplacer :
```tsx
// Remplacer "amber" par votre couleur
from-amber-500 to-yellow-600  →  from-blue-500 to-cyan-600
text-amber-500                →  text-blue-500
border-amber-500/20           →  border-blue-500/20
```

### **Changer le modèle 3D**
Fichier : [`components/3d/config.ts`](components/3d/config.ts:14)

```tsx
model: {
  path: "/3D/house.glb",  // ← Changez ici
  scale: 1.5,
}
```

Modèles disponibles dans `public/3D/` :
- `house.glb` 🏠 (par défaut)
- `coin.glb` 💰
- `lock.glb` 🔒
- `phone.glb` 📱
- `tablet.glb` 📱

### **Modifier la vitesse de rotation**
Fichier : [`components/3d/config.ts`](components/3d/config.ts:53)

```tsx
rotation: {
  duration: 20,  // ← 10 = rapide, 30 = lent
}
```

---

## 🎬 Comment ça marche

### **Architecture simple**
```
┌─────────────────────────────────────────┐
│  Page HTML (texte + boutons)           │  ← Z-index 10 (devant)
├─────────────────────────────────────────┤
│  Canvas 3D (maison animée)              │  ← Z-index 0 (derrière)
│  Position: fixed (arrière-plan)         │
└─────────────────────────────────────────┘
```

### **Flow de scroll**
```
Scroll 0%     → Maison tourne sur elle-même
    ↓
Scroll 50%    → Début de la transition
    ↓
Scroll 70%    → Maison se décale à gauche + zoom
    ↓
Scroll 100%   → Section SaaS visible, Features Cards
```

---

## 📁 Fichiers clés

| Fichier | Rôle |
|---------|------|
| [`app/(vitrine)/landing-3d/page.tsx`](app/(vitrine)/landing-3d/page.tsx) | Page principale |
| [`components/3d/Scene.tsx`](components/3d/Scene.tsx) | Canvas 3D (arrière-plan) |
| [`components/3d/HouseModel.tsx`](components/3d/HouseModel.tsx) | Modèle 3D + animations |
| [`components/3d/config.ts`](components/3d/config.ts) | Configuration (modèle, animations, couleurs) |
| [`components/home/FeaturesStack.tsx`](components/home/FeaturesStack.tsx) | Cartes empilées SaaS |
| [`components/home/SocialProof.tsx`](components/home/SocialProof.tsx) | Compteurs animés |

---

## 🚨 Dépannage rapide

### **La page est blanche**
```bash
# Vérifier les erreurs dans la console
# Ouvrir DevTools (F12) → Console
```

### **Le modèle 3D ne charge pas**
```bash
# Vérifier que le fichier existe
ls public/3D/house.glb

# Si erreur, changer le modèle dans config.ts
path: "/3D/coin.glb"  # Tester avec un autre modèle
```

### **Le scroll ne fonctionne pas**
```bash
# Vérifier que l'ID existe dans la page
# Chercher "saas-section" dans landing-3d/page.tsx
```

### **Build échoue**
```bash
# Nettoyer et redémarrer
rm -rf .next
npm run dev
```

---

## 🎯 Exemples de config prêts à l'emploi

### **Mode Performance (Mobile)**
Fichier : [`components/3d/Scene.tsx`](components/3d/Scene.tsx:10)

```tsx
import { HOUSE_3D_PRESETS } from "./config";
const config = HOUSE_3D_PRESETS.mobile;  // ← Ajouter cette ligne
```

### **Mode Showcase (Démo)**
```tsx
const config = HOUSE_3D_PRESETS.showcase;  // Animations exagérées
```

### **Mode Custom**
Fichier : [`components/3d/config.ts`](components/3d/config.ts)

```tsx
export const MY_CUSTOM_CONFIG = {
  model: { path: "/3D/coin.glb", scale: 2 },
  rotation: { duration: 15 },
  float: { enabled: true, speed: 3 },
  // ... votre config
};
```

---

## 📚 Pour aller plus loin

- 📖 [Documentation complète](LANDING_3D_SETUP.md)
- 🔧 [Guide technique](components/3d/README.md)
- 🎨 [Design System](docs/LANDING_3D.md)

---

**Créé en 5 minutes • Prêt pour la prod • 100% personnalisable**
