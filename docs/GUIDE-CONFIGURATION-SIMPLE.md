# 🚀 Guide Simple : Configurer pour Local + Production

## 📝 En résumé

Vous devez configurer **3 endroits** pour que ça fonctionne en local ET en production :

1. ✅ **Google Cloud Console** (une seule fois)
2. ✅ **Supabase Dashboard** (une seule fois)  
3. ✅ **Variables d'environnement** (différentes pour local/prod)

---

## 🎯 Étape 1 : Google Cloud Console (Une seule fois)

### 1.1 Créer un projet

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Cliquez sur le menu déroulant en haut (à côté de "Google Cloud")
3. Cliquez sur **"New Project"**
4. Donnez un nom : "Doussel Immo" (ou autre)
5. Cliquez sur **"Create"**

### 1.2 Configurer l'écran de consentement OAuth

1. Allez dans **APIs & Services** → **OAuth consent screen** (dans le menu de gauche)
2. Sélectionnez **External** (pour les tests, vous pouvez changer en Internal plus tard)
3. Cliquez sur **Create**

**Remplissez le formulaire :**
- **App name** : `Doussel Immo`
- **User support email** : Votre email
- **Developer contact information** : Votre email
- Cliquez sur **Save and Continue**

**Scopes (Étape importante) :**
4. Sur la page "Scopes", cliquez sur **"Add or Remove Scopes"**
5. Cochez ces scopes :
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
6. Cliquez sur **Update** puis **Save and Continue**

**Test users (si vous êtes en mode External) :**
7. Ajoutez votre email dans "Test users"
8. Cliquez sur **Save and Continue**

### 1.3 Créer l'OAuth Client ID

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur **+ Create Credentials** → **OAuth client ID**
3. Si c'est la première fois, vous devrez d'abord configurer l'écran de consentement (voir étape 1.2)

4. **Application type** : Sélectionnez **Web application**
5. **Name** : `Doussel Immo`

**Authorized JavaScript origins** :
- Dans le **premier champ (URI 1)**, entrez :
  ```
  http://localhost:3000
  ```
*(Ajoutez votre domaine plus tard quand vous l'aurez)*

**Authorized redirect URIs** :
⚠️ **IMPORTANT** : Chaque URL doit être dans un **champ séparé** !

1. Dans le **premier champ (URI 1)**, entrez :
   ```
   https://Dousell-immo.supabase.co/auth/v1/callback
   ```
   *(Remplacez "Dousell-immo" par le nom de VOTRE projet Supabase)*

2. Cliquez sur le bouton **"+ Ajouter un URI"** (en bas du premier champ)

3. Un **deuxième champ (URI 2)** apparaît, entrez :
   ```
   http://localhost:3000/auth/callback
   ```

**Résultat** : Vous devriez avoir **2 champs séparés**, pas une seule URL avec un espace !
*(Ajoutez `https://votre-domaine.com/auth/callback` dans un 3ème champ plus tard)*

6. Cliquez sur **Create**
7. **Copiez le Client ID et le Client Secret** → Vous en aurez besoin pour Supabase

---

## 🎯 Étape 2 : Supabase Dashboard (Une seule fois)

### Configurez Google OAuth

1. Allez dans votre projet Supabase
2. **Authentication** → **Providers** → **Google**
3. Activez le toggle **Enable Google provider**
4. Collez le **Client ID** (celui de Google Cloud)
5. Collez le **Client Secret** (celui de Google Cloud)
6. Cliquez sur **Save**

### Configurez les URLs autorisées

1. **Authentication** → **URL Configuration**
2. **Site URL** : Mettez `http://localhost:3000` pour l'instant
   *(Vous changerez en `https://votre-domaine.com` plus tard)*

3. **Redirect URLs** : Ajoutez ces URLs :
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
   *(Ajoutez les URLs de production plus tard)*

---

## 🎯 Étape 3 : Variables d'environnement

### Pour le développement local (`.env.local`)

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important** : Remplacez `votre-projet` par le nom réel de votre projet Supabase !

---

## ✅ Tester en local (MAINTENANT)

1. **Vérifiez que `.env.local` existe** avec les bonnes valeurs
2. **Démarrez le serveur** :
   ```bash
   npm run dev
   ```
3. **Allez sur** `http://localhost:3000/login`
4. **Cliquez sur "Continuer avec Google"**
5. **Ça devrait fonctionner ! ✅**

---

## 🚀 Quand vous aurez un domaine (Plus tard)

### Dans Google Cloud Console

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur votre OAuth Client ID
3. Dans **Authorized JavaScript origins**, ajoutez :
   ```
   https://votre-domaine.com
   ```
4. Dans **Authorized redirect URIs**, ajoutez :
   ```
   https://votre-domaine.com/auth/callback
   ```
5. Cliquez sur **Save**

### Dans Supabase Dashboard

1. **Authentication** → **URL Configuration**
2. **Site URL** : Changez en `https://votre-domaine.com`
3. **Redirect URLs** : Ajoutez :
   ```
   https://votre-domaine.com/**
   https://votre-domaine.com/auth/callback
   ```

### Variables d'environnement en production

Sur votre plateforme de déploiement (Vercel, Netlify, etc.) :
```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

---

## 📋 Checklist pour commencer (Sans domaine)

- [ ] Google Cloud Console : Projet créé
- [ ] Google Cloud Console : OAuth consent screen configuré avec scopes (email, profile, openid)
- [ ] Google Cloud Console : OAuth Client ID créé avec `http://localhost:3000`
- [ ] Supabase : Google provider activé avec Client ID et Secret
- [ ] Supabase : Site URL = `http://localhost:3000`
- [ ] Supabase : Redirect URLs avec `http://localhost:3000/**`
- [ ] `.env.local` créé avec `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Test : `npm run dev` → `/login` → "Continuer avec Google" fonctionne ✅

**C'est tout pour commencer ! 🎉**

---

## 🐛 Si ça ne marche pas

### Erreur "redirect_uri_mismatch"
- Vérifiez que `http://localhost:3000/auth/callback` est dans Google Cloud Console
- Vérifiez que `NEXT_PUBLIC_APP_URL=http://localhost:3000` dans `.env.local`
- **Redémarrez le serveur** après avoir modifié `.env.local`

### Erreur "invalid_client"
- Vérifiez que le Client ID et Secret dans Supabase sont les mêmes que dans Google Cloud Console
- Pas d'espaces avant/après les valeurs

### "Scopes" introuvables
- Les scopes se trouvent dans **APIs & Services** → **OAuth consent screen**
- Cliquez sur "Add or Remove Scopes" pour les voir
- Cochez : `email`, `profile`, `openid`
