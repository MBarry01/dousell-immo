# 🔧 Dépannage - Landing Page 3D

## ✅ Le serveur est lancé avec succès !

Le serveur Next.js tourne correctement sur **http://localhost:3000**

### 🐛 Si vous voyez "Une erreur est survenue"

Voici les étapes pour résoudre le problème :

---

## 1️⃣ **Vider le cache du navigateur**

### Chrome / Edge
1. Ouvrez la page `/landing-3d`
2. Appuyez sur **Ctrl + Shift + R** (Windows) ou **Cmd + Shift + R** (Mac)
3. Ou : **F12** → Onglet **Network** → Cochez **Disable cache**
4. Rechargez la page avec **F5**

### Firefox
1. Ouvrez la page `/landing-3d`
2. Appuyez sur **Ctrl + Shift + Delete**
3. Sélectionnez "Cache" et cliquez sur "Effacer maintenant"
4. Rechargez la page avec **F5**

---

## 2️⃣ **Vérifier la console du navigateur**

1. Appuyez sur **F12** pour ouvrir les DevTools
2. Allez dans l'onglet **Console**
3. Regardez les erreurs en rouge

### Erreurs courantes et solutions

#### **Error: Can't resolve 'three'**
```bash
# Solution: Réinstaller les dépendances
npm install three @types/three @react-three/fiber @react-three/drei
```

#### **Error: Module not found: Can't resolve 'gsap'**
```bash
# Solution: Réinstaller GSAP
npm install gsap @gsap/react
```

#### **Error: Failed to load /3D/house.glb**
- Vérifiez que le fichier existe : `ls public/3D/house.glb`
- Si manquant, téléchargez un modèle depuis [Kenney](https://kenney.nl/assets) ou [Poly Pizza](https://poly.pizza)

#### **Error: WebGL not supported**
- Votre navigateur ne supporte pas WebGL
- Essayez un navigateur moderne (Chrome, Firefox, Edge)
- Vérifiez que l'accélération matérielle est activée

---

## 3️⃣ **Redémarrer le serveur Next.js**

```bash
# Arrêter tous les serveurs
npx kill-port 3000

# Nettoyer le cache Next.js
rm -rf .next

# Redémarrer
npm run dev
```

Puis ouvrez : **http://localhost:3000/landing-3d**

---

## 4️⃣ **Vérifier les logs du serveur**

Dans votre terminal, vous devriez voir :
```
✓ Ready in X.Xs
GET /landing-3d 200 in Xs
```

Si vous voyez :
```
GET /landing-3d 500 in Xs
```

Cela indique une erreur serveur. Lisez le message d'erreur complet dans le terminal.

---

## 5️⃣ **Tester avec une version simplifiée**

Si le problème persiste, créez une page de test minimaliste :

**Créez** : `app/(vitrine)/test-3d/page.tsx`

```tsx
"use client";

import { Canvas } from "@react-three/fiber";

export default function Test3D() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl mb-8">Test 3D</h1>

      <div className="w-96 h-96 border border-white">
        <Canvas>
          <ambientLight intensity={0.5} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Canvas>
      </div>

      <p className="mt-4">
        Si vous voyez un cube orange, React Three Fiber fonctionne ! ✅
      </p>
    </div>
  );
}
```

**Ouvrez** : http://localhost:3000/test-3d

Si vous voyez un cube orange, le problème vient du modèle 3D ou de la configuration.

---

## 6️⃣ **Vérifier les fichiers requis**

Assurez-vous que tous ces fichiers existent :

```bash
# Vérifier la structure
ls components/3d/HouseModel.tsx
ls components/3d/Scene.tsx
ls components/3d/config.ts
ls components/home/FeaturesStack.tsx
ls components/home/SocialProof.tsx
ls app/(vitrine)/landing-3d/page.tsx
ls public/3D/house.glb
```

Si un fichier manque, référez-vous à la documentation dans [LANDING_3D_SETUP.md](LANDING_3D_SETUP.md).

---

## 7️⃣ **Vérifier les dépendances installées**

```bash
# Liste des packages requis
npm list three
npm list @react-three/fiber
npm list gsap
npm list react-countup
```

Tous devraient afficher une version (pas "UNMET DEPENDENCY").

---

## 8️⃣ **Mode debug : Désactiver la 3D temporairement**

Pour isoler le problème, désactivez temporairement la scène 3D :

**Éditez** : `app/(vitrine)/landing-3d/page.tsx`

```tsx
// Commentez cette ligne :
// <Scene />

// La page devrait s'afficher sans la 3D
```

Si la page fonctionne sans `<Scene />`, le problème vient de la configuration 3D.

---

## 9️⃣ **Erreurs spécifiques**

### **Erreur : "useGLTF is not a function"**
```bash
npm install @react-three/drei@latest
```

### **Erreur : "ScrollTrigger is not defined"**
```bash
npm install gsap@latest
```

### **Erreur : "Canvas is not defined"**
```bash
npm install @react-three/fiber@latest
```

### **Erreur : "Module not found" dans .next/**
```bash
# Nettoyer complètement
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

## 🆘 **Dernière solution : Réinstallation complète**

Si rien ne fonctionne, réinitialisez tout :

```bash
# 1. Arrêter le serveur
npx kill-port 3000

# 2. Nettoyer
rm -rf .next node_modules package-lock.json

# 3. Réinstaller
npm install

# 4. Réinstaller les dépendances 3D
npm install three @types/three @react-three/fiber @react-three/drei
npm install gsap @gsap/react
npm install react-countup react-intersection-observer

# 5. Redémarrer
npm run dev
```

---

## ✅ **Checklist de vérification**

- [ ] Le serveur démarre sans erreur (✓ Ready)
- [ ] http://localhost:3000 fonctionne
- [ ] La console du navigateur n'a pas d'erreur (F12)
- [ ] Le fichier `/public/3D/house.glb` existe
- [ ] Les dépendances sont installées (`npm list three`)
- [ ] Le cache du navigateur est vidé (Ctrl + Shift + R)
- [ ] Le cache Next.js est propre (`rm -rf .next`)

---

## 📞 **Aide supplémentaire**

Si le problème persiste après toutes ces étapes :

1. **Copiez le message d'erreur exact** de la console (F12)
2. **Vérifiez les logs du serveur** dans le terminal
3. **Lisez la documentation** :
   - [LANDING_3D_SETUP.md](LANDING_3D_SETUP.md)
   - [QUICKSTART_3D.md](QUICKSTART_3D.md)
   - [components/3d/README.md](components/3d/README.md)

---

## 🎯 **État actuel du serveur**

Le serveur est actuellement **RUNNING** sur :
- **Local** : http://localhost:3000
- **Landing 3D** : http://localhost:3000/landing-3d

La compilation a réussi (GET /landing-3d 200).

Si vous voyez une erreur dans le navigateur malgré le statut 200, c'est probablement :
1. Un problème de cache navigateur → **Ctrl + Shift + R**
2. Une erreur JavaScript côté client → **F12** pour voir la console
3. Un problème WebGL → Vérifier la compatibilité de votre navigateur

---

**Note** : Le serveur démarre correctement. L'erreur est très probablement côté client (navigateur). Commencez par vider le cache avec **Ctrl + Shift + R**.
