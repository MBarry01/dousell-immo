# ✅ Ajouter l'URL Vercel dans Supabase Redirect URLs

## 🎯 Action Immédiate Requise

Dans Supabase, vous avez seulement `http://localhost:3000/**` dans les Redirect URLs. Il faut ajouter l'URL Vercel.

## 📋 Étapes à Suivre

### Étape 1 : Dans Supabase Dashboard

1. **Vous êtes déjà dans** **Authentication** → **URL Configuration**
2. **Section "URL de redirection"** : Vous voyez seulement `http://localhost:3000/**`
3. **Cliquez sur le bouton vert** : **"Ajouter une URL"** (en bas de la liste)
4. **Dans le champ qui apparaît**, entrez exactement :
   ```
   https://dousell-immo.vercel.app/**
   ```
   ⚠️ **Important :**
   - Avec `https://` (pas `http://`)
   - Avec `dousell-immo` (deux 'l', pas `doussel`)
   - Avec `/**` à la fin (les deux étoiles sont importantes)
   - Pas d'espace avant/après

5. **Cliquez sur "Enregistrer les modifications"** (ou le bouton Save en bas)

### Étape 2 : Vérifier Site URL

Assurez-vous que le **"URL du site"** (Site URL) est bien :
```
https://dousell-immo.vercel.app
```

⚠️ **Important :**
- Complétez l'URL si elle est tronquée (elle devrait finir par `.vercel.app`)
- Pas de `/**` à la fin pour le Site URL (seulement pour Redirect URLs)

### Étape 3 : Résultat Attendu

Après avoir ajouté, vous devriez voir dans **Redirect URLs** :

1. ✅ `http://localhost:3000/**` (pour développement local)
2. ✅ `https://dousell-immo.vercel.app/**` (pour production Vercel) ← **NOUVEAU**

## 📝 Checklist Finale

Après avoir ajouté l'URL :

- [ ] **Supabase → Site URL** = `https://dousell-immo.vercel.app` (complet, pas tronqué)
- [ ] **Supabase → Redirect URLs** contient `http://localhost:3000/**`
- [ ] **Supabase → Redirect URLs** contient `https://dousell-immo.vercel.app/**` ← **À AJOUTER**
- [ ] **Google Cloud → Redirect URIs** contient `https://dousell-immo.vercel.app/auth/callback` ✅ (déjà fait)
- [ ] **Vercel → NEXT_PUBLIC_APP_URL** = `https://dousell-immo.vercel.app` ✅ (à vérifier)

## 🧪 Tester Après Modification

1. **Attendez 30 secondes** pour que Supabase enregistre la modification
2. **Ouvrez votre navigateur** en mode navigation privée (Ctrl+Shift+N)
3. **Allez sur** `https://dousell-immo.vercel.app/login`
4. **Cliquez sur "Continuer avec Google"**
5. **Ça devrait fonctionner maintenant ! ✅**

## 🆘 Si ça ne Fonctionne Toujours Pas

### Vérifier Vercel Environment Variables

1. **Allez dans Vercel** → **Settings** → **Environment Variables**
2. **Vérifiez que `NEXT_PUBLIC_APP_URL`** = `https://dousell-immo.vercel.app`
3. **Si ce n'est pas le cas**, modifiez-la et **redéployez**

### Vérifier le Cache

Parfois le navigateur ou Supabase met en cache les anciennes configurations :

1. **Attendez 1-2 minutes** après modification
2. **Ouvrez en mode navigation privée**
3. **Réessayez**

### Vérifier les Logs Supabase

1. **Dans Supabase Dashboard** → **Logs** → **Auth Logs**
2. **Regardez les dernières tentatives de connexion**
3. **Vérifiez les URLs** utilisées dans les logs

