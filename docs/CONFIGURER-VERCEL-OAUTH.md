# 🚀 Configurer OAuth pour Vercel (Production)

## ❌ Problème

L'authentification Google OAuth ne fonctionne pas sur Vercel (version en ligne).

## ✅ Solution Étape par Étape

### 📋 Étape 1 : Vérifier les Variables d'Environnement sur Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** et ouvrez votre projet **dousell-immo**
3. **Settings** → **Environment Variables**
4. **Vérifiez que ces 3 variables sont configurées** :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://votre-projet.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre clé anon Supabase |
| `NEXT_PUBLIC_APP_URL` | `https://dousell-immo.vercel.app` |

> **⚠️ Important :**
> - Sélectionnez **Production**, **Preview**, et **Development** pour chaque variable
> - Cliquez sur **Save** après chaque ajout
> - **Si les variables n'existent pas**, ajoutez-les maintenant

### 📋 Étape 2 : Redéployer après Ajout des Variables

1. **Après avoir ajouté/modifié les variables**, allez dans **Deployments**
2. **Trouvez le dernier déploiement**
3. **Cliquez sur les 3 points** → **Redeploy**
4. **Ou faites un nouveau push** sur GitHub (Vercel redéploiera automatiquement)

### 📋 Étape 3 : Configurer Supabase pour Vercel

