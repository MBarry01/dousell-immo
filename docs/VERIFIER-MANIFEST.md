# Guide : Vérifier que le manifest.json est correct

## ✅ Vérification rapide (5 méthodes)

### 1. **Vérification dans le navigateur (Chrome/Edge)**

1. Ouvrez votre site : `http://localhost:3000` (ou votre URL de production)
2. Ouvrez les **DevTools** (F12)
3. Allez dans l'onglet **Application** (ou **Manifest** dans certains navigateurs)
4. Dans le menu de gauche, cliquez sur **Manifest**
5. Vérifiez que :
   - ✅ Le manifest est chargé sans erreur
   - ✅ Les icônes sont visibles (192x192 et 512x512)
   - ✅ `background_color: #05080c`
   - ✅ `display: standalone`
   - ✅ `purpose: "any"` pour les icônes

**Capture d'écran attendue** :
```
Name: Dousell Immo
Short name: Dousell
Start URL: /
Display: standalone
Theme color: #05080c
Background color: #05080c
Icons: 2 icons
```

### 2. **Vérification avec Lighthouse (Recommandé)**

1. Ouvrez votre site dans Chrome
2. Ouvrez les **DevTools** (F12)
3. Allez dans l'onglet **Lighthouse**
4. Cochez **Progressive Web App**
5. Cliquez sur **Analyze page load**
6. Vérifiez la section **PWA** :
   - ✅ Manifest valide
   - ✅ Icônes correctes
   - ✅ Service Worker actif (en production)

**Score attendu** : 100/100 pour la section PWA

### 3. **Validation JSON en ligne**

1. Allez sur : https://jsonlint.com/
2. Copiez le contenu de `public/manifest.json`
3. Collez-le dans l'éditeur
4. Cliquez sur **Validate JSON**
5. Vérifiez qu'il n'y a **aucune erreur**

### 4. **Validation PWA avec PWA Builder**

1. Allez sur : https://www.pwabuilder.com/
2. Entrez votre URL (ex: `https://dousell-immo.app`)
3. Cliquez sur **Start**
4. Vérifiez les résultats :
   - ✅ Manifest valide
   - ✅ Icônes présentes
   - ✅ Service Worker (si déployé)

### 5. **Vérification manuelle du fichier**

Ouvrez `public/manifest.json` et vérifiez :

```json
{
  "name": "Dousell Immo",                    // ✅ Nom complet
  "short_name": "Dousell",                    // ✅ Nom court (max 12 caractères)
  "description": "...",                       // ✅ Description présente
  "start_url": "/",                          // ✅ URL de démarrage
  "display": "standalone",                    // ✅ Mode standalone (pas "browser")
  "background_color": "#05080c",              // ✅ Fond noir (évite les bords blancs)
  "theme_color": "#05080c",                  // ✅ Thème noir
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"                        // ✅ "any" (pas "maskable")
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"                        // ✅ "any" (pas "maskable")
    }
  ]
}
```

## 🔍 Points critiques à vérifier

### ✅ Configuration pour éviter les bords blancs

| Propriété | Valeur attendue | Pourquoi |
|-----------|----------------|----------|
| `background_color` | `#05080c` | Fond noir pour éviter les bords blancs sur iOS |
| `display` | `standalone` | Mode application (pas "browser") |
| `purpose` | `"any"` | Icônes non adaptatives (pas "maskable") |

### ✅ Vérification des icônes

1. **Vérifiez que les fichiers existent** :
   ```bash
   ls public/icons/icon-192.png
   ls public/icons/icon-512.png
   ```

2. **Vérifiez les dimensions** :
   - Ouvrez les fichiers dans un éditeur d'images
   - `icon-192.png` doit être exactement **192x192 pixels**
   - `icon-512.png` doit être exactement **512x512 pixels**

3. **Vérifiez le fond** :
   - Les icônes doivent avoir un **fond opaque** (pas transparent)
   - Le fond doit être `#05080c` (noir Dousell)

## 🧪 Test rapide en ligne de commande

### Vérifier la syntaxe JSON

```bash
# Windows PowerShell
Get-Content public/manifest.json | ConvertFrom-Json

# Linux/Mac
cat public/manifest.json | python -m json.tool
```

Si aucune erreur n'apparaît, le JSON est valide.

### Vérifier que le manifest est accessible

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester l'URL
curl http://localhost:3000/manifest.json
```

Vous devriez voir le contenu JSON du manifest.

## 🐛 Problèmes courants

### ❌ Erreur : "Manifest not found"

**Solution** :
1. Vérifiez que le fichier est dans `public/manifest.json`
2. Vérifiez que `app/layout.tsx` contient : `manifest: "/manifest.json"`
3. Redémarrez le serveur de développement

### ❌ Erreur : "Icon not found"

**Solution** :
1. Vérifiez que les fichiers existent dans `public/icons/`
2. Vérifiez que les chemins dans le manifest sont corrects : `/icons/icon-192.png`
3. Vérifiez que les fichiers ne sont pas corrompus

### ❌ Erreur : "Invalid JSON"

**Solution** :
1. Utilisez un validateur JSON en ligne
2. Vérifiez les virgules (pas de virgule après le dernier élément)
3. Vérifiez les guillemets (doivent être doubles `"`)

### ❌ Icônes avec bords blancs sur iOS

**Solution** :
1. Utilisez le générateur : `http://localhost:3000/generate-icons.html`
2. Régénérez les icônes avec fond opaque `#05080c`
3. Remplacez les fichiers dans `public/icons/`
4. Videz le cache du navigateur

## 📱 Test sur mobile

### iOS (Safari)

1. Ouvrez Safari sur iPhone/iPad
2. Allez sur votre site
3. Appuyez sur **Partager** (carré avec flèche)
4. Sélectionnez **Sur l'écran d'accueil**
5. Vérifiez l'icône :
   - ✅ Pas de bords blancs
   - ✅ Fond noir uniforme
   - ✅ Logo centré et visible

### Android (Chrome)

1. Ouvrez Chrome sur Android
2. Allez sur votre site
3. Menu (3 points) > **Ajouter à l'écran d'accueil**
4. Vérifiez l'icône :
   - ✅ Pas de bords blancs
   - ✅ Fond noir uniforme
   - ✅ Logo centré et visible

## ✅ Checklist finale

Avant de déployer, vérifiez :

- [ ] Le manifest.json est valide (pas d'erreur JSON)
- [ ] `background_color: "#05080c"` est présent
- [ ] `display: "standalone"` est présent
- [ ] `purpose: "any"` pour toutes les icônes
- [ ] Les fichiers `icon-192.png` et `icon-512.png` existent
- [ ] Les icônes ont les bonnes dimensions (192x192 et 512x512)
- [ ] Les icônes ont un fond opaque (pas transparent)
- [ ] Le manifest est accessible via `/manifest.json`
- [ ] Lighthouse PWA score = 100/100
- [ ] Test sur iOS : pas de bords blancs
- [ ] Test sur Android : pas de bords blancs

## 🔗 Outils utiles

- **JSONLint** : https://jsonlint.com/ (validation JSON)
- **PWA Builder** : https://www.pwabuilder.com/ (validation PWA complète)
- **Manifest Validator** : https://manifest-validator.appspot.com/ (validation manifest)
- **Lighthouse** : Intégré dans Chrome DevTools (audit PWA)

## 📚 Références

- [MDN - Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [W3C - Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Google - PWA Checklist](https://web.dev/pwa-checklist/)

