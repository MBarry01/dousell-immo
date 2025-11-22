# 🔧 Corriger l'erreur 404 "DEPLOYMENT_NOT_FOUND" sur Vercel

## ❌ Problème

Vous voyez l'erreur **"404 : INTROUVABLE - DEPLOYMENT_NOT_FOUND"** après avoir ajouté la variable `NEXT_PUBLIC_APP_URL`.

## 🔍 Cause

L'URL dans `NEXT_PUBLIC_APP_URL` ne correspond pas à l'URL réelle de votre projet Vercel. Vercel génère automatiquement une URL pour chaque projet, et elle peut être différente de ce que vous pensez.

## ✅ Solution Étape par Étape

### 📋 Étape 1 : Trouver la VRAIE URL de votre projet Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** à votre compte
3. **Ouvrez votre projet** (probablement dans la liste "Projects")
4. **Regardez l'URL affichée** en haut du tableau de bord
   - Elle devrait être quelque chose comme : `https://dousell-immo-XXXXX.vercel.app`
   - OU : `https://dousell-immo.vercel.app`
   - OU : `https://doussel-immo-XXXXX.vercel.app` (ancien nom)

### 📋 Étape 2 : Vérifier le Nom du Projet

1. **Dans Vercel**, allez dans **Settings** → **General**
2. **Trouvez "Project Name"**
3. **Notez le nom exact** (peut-être "doussel-immo" ou "dousell-immo")

### 📋 Étape 3 : Vérifier/Corriger la Variable NEXT_PUBLIC_APP_URL

1. **Dans Vercel**, allez dans **Settings** → **Environment Variables**
2. **Trouvez `NEXT_PUBLIC_APP_URL`**
3. **Cliquez sur les 3 points** → **Edit**
4. **Remplacez la valeur** par l'URL **EXACTE** que vous avez trouvée à l'étape 1

**Exemples :**
- Si votre projet s'appelle `dousell-immo` : `https://dousell-immo.vercel.app`
- Si votre projet s'appelle `doussel-immo` : `https://doussel-immo.vercel.app`
- Si vous avez un nom personnalisé : `https://votre-nom-personnalise.vercel.app`

5. **Cliquez sur "Save"**

### 📋 Étape 4 : Redéployer le Projet

1. **Après avoir modifié la variable**, allez dans **Deployments**
2. **Trouvez le dernier déploiement**
3. **Cliquez sur les 3 points** → **Redeploy**
4. **Attendez que le redéploiement se termine**

### 📋 Étape 5 : Mettre à Jour Supabase

1. **Allez dans [Supabase Dashboard](https://app.supabase.com)**
2. **Authentication** → **URL Configuration**
3. **Site URL** : Mettez l'URL **EXACTE** de Vercel (celle que vous avez trouvée)
4. **Redirect URLs** : Assurez-vous d'avoir :
   - `https://VOTRE-URL-VERCEL/**` (avec l'URL exacte)
   - `http://localhost:3000/**` (pour développement)

5. **Cliquez sur "Save"**

### 📋 Étape 6 : Mettre à Jour Google Cloud Console (si vous utilisez OAuth)

1. **Allez sur [console.cloud.google.com](https://console.cloud.google.com/)**
2. **APIs & Services** → **Credentials**
3. **Cliquez sur votre OAuth Client ID**
4. **Dans "Authorized redirect URIs"**, vérifiez que vous avez :
   - `https://VOTRE-PROJET.supabase.co/auth/v1/callback` (obligatoire)
   - `https://VOTRE-URL-VERCEL/auth/callback` (avec l'URL exacte de Vercel)

5. **Cliquez sur "Save"**

## 🧪 Tester

1. **Allez sur l'URL de votre projet Vercel** (celle que vous avez trouvée)
2. **Allez sur `/login`**
3. **Essayez de vous connecter avec Google**
4. **Ça devrait fonctionner maintenant ! ✅**

## 📝 Notes Importantes

- ⚠️ **L'URL doit être EXACTE** : Vérifiez qu'il n'y a pas d'espace, pas de slash final
- ✅ **Le nom du projet** dans Vercel détermine l'URL (si vous n'avez pas de domaine personnalisé)
- ✅ **Si vous renommez le projet** dans Vercel, l'URL change automatiquement
- ✅ **Les variables d'environnement** doivent être mises à jour si l'URL change

## 🔍 Comment Vérifier que c'est la Bonne URL

1. **Dans Vercel**, allez dans **Deployments**
2. **Cliquez sur un déploiement réussi**
3. **En haut, vous verrez l'URL** du déploiement
4. **C'est cette URL** que vous devez utiliser dans `NEXT_PUBLIC_APP_URL`

## 🆘 Si le Problème Persiste

1. **Vérifiez que le projet est bien déployé** :
   - Allez dans **Deployments**
   - Vérifiez qu'il y a un déploiement avec le statut "Ready"

2. **Vérifiez les logs Vercel** :
   - Allez dans **Deployments** → Cliquez sur un déploiement
   - Ouvrez les **Build Logs** et **Runtime Logs**
   - Cherchez les erreurs

3. **Vérifiez que GitHub est bien connecté** :
   - Allez dans **Settings** → **Git**
   - Vérifiez que le repository est bien connecté

