# Workflow de Déploiement

## ✅ Checklist avant de pousser sur GitHub

Avant de pousser vos changements, **toujours** vérifier que le build passe localement :

### 1. Vérifier le build localement

```bash
npm run build
```

**Important :** Si le build échoue localement, il échouera aussi sur Vercel. Corrigez les erreurs avant de pousser.

### 2. Vérifier les erreurs TypeScript

Le build Next.js vérifie automatiquement les erreurs TypeScript. Si vous voyez des erreurs comme :

```
Failed to compile.
./path/to/file.tsx:XX:XX
Type error: ...
```

Corrigez-les avant de pousser.

### 3. Vérifier les erreurs de linting (optionnel mais recommandé)

```bash
npm run lint
```

### 4. Pousser seulement si le build réussit

```bash
git add .
git commit -m "votre message"
git push
```

## 🚀 Workflow recommandé

1. **Faire vos modifications**
2. **Tester localement** : `npm run dev`
3. **Vérifier le build** : `npm run build`
4. **Si le build réussit** : `git add . && git commit -m "..." && git push`
5. **Si le build échoue** : Corriger les erreurs et recommencer à l'étape 3

## 🔍 Vérifier le déploiement Vercel

Après avoir poussé :

1. Allez sur https://vercel.com/dashboard
2. Vérifiez que le nouveau déploiement est en cours
3. Vérifiez les logs si le déploiement échoue
4. Le commit déployé doit correspondre à votre dernier commit local

## ⚠️ Erreurs courantes

### Build échoue avec des erreurs TypeScript
- **Solution** : Corrigez les erreurs TypeScript localement avant de pousser
- **Commande** : `npm run build` pour voir les erreurs

### Vercel utilise un ancien commit
- **Solution** : Créez un commit vide pour forcer un nouveau déploiement
- **Commande** : `git commit --allow-empty -m "chore: forcer déploiement" && git push`

### Variables d'environnement manquantes
- **Solution** : Vérifiez que toutes les variables sont configurées dans Vercel
- **Dashboard** : Settings → Environment Variables

## 📝 Scripts disponibles

- `npm run build` - Build de production (vérifie TypeScript)
- `npm run lint` - Vérifie le code avec ESLint
- `npm run dev` - Démarre le serveur de développement
- `npm run prepush` - Build avant de pousser (vérification)













