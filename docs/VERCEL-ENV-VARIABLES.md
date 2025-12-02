# 🔧 Configuration des Variables d'Environnement dans Vercel

## ⚠️ Important

Après le déploiement initial, vous devez configurer les variables d'environnement dans Vercel pour que l'application fonctionne correctement.

## 📋 Étapes de Configuration

### 1. Trouver vos Credentials Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → Ce sera votre `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Ce sera votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Ajouter les Variables dans Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet **Dousell Immo**
3. Allez dans **Settings** → **Environment Variables**
4. Cliquez sur **Add New**
5. Ajoutez ces 3 variables :

#### Variable 1 : `NEXT_PUBLIC_SUPABASE_URL`
- **Key** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : Votre URL Supabase (ex: `https://votre-projet.supabase.co`)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 2 : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : Votre clé anonyme Supabase
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 3 : `NEXT_PUBLIC_APP_URL`
- **Key** : `NEXT_PUBLIC_APP_URL`
- **Value** : L'URL de votre application Vercel (ex: `https://dousell-immo.vercel.app`)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 4 : `GMAIL_USER` (⚠️ Pour l'envoi d'emails)
- **Key** : `GMAIL_USER`
- **Value** : Votre adresse email Gmail (ex: `mb3186802@gmail.com`)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 5 : `GMAIL_APP_PASSWORD` (⚠️ Pour l'envoi d'emails)
- **Key** : `GMAIL_APP_PASSWORD`
- **Value** : Votre mot de passe d'application Gmail (16 caractères, généré sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords))
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 6 : `ADMIN_EMAIL` (⚠️ Pour les notifications admin)
- **Key** : `ADMIN_EMAIL`
- **Value** : L'email de l'administrateur (ex: `barrymohamadou98@gmail.com`)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

> **Note** : Pour le développement local, utilisez `.env.local` avec toutes ces variables
> 
> **Important** : `GMAIL_APP_PASSWORD` doit être un **mot de passe d'application** (pas votre mot de passe Gmail normal). Générez-le sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) après avoir activé la validation en deux étapes.

### 3. Redéployer le Projet

1. Après avoir ajouté toutes les variables, allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** → **Redeploy**
4. Ou simplement faites un nouveau push sur GitHub (Vercel redéploiera automatiquement)

## ✅ Vérification

Une fois redéployé avec les variables d'environnement :

1. Visitez votre site Vercel
2. L'application devrait fonctionner correctement
3. Les fonctionnalités d'authentification devraient être actives
4. Plus d'erreur 500 dans le middleware

## 📝 Notes Importantes

- ⚠️ **Ne commitez JAMAIS** vos variables d'environnement dans Git
- ✅ Les variables `NEXT_PUBLIC_*` sont visibles côté client (c'est normal pour Supabase)
- ✅ Utilisez toujours la clé **anon public** (jamais la clé service_role)
- ✅ Ajoutez les variables pour **tous les environnements** (Production, Preview, Development)

## 🔍 Vérifier que les Variables sont Bien Configurées

Après le redéploiement, vous pouvez vérifier dans les logs Vercel que les variables sont bien chargées :

1. Allez dans **Deployments** → Cliquez sur le dernier déploiement
2. Ouvrez les **Build Logs**
3. Vous ne devriez **plus voir** :
   ```
   ⚠️ Supabase credentials are missing
   ```

## 🚀 Résultat Attendu

Une fois les variables configurées et le projet redéployé :

- ✅ Plus d'erreur 500
- ✅ Le middleware fonctionne correctement
- ✅ L'authentification fonctionne
- ✅ Les données Supabase sont accessibles
- ✅ Toutes les fonctionnalités sont actives
