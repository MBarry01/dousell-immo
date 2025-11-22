# 🔧 Corriger l'Ancien Nom "doussel-immo" → "dousell-immo"

## ❌ Problème

Vous voyez toujours l'erreur 404 avec l'URL `doussel-immo.vercel.app` (ancien nom) au lieu de `dousell-immo.vercel.app` (nouveau nom).

## 🔍 Cause

Supabase ou Google Cloud Console redirige encore vers l'ancienne URL. Il faut remplacer **partout** :
- ❌ `doussel-immo.vercel.app` (ancien nom)
- ✅ `dousell-immo.vercel.app` (nouveau nom)

## ✅ Solution : Corriger dans Supabase

### 📋 Étape 1 : Vérifier et Corriger les Redirect URLs dans Supabase

1. **Allez dans [Supabase Dashboard](https://app.supabase.com)**
2. **Sélectionnez votre projet**
3. **Authentication** → **URL Configuration**

4. **Redirect URLs** : Vérifiez chaque URL dans la liste

   **Si vous voyez :**
   - ❌ `https://doussel-immo.vercel.app/**`
   - ❌ `https://doussel-immo.vercel.app/auth/callback`
   - ❌ `https://doussel-immo.vercel.app/**?code=...`
   
   **Action :**
   - **Supprimez** ces URLs (cliquez sur l'icône poubelle 🗑️ à côté)
   - **Ajoutez** les nouvelles URLs :
     - ✅ `https://dousell-immo.vercel.app/**`
     - ✅ `http://localhost:3000/**`

5. **Site URL** : Vérifiez qu'il contient :
   ```
   https://dousell-immo.vercel.app
   ```
   (Pas `doussel-immo` mais `dousell-immo`)

6. **Cliquez sur "Save"** en bas de la page

### 📋 Étape 2 : Vérifier dans Google Cloud Console

1. **Allez sur [console.cloud.google.com](https://console.cloud.google.com/)**
2. **Sélectionnez le projet** "dousell"
3. **APIs & Services** → **Credentials**
4. **Cliquez sur votre OAuth 2.0 Client ID**

5. **Dans "Authorized redirect URIs"**, vérifiez chaque URI :

   **Si vous voyez :**
   - ❌ `https://doussel-immo.vercel.app/auth/callback`
   
   **Action :**
   - **Supprimez** cette URI (cliquez sur l'icône poubelle 🗑️)
   - **Ajoutez** la nouvelle URI :
     - ✅ `https://dousell-immo.vercel.app/auth/callback`
   
   **Vous devriez avoir exactement :**
   ```
   URI 1: https://VOTRE-PROJET.supabase.co/auth/v1/callback
   URI 2: https://dousell-immo.vercel.app/auth/callback
   URI 3: http://localhost:3000/auth/callback
   ```

6. **Cliquez sur "Save"** en bas de la page

### 📋 Étape 3 : Vérifier la Variable NEXT_PUBLIC_APP_URL sur Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Ouvrez votre projet** "dousell-immo"
3. **Settings** → **Environment Variables**
4. **Trouvez `NEXT_PUBLIC_APP_URL`**

5. **Vérifiez la valeur** :
   - ❌ Si c'est : `https://doussel-immo.vercel.app`
   - ✅ Doit être : `https://dousell-immo.vercel.app`

6. **Si c'est incorrect :**
   - Cliquez sur les **3 points** → **Edit**
   - Remplacez par : `https://dousell-immo.vercel.app`
   - Cliquez sur **Save**

### 📋 Étape 4 : Redéployer sur Vercel

1. **Après avoir modifié les variables**, allez dans **Deployments**
2. **Cliquez sur les 3 points** du dernier déploiement
3. **Cliquez sur "Redeploy"**
4. **Attendez que le déploiement se termine**

### 📋 Étape 5 : Vider le Cache et Tester

1. **Ouvrez votre navigateur** en mode navigation privée (ou videz le cache)
2. **Allez sur** `https://dousell-immo.vercel.app/login`
3. **Cliquez sur "Continuer avec Google"**
4. **Ça devrait fonctionner maintenant ! ✅**

## 📝 Résumé des URLs à Corriger

| Endroit | Ancien (❌) | Nouveau (✅) |
|---------|------------|--------------|
| **Supabase → Site URL** | `https://doussel-immo.vercel.app` | `https://dousell-immo.vercel.app` |
| **Supabase → Redirect URLs** | `https://doussel-immo.vercel.app/**` | `https://dousell-immo.vercel.app/**` |
| **Google Cloud → Redirect URIs** | `https://doussel-immo.vercel.app/auth/callback` | `https://dousell-immo.vercel.app/auth/callback` |
| **Vercel → NEXT_PUBLIC_APP_URL** | `https://doussel-immo.vercel.app` | `https://dousell-immo.vercel.app` |

## ✅ Checklist de Vérification

- [ ] **Supabase → Site URL** = `https://dousell-immo.vercel.app`
- [ ] **Supabase → Redirect URLs** contient `https://dousell-immo.vercel.app/**` (sans `doussel`)
- [ ] **Supabase → Redirect URLs** ne contient **plus** `https://doussel-immo.vercel.app/**`
- [ ] **Google Cloud → Redirect URIs** contient `https://dousell-immo.vercel.app/auth/callback` (sans `doussel`)
- [ ] **Google Cloud → Redirect URIs** ne contient **plus** `https://doussel-immo.vercel.app/auth/callback`
- [ ] **Vercel → NEXT_PUBLIC_APP_URL** = `https://dousell-immo.vercel.app` (sans `doussel`)
- [ ] **Projet redéployé** sur Vercel après modification des variables

## 🆘 Si le Problème Persiste

### Vérifier dans les Logs Supabase

1. **Dans Supabase Dashboard** → **Logs** → **Auth Logs**
2. **Regardez les dernières tentatives de connexion**
3. **Vérifiez les URLs** dans les logs - elles devraient montrer `dousell-immo` (pas `doussel-immo`)

### Vérifier le Cache du Navigateur

Parfois le navigateur met en cache les anciennes URLs :

1. **Ouvrez en mode navigation privée** (Ctrl+Shift+N)
2. **Ou videz le cache** du navigateur (Ctrl+Shift+Delete)
3. **Réessayez**

### Attendre la Propagation

Après avoir modifié les configurations :
- **Attendez 1-2 minutes** pour la propagation
- **Redéployez** sur Vercel
- **Réessayez**

## 🎉 Résultat Attendu

Après avoir corrigé tous les endroits :

- ✅ L'authentification Google fonctionne
- ✅ Plus d'erreur 404
- ✅ L'URL dans l'erreur est maintenant `dousell-immo.vercel.app` (avec deux 'l')

