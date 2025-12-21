# 🚀 Guide de Déploiement sur Vercel

## 📋 Prérequis

1. ✅ Code testé localement (`npm run build` passe sans erreur)
2. ✅ Projet Git initialisé et poussé sur GitHub/GitLab/Bitbucket
3. ✅ Compte Vercel créé ([vercel.com](https://vercel.com))

---

## 🎯 Étape 1 : Préparer le code

### 1.1 Vérifier que tout est commité

```bash
# Vérifier l'état
git status

# Si des fichiers sont modifiés, les ajouter et commiter
git add .
git commit -m "Préparation pour déploiement Vercel"
```

### 1.2 Pousser sur votre dépôt distant

```bash
# Si vous n'avez pas encore de remote
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git

# Pousser le code
git push -u origin main
# ou
git push -u origin master
```

---

## 🎯 Étape 2 : Connecter le projet à Vercel

### Option A : Via l'interface Vercel (Recommandé)

1. **Allez sur [vercel.com](https://vercel.com)** et connectez-vous
2. Cliquez sur **"Add New..."** → **"Project"**
3. **Importez votre dépôt Git** :
   - Si c'est la première fois, autorisez Vercel à accéder à GitHub/GitLab
   - Sélectionnez votre dépôt `Doussel_immo`
4. **Configuration du projet** :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `./` (laisser par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)
   - **Install Command** : `npm install` (par défaut)

### Option B : Via la CLI Vercel

```bash
# Installer la CLI Vercel
npm i -g vercel

# Se connecter
vercel login

# Déployer (dans le dossier du projet)
vercel

# Suivre les instructions
```

---

## 🎯 Étape 3 : Configurer les Variables d'Environnement

### 3.1 Dans le Dashboard Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur **"Settings"** → **"Environment Variables"**
3. Ajoutez **TOUTES** ces variables :

#### Variables Supabase (OBLIGATOIRES)

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

> 💡 **Où trouver ces valeurs ?**
> - Allez dans votre projet Supabase
> - **Settings** → **API**
> - Copiez l'**URL** et la clé **anon public**

#### Variable URL de l'application

```env
NEXT_PUBLIC_APP_URL=https://votre-projet.vercel.app
```

> ⚠️ **Important** : Remplacez `votre-projet.vercel.app` par votre **vraie URL Vercel** (vous la verrez après le premier déploiement)

#### Variables optionnelles (si utilisées)

```env
# Turnstile (Captcha)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre-site-key

# Resend (Email)
RESEND_API_KEY=votre-resend-key

# Paydunya (Paiement)
PAYDUNYA_PUBLIC_KEY=votre-public-key
PAYDUNYA_PRIVATE_KEY=votre-private-key
PAYDUNYA_MASTER_KEY=votre-master-key
PAYDUNYA_TOKEN=votre-token
```

### 3.2 Sélectionner les environnements

Pour chaque variable, sélectionnez :
- ✅ **Production**
- ✅ **Preview** (optionnel, pour les branches)
- ✅ **Development** (optionnel)

### 3.3 Sauvegarder

Cliquez sur **"Save"** après avoir ajouté toutes les variables.

---

## 🎯 Étape 4 : Déclencher le Déploiement

### Option A : Via l'interface (Automatique)

1. Après avoir configuré les variables, Vercel va **automatiquement** :
   - Détecter le push sur votre branche `main`/`master`
   - Lancer le build
   - Déployer l'application

2. **OU** cliquez manuellement sur **"Deployments"** → **"Redeploy"**

### Option B : Via Git (Recommandé)

```bash
# Faire un push pour déclencher le déploiement
git push origin main
```

Vercel détectera automatiquement le push et lancera un nouveau déploiement.

---

## 🎯 Étape 5 : Vérifier le Déploiement

### 5.1 Suivre le build en temps réel

1. Allez dans l'onglet **"Deployments"** de votre projet Vercel
2. Cliquez sur le déploiement en cours
3. Surveillez les logs du build

### 5.2 Vérifier que le build passe

✅ **Build réussi** : Vous verrez "Build Completed"
❌ **Build échoué** : Vérifiez les logs d'erreur

### 5.3 Accéder à votre site

Une fois le déploiement terminé :
- **URL de production** : `https://votre-projet.vercel.app`
- Cliquez sur **"Visit"** dans le dashboard Vercel

---

## 🎯 Étape 6 : Configurer Supabase pour la Production

### 6.1 Mettre à jour les URLs dans Supabase

1. Allez dans votre projet **Supabase Dashboard**
2. **Authentication** → **URL Configuration**
3. **Site URL** : Mettez votre URL Vercel
   ```
   https://votre-projet.vercel.app
   ```
4. **Redirect URLs** : Ajoutez (avec "+ Add URL") :
   ```
   https://votre-projet.vercel.app/**
   https://votre-projet.vercel.app/auth/callback
   ```
5. Cliquez sur **"Save"**

### 6.2 Mettre à jour Google OAuth (si utilisé)

1. Allez dans **Google Cloud Console**
2. **APIs & Services** → **Credentials**
3. Sélectionnez votre OAuth Client ID
4. **Authorized JavaScript origins** : Ajoutez
   ```
   https://votre-projet.vercel.app
   ```
5. **Authorized redirect URIs** : Ajoutez
   ```
   https://votre-projet.vercel.app/auth/callback
   ```
6. Cliquez sur **"Save"**

---

## 🎯 Étape 7 : Tester en Production

### 7.1 Tests de base

1. ✅ Accéder à la page d'accueil
2. ✅ Tester la navigation
3. ✅ Tester l'authentification (login/signup)
4. ✅ Tester Google OAuth (si configuré)
5. ✅ Tester les fonctionnalités principales

### 7.2 Vérifier les logs

Si quelque chose ne fonctionne pas :
1. Allez dans **Vercel Dashboard** → **Deployments**
2. Cliquez sur le déploiement
3. Consultez les **"Function Logs"** pour les erreurs

---

## 🔧 Configuration Avancée (Optionnel)

### Ajouter un domaine personnalisé

1. Dans Vercel : **Settings** → **Domains**
2. Ajoutez votre domaine (ex: `doussel-immo.com`)
3. Suivez les instructions DNS

### Variables d'environnement par environnement

Vous pouvez avoir des variables différentes pour :
- **Production** : Variables pour la prod
- **Preview** : Variables pour les branches de test
- **Development** : Variables pour le développement local

---

## 🚨 Résolution de Problèmes

### ❌ Build échoue

**Erreur : "Module not found"**
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que `npm install` fonctionne localement

**Erreur : "Environment variable not found"**
- Vérifiez que toutes les variables sont configurées dans Vercel
- Vérifiez que les variables commencent par `NEXT_PUBLIC_` si utilisées côté client

### ❌ L'application ne fonctionne pas en production

**Erreur : "Supabase connection failed"**
- Vérifiez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vérifiez que les URLs sont correctes dans Supabase

**Erreur : "OAuth redirect mismatch"**
- Vérifiez les URLs dans Google Cloud Console
- Vérifiez les Redirect URLs dans Supabase

**Erreur : "API route not found"**
- Vérifiez que les routes API sont dans `app/api/`
- Vérifiez les logs Vercel pour plus de détails

---

## 📝 Checklist de Déploiement

Avant de déployer, vérifiez :

- [ ] `npm run build` passe sans erreur localement
- [ ] Toutes les variables d'environnement sont listées
- [ ] Le code est commité et poussé sur Git
- [ ] Le projet est connecté à Vercel
- [ ] Les variables d'environnement sont configurées dans Vercel
- [ ] Les URLs Supabase sont mises à jour
- [ ] Les URLs Google OAuth sont mises à jour (si utilisé)
- [ ] Le build Vercel passe avec succès
- [ ] L'application fonctionne en production

---

## 🎉 C'est fait !

Votre application est maintenant en ligne ! 🚀

**URL de production** : `https://votre-projet.vercel.app`

### Prochaines étapes

1. **Tester toutes les fonctionnalités** en production
2. **Configurer un domaine personnalisé** (optionnel)
3. **Mettre en place le monitoring** (Vercel Analytics)
4. **Configurer les backups** Supabase (si nécessaire)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez les **logs Vercel** (Deployments → Logs)
2. Consultez les **logs Supabase** (Logs → API)
3. Vérifiez la **documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)










