# 🚀 Configuration GitHub Pages pour Dousell Immo

## ⚠️ Limitation importante

**GitHub Pages supporte uniquement des sites statiques.** 

Votre projet Next.js utilise des fonctionnalités serveur (Server Actions, API routes, Supabase Auth) qui ne fonctionneront **PAS** sur GitHub Pages.

### ❌ Fonctionnalités qui ne fonctionneront PAS :
- Server Actions (authentification, inscription, connexion)
- API Routes (`/auth/callback`, etc.)
- Server Components dynamiques
- Fonctionnalités Supabase côté serveur

### ✅ Fonctionnalités qui fonctionneront :
- Pages statiques (accueil, biens, etc.)
- Client Components (UI, animations)
- Navigation entre pages
- Images et assets statiques

## 🎯 Alternative recommandée : Vercel

Pour un projet Next.js complet, **Vercel est la meilleure option** :
- ✅ Supporte toutes les fonctionnalités Next.js
- ✅ Déploiement automatique depuis GitHub
- ✅ Gratuit pour les projets open source
- ✅ Configuration simple (détecte automatiquement Next.js)

👉 [Déployer sur Vercel](https://vercel.co          m/new)

## 📋 Configuration GitHub Pages (si vous insistez)

Si vous voulez quand même utiliser GitHub Pages (avec des limitations), suivez ces étapes :

### 1. Activer GitHub Pages dans le dépôt

1. Allez sur **Settings** → **Pages**
2. **Source** : Sélectionnez **GitHub Actions**
3. Cliquez sur **Save**

### 2. Configurer les secrets GitHub

Allez sur **Settings** → **Secrets and variables** → **Actions** et ajoutez :

- `NEXT_PUBLIC_SUPABASE_URL` : Votre URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Votre clé anonyme Supabase
- `NEXT_PUBLIC_APP_URL` : `https://mbarry01.github.io/dousel-immo`

### 3. Déclencher le déploiement

1. Allez sur **Actions** dans votre dépôt
2. Sélectionnez le workflow **Deploy to GitHub Pages**
3. Cliquez sur **Run workflow** → **Run workflow**

### 4. Votre site sera disponible sur

```
https://mbarry01.github.io/dousel-immo
```

## 🔧 Fichiers créés

- `.github/workflows/deploy.yml` : Workflow GitHub Actions
- `next.config.ts` : Configuration Next.js pour GitHub Pages

## 📝 Notes

- Le workflow se déclenche automatiquement à chaque push sur `master`
- Le build peut prendre 2-5 minutes
- Les modifications sont visibles après le déploiement (1-2 minutes)

## ⚠️ Problèmes connus

1. **Les formulaires d'authentification ne fonctionneront pas** (Server Actions requis)
2. **L'authentification Google OAuth ne fonctionnera pas** (API routes requis)
3. **Les fonctionnalités admin ne fonctionneront pas** (Server Components requis)

## 🎯 Solution : Utiliser Vercel

Pour un déploiement complet sans limitations, utilisez **Vercel** :

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez votre compte GitHub
3. Importez le dépôt `dousel-immo`
4. Ajoutez les variables d'environnement
5. Déployez ! 🚀

C'est gratuit et tout fonctionne ! ✨