1. **Allez dans [Supabase Dashboard](https://app.supabase.com)**
2. **Sélectionnez votre projet**
3. **Authentication** → **URL Configuration**

#### Site URL (L'adresse principale) :
Mettez votre adresse Vercel :
```
https://dousell-immo.vercel.app
```

#### Redirect URLs (La liste blanche) :
Assurez-vous d'avoir **exactement** ces lignes dans la liste :

1. `https://dousell-immo.vercel.app/**` (Pour la production)
2. `http://localhost:3000/**` (Pour le développement local)

> **⚠️ Important :**
> - Les deux étoiles `**` à la fin sont cruciales
> - Chaque URL sur une ligne séparée
> - Cliquez sur **Save** après modification

### 📋 Étape 4 : Configurer Google Cloud Console

1. **Allez sur [console.cloud.google.com](https://console.cloud.google.com/)**
2. **Sélectionnez votre projet** (probablement "dousell")
3. **APIs & Services** → **Credentials**
4. **Cliquez sur votre OAuth 2.0 Client ID**

5. **Dans "Authorized redirect URIs"**, vous devez avoir **exactement** :

**URI 1** (pour Supabase - OBLIGATOIRE) :
```
https://VOTRE-PROJET.supabase.co/auth/v1/callback
```
*(Remplacez `VOTRE-PROJET` par votre projet Supabase)*

**URI 2** (pour Vercel - RECOMMANDÉ) :
```
https://dousell-immo.vercel.app/auth/callback
```

**URI 3** (pour localhost - optionnel pour développement) :
```
http://localhost:3000/auth/callback
```

> **⚠️ Important :**
> - Pas d'espace avant/après
> - Pas de slash à la fin
> - Chaque URI dans un champ séparé
> - Cliquez sur **Save** après modification

### 📋 Étape 5 : Vérifier que le Provider Google est Activé

1. **Dans Supabase Dashboard**
2. **Authentication** → **Providers**
3. **Trouvez "Google"** dans la liste
4. **Vérifiez que le toggle est ACTIVÉ** (vert/bleu)
5. **Si ce n'est pas le cas**, activez-le et **cliquez sur Save**

### 📋 Étape 6 : Vérifier Client ID et Secret dans Supabase

1. **Dans Google Cloud Console**, copiez :
   - **Client ID** (from OAuth 2.0 Client ID)
   - **Client Secret** (if you have one, or create a new one)

2. **Dans Supabase Dashboard** :
   - **Authentication** → **Providers** → **Google**
   - **Client ID (for OAuth)** : Collez le Client ID depuis Google Cloud Console
   - **Client Secret (for OAuth)** : Collez le Client Secret depuis Google Cloud Console
   - **Cliquez sur Save**

> **⚠️ Important :**
> - Pas d'espace avant/après
> - Copiez-collez exactement depuis Google Cloud Console
> - Cliquez sur **Save** après modification

### 📋 Étape 7 : Trouver votre URL Supabase

1. **Dans Supabase Dashboard**
2. **Settings** → **API**
3. **Trouvez "Project URL"** : `https://XXXXX.supabase.co`
4. **L'URL de callback Supabase est** : `https://XXXXX.supabase.co/auth/v1/callback`

**C'est cette URL que vous devez ajouter dans Google Cloud Console !**

## ✅ Checklist de Vérification

Cochez chaque élément après vérification :

- [ ] Variables d'environnement configurées sur Vercel :
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://dousell-immo.vercel.app`
- [ ] Projet redéployé sur Vercel après ajout des variables
- [ ] **Site URL** dans Supabase = `https://dousell-immo.vercel.app`
- [ ] **Redirect URLs** dans Supabase contient `https://dousell-immo.vercel.app/**`
- [ ] **Redirect URLs** dans Supabase contient `http://localhost:3000/**`
- [ ] Provider Google **ACTIVÉ** dans Supabase
- [ ] **Client ID** correct dans Supabase (copié depuis Google Cloud Console)
- [ ] **Client Secret** correct dans Supabase (copié depuis Google Cloud Console)
- [ ] **Authorized redirect URIs** dans Google Cloud Console contient `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
- [ ] **Authorized redirect URIs** dans Google Cloud Console contient `https://dousell-immo.vercel.app/auth/callback`

## 🧪 Tester sur Vercel

1. **Allez sur** `https://dousell-immo.vercel.app/login`
2. **Cliquez sur "Continuer avec Google"**
3. **Autorisez l'accès** dans Google
4. **Vous devriez être redirigé** vers `/compte` ✅

## 🐛 Si ça ne Fonctionne Toujours Pas

### Vérifier les Logs Vercel

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Ouvrez votre projet** → **Deployments**
3. **Cliquez sur le dernier déploiement**
4. **Ouvrez les logs** (Build Logs et Runtime Logs)
5. **Cherchez les erreurs** liées à l'authentification

### Vérifier la Console du Navigateur

1. **Ouvrez votre site Vercel** dans le navigateur
2. **Appuyez sur F12** pour ouvrir les outils de développement
3. **Onglet "Console"**
4. **Essayez de vous connecter avec Google**
5. **Regardez les erreurs** dans la console

### Erreurs Communes

**`redirect_uri_mismatch`** :
- L'URL de redirection dans Google Cloud Console ne correspond pas
- Vérifiez que `https://VOTRE-PROJET.supabase.co/auth/v1/callback` est bien ajouté

**`400 (Bad Request)`** :
- Le Provider Google n'est pas activé dans Supabase
- Vérifiez **Authentication** → **Providers** → **Google**

**`access_denied`** :
- Vous avez annulé l'autorisation dans Google
- Réessayez et acceptez l'autorisation

**Page d'erreur `/auth/auth-code-error`** :
- Vérifiez les logs Vercel pour voir l'erreur exacte
- Vérifiez que toutes les variables d'environnement sont configurées

## 📝 Notes Importantes

- ⚠️ **Attendez quelques secondes** après chaque modification dans Supabase ou Google Cloud Console
- ✅ **Un seul Client ID Google** fonctionne pour localhost ET Vercel
- ✅ **Les URLs doivent être exactement identiques** dans Supabase et Google Cloud Console
- ✅ **Pas d'espace, pas de slash final** dans les URLs
- ✅ **Redéployez toujours** sur Vercel après modification des variables d'environnement

## 🎉 Résultat Attendu

Après avoir suivi toutes les étapes :

- ✅ L'authentification Google fonctionne sur Vercel
- ✅ Les utilisateurs peuvent se connecter avec Google
- ✅ La redirection vers `/compte` fonctionne correctement
- ✅ Plus de page d'erreur `/auth/auth-code-error`

