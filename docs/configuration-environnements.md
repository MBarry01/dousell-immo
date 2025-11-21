# Configuration des environnements (Dev + Prod)

## 🎯 Objectif

Configurer Dousell Immo pour fonctionner à la fois en **local** (localhost) et en **production** (en ligne).

## 📁 Structure des fichiers d'environnement

### `.env.local` (Développement local)

Ce fichier est **ignoré par Git** (déjà dans `.gitignore`). Utilisez-le pour vos tests locaux.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# URL de l'application (LOCAL)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variables d'environnement en production

Sur votre plateforme de déploiement (Vercel, Netlify, etc.), configurez :

```env
# Supabase (même que dev)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# URL de l'application (PRODUCTION)
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

## 🔧 Configuration Google OAuth (Une seule fois)

### Dans Google Cloud Console

1. Créez **un seul OAuth Client ID** avec **toutes les URLs** :

   **Authorized JavaScript origins** :
   ```
   http://localhost:3000
   https://votre-domaine.com
   ```

   **Authorized redirect URIs** :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```

2. **Copiez le Client ID et Secret**

### Dans Supabase Dashboard

1. Allez dans **Authentication** → **Providers** → **Google**
2. Entrez le **même Client ID et Secret** (celui qui fonctionne pour localhost ET production)
3. Cliquez sur **Save**

### Dans Supabase → URL Configuration

1. Allez dans **Authentication** → **URL Configuration**
2. **Site URL** : Mettez votre URL de production (`https://votre-domaine.com`)
3. **Redirect URLs** : Ajoutez **toutes** les URLs :
   ```
   http://localhost:3000/**
   https://votre-domaine.com/**
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```

## ✅ Résultat

Avec cette configuration :
- ✅ **En local** : `NEXT_PUBLIC_APP_URL=http://localhost:3000` → OAuth fonctionne
- ✅ **En production** : `NEXT_PUBLIC_APP_URL=https://votre-domaine.com` → OAuth fonctionne
- ✅ **Un seul Client ID Google** pour les deux environnements
- ✅ **Même configuration Supabase** pour les deux environnements

## 🧪 Tester

### En local :
```bash
# Vérifiez .env.local
cat .env.local

# Démarrez le serveur
npm run dev

# Testez sur http://localhost:3000/login
# Cliquez sur "Continuer avec Google"
```

### En production :
1. Déployez avec les bonnes variables d'environnement
2. Testez sur `https://votre-domaine.com/login`
3. Cliquez sur "Continuer avec Google"

## 📝 Notes importantes

- **Ne commitez JAMAIS** `.env.local` (déjà dans `.gitignore`)
- **Changez seulement** `NEXT_PUBLIC_APP_URL` selon l'environnement
- Les autres variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) restent les mêmes
- Le même Client ID Google fonctionne pour localhost ET production si toutes les URLs sont configurées

