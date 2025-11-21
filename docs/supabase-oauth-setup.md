# Configuration OAuth Google avec Supabase SSR

## 📋 Prérequis

1. Projet Supabase configuré (voir `supabase-setup.md`)
2. Package `@supabase/ssr` installé ✅
3. Variables d'environnement configurées

## 🔑 Variables d'environnement

### Pour le développement local (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Pour la production (`.env.production` ou variables d'environnement du serveur)

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

## ⚙️ Configuration Google OAuth dans Supabase

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API **Google Identity API** :
   - Allez dans **APIs & Services** → **Library**
   - Recherchez "Google Identity API"
   - Cliquez sur **Enable**

### Étape 2 : Créer les credentials OAuth

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur **Create Credentials** → **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - **User Type** : External
   - **App name** : Dousell Immo
   - **User support email** : Votre email
   - **Developer contact** : Votre email
   - Cliquez sur **Save and Continue**
   - Scopes : Ajoutez `email`, `profile`, `openid`
   - Test users : Ajoutez votre email (pour les tests)
   - Cliquez sur **Save and Continue**

4. Créez l'OAuth Client ID :
   - **Application type** : Web application
   - **Name** : Dousell Immo (Dev + Prod)
   - **Authorized JavaScript origins** :
     ```
     http://localhost:3000
     https://votre-domaine.com
     ```
   - **Authorized redirect URIs** :
     ```
     https://votre-projet.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     https://votre-domaine.com/auth/callback
     ```
   - Cliquez sur **Create**
   - **Copiez le Client ID et le Client Secret** (vous en aurez besoin)

### Étape 3 : Configurer dans Supabase Dashboard

1. Allez dans votre projet Supabase → **Authentication** → **Providers**
2. Trouvez **Google** et cliquez dessus
3. Activez le toggle **Enable Google provider**
4. Entrez :
   - **Client ID (for OAuth)** : Collez votre Google Client ID
   - **Client Secret (for OAuth)** : Collez votre Google Client Secret
5. Cliquez sur **Save**

### Étape 4 : Vérifier les Site URL dans Supabase

1. Allez dans **Authentication** → **URL Configuration**
2. Configurez les **Site URL** :
   - **Site URL** : `http://localhost:3000` (pour dev) ou `https://votre-domaine.com` (pour prod)
   - **Redirect URLs** : Ajoutez toutes les URLs autorisées :
     ```
     http://localhost:3000/**
     https://votre-domaine.com/**
     http://localhost:3000/auth/callback
     https://votre-domaine.com/auth/callback
     ```

## 🔄 Flux d'authentification

### Email/Password
1. Utilisateur s'inscrit avec email/password sur `/register`
2. Supabase envoie un email de confirmation
3. Utilisateur clique sur le lien → Redirige vers `/auth/callback`
4. Le callback échange le code contre une session
5. Redirection vers `/compte`

### Google OAuth
1. Utilisateur clique sur "Continuer avec Google" sur `/login` ou `/register`
2. Redirection vers Google pour authentification
3. Google redirige vers Supabase avec un code
4. Supabase redirige vers `/auth/callback?next=/compte`
5. Le callback échange le code contre une session
6. Redirection vers `/compte`

## 🛡️ Protection des routes

Le middleware (`middleware.ts`) protège automatiquement :
- `/compte/*` : Requiert une session active
- `/admin/*` : Requiert une session active

Si non connecté → Redirection vers `/login?redirect=/compte`

## 📝 Configuration pour Dev + Prod

### Option 1 : Deux projets Google OAuth (Recommandé)

**Avantages** : Séparation claire dev/prod, sécurité renforcée

1. **Projet Dev** :
   - Client ID pour `localhost:3000`
   - Redirect URI : `http://localhost:3000/auth/callback`
   - Utilisez ce Client ID dans Supabase pour les tests locaux

2. **Projet Prod** :
   - Client ID pour votre domaine
   - Redirect URI : `https://votre-domaine.com/auth/callback`
   - Utilisez ce Client ID dans Supabase pour la production

### Option 2 : Un seul projet avec toutes les URLs (Plus simple)

**Avantages** : Configuration unique, fonctionne partout

- Un seul OAuth Client ID avec toutes les URLs autorisées (localhost + prod)
- Même Client ID dans Supabase pour dev et prod
- Changez juste `NEXT_PUBLIC_APP_URL` selon l'environnement

## 🧪 Tester en local

1. **Vérifiez `.env.local`** :
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Démarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Testez l'inscription** :
   - Allez sur `http://localhost:3000/register`
   - Créez un compte ou cliquez sur "Continuer avec Google"
   - Vous devriez être redirigé vers Google, puis revenir sur `/compte`

## 🚀 Déployer en production

1. **Configurez les variables d'environnement** sur votre plateforme (Vercel, Netlify, etc.) :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
   NEXT_PUBLIC_APP_URL=https://votre-domaine.com
   ```

2. **Vérifiez dans Supabase Dashboard** :
   - Authentication → URL Configuration → Site URL = `https://votre-domaine.com`
   - Authentication → Providers → Google → Client ID et Secret corrects

3. **Vérifiez dans Google Cloud Console** :
   - Les URLs de production sont dans "Authorized redirect URIs"
   - Format : `https://votre-domaine.com/auth/callback`

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch" en local
- Vérifiez que `http://localhost:3000/auth/callback` est dans les "Authorized redirect URIs" de Google
- Vérifiez que `NEXT_PUBLIC_APP_URL=http://localhost:3000` dans `.env.local`

### Erreur "redirect_uri_mismatch" en production
- Vérifiez que `https://votre-domaine.com/auth/callback` est dans les "Authorized redirect URIs" de Google
- Vérifiez que `NEXT_PUBLIC_APP_URL=https://votre-domaine.com` dans les variables d'environnement

### Erreur "invalid_client"
- Vérifiez que le Client ID et Secret dans Supabase Dashboard correspondent à ceux de Google Cloud Console
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

### Session non persistée
- Vérifiez que les cookies sont activés dans le navigateur
- Vérifiez que `NEXT_PUBLIC_APP_URL` correspond à l'URL actuelle (localhost en dev, domaine en prod)

## 📋 Checklist rapide

### Pour le développement local :
- [ ] `.env.local` avec `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Google OAuth Client ID configuré avec `http://localhost:3000/auth/callback`
- [ ] Supabase → Authentication → Providers → Google activé
- [ ] Supabase → Authentication → URL Configuration → Site URL = `http://localhost:3000`

### Pour la production :
- [ ] Variables d'environnement avec `NEXT_PUBLIC_APP_URL=https://votre-domaine.com`
- [ ] Google OAuth Client ID configuré avec `https://votre-domaine.com/auth/callback`
- [ ] Supabase → Authentication → URL Configuration → Site URL = `https://votre-domaine.com`
- [ ] Toutes les URLs de production dans "Redirect URLs" de Supabase
