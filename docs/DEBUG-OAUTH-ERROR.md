# 🐛 Débogage Erreur d'Authentification OAuth

## ❌ Problème

Vous voyez toujours la page d'erreur `localhost:3000/auth/auth-code-error` après avoir essayé de vous connecter avec Google.

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier les Logs dans la Console

1. Ouvrez la console de votre navigateur (F12)
2. Allez sur la page `/login`
3. Cliquez sur "Continuer avec Google"
4. Regardez les erreurs dans la console

**Erreurs possibles :**
- `400 (Bad Request)` → Provider Google non configuré dans Supabase
- `redirect_uri_mismatch` → URLs de redirection incorrectes
- `access_denied` → Vous avez annulé l'autorisation
- `invalid_request` → Client ID ou Secret incorrect

### Étape 2 : Vérifier la Configuration Supabase

1. **Allez dans Supabase Dashboard** : [https://app.supabase.com](https://app.supabase.com)
2. **Sélectionnez votre projet**
3. **Authentication** → **Providers**
4. **Vérifiez que Google est ACTIVÉ** (toggle vert/bleu)

### Étape 3 : Vérifier les URLs dans Supabase

1. **Authentication** → **URL Configuration**
2. **Site URL** : Doit être `http://localhost:3000` (pour développement)
3. **Redirect URLs** : Doit contenir **exactement** ces deux lignes :

```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

> **⚠️ Important :** 
> - Pas d'espace avant/après
> - Pas de slash à la fin (`/**` pas `/**/`)
> - Chaque URL sur une ligne séparée
> - Cliquez sur "Save" après modification

### Étape 4 : Vérifier Google Cloud Console

1. **Allez sur** [console.cloud.google.com](https://console.cloud.google.com/)
2. **Sélectionnez votre projet** (probablement "dousell")
3. **APIs & Services** → **Credentials**
4. **Cliquez sur votre OAuth 2.0 Client ID**

5. **Dans "Authorized redirect URIs"**, vous devez avoir **exactement** :

**URI 1** (pour Supabase) :
```
https://VOTRE-PROJET.supabase.co/auth/v1/callback
```
*(Remplacez `VOTRE-PROJET` par votre projet Supabase)*

**URI 2** (pour localhost - optionnel mais recommandé) :
```
http://localhost:3000/auth/callback
```

> **⚠️ Important :**
> - Pas d'espace avant/après
> - Pas de slash à la fin
> - Chaque URI dans un champ séparé
> - Cliquez sur "Save" après modification

### Étape 5 : Trouver votre URL Supabase

1. **Dans Supabase Dashboard**
2. **Settings** → **API**
3. **Trouvez "Project URL"** : `https://XXXXX.supabase.co`
4. **L'URL de callback est** : `https://XXXXX.supabase.co/auth/v1/callback`

### Étape 6 : Vérifier le Client ID et Secret dans Supabase

1. **Dans Google Cloud Console**, copiez :
   - **Client ID** (pas le Client Secret à ce stade)
2. **Dans Supabase Dashboard** :
   - **Authentication** → **Providers** → **Google**
   - **Collez le Client ID** dans "Client ID (for OAuth)"
   - **N'enregistrez PAS encore**

3. **Retournez dans Google Cloud Console**
   - **Téléchargez le JSON** ou **créez un Secret**
   - **Copiez le Client Secret**

4. **Retournez dans Supabase**
   - **Collez le Client Secret** dans "Client Secret (for OAuth)"
   - **Cliquez sur "Save"**

> **⚠️ Important :**
> - Pas d'espace avant/après
> - Copiez-collez exactement depuis Google Cloud Console
> - Cliquez sur "Save" après modification

### Étape 7 : Vérifier les Variables d'Environnement

1. **Créez un fichier `.env.local`** à la racine du projet (s'il n'existe pas)

2. **Ajoutez ces variables** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **⚠️ Important :**
> - Remplacez `VOTRE-PROJET` par votre projet Supabase
> - Trouvez `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans **Supabase Dashboard** → **Settings** → **API** → **anon public** key

3. **Redémarrez le serveur de développement** :

```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### Étape 8 : Vérifier les Logs du Serveur

Après avoir modifié le callback route, les logs devraient apparaître dans le terminal où vous exécutez `npm run dev`.

**Logs attendus :**
```
🔍 Auth Callback Debug: { code: '✓ présent', error: null, ... }
✅ Session créée avec succès
```

**Si vous voyez une erreur :**
```
❌ Error exchanging code for session: [détail de l'erreur]
```

Cela vous indiquera la cause exacte du problème.

## ✅ Checklist de Vérification

Cochez chaque élément après vérification :

- [ ] Provider Google **ACTIVÉ** dans Supabase
- [ ] **Client ID** correct dans Supabase (copié depuis Google Cloud Console)
- [ ] **Client Secret** correct dans Supabase (copié depuis Google Cloud Console)
- [ ] **Site URL** = `http://localhost:3000` dans Supabase
- [ ] **Redirect URLs** contient `http://localhost:3000/**` dans Supabase
- [ ] **Redirect URLs** contient `http://localhost:3000/auth/callback` dans Supabase
- [ ] **Authorized redirect URIs** contient `https://VOTRE-PROJET.supabase.co/auth/v1/callback` dans Google Cloud Console
- [ ] **Authorized redirect URIs** contient `http://localhost:3000/auth/callback` dans Google Cloud Console (optionnel)
- [ ] Fichier `.env.local` créé avec les bonnes variables
- [ ] Serveur redémarré après modification de `.env.local`

## 🆘 Si le Problème Persiste

1. **Vérifiez les logs dans le terminal** (`npm run dev`)
2. **Vérifiez les logs dans la console du navigateur** (F12)
3. **Vérifiez que vous êtes bien sur `http://localhost:3000`** (pas `https` ou un autre port)
4. **Essayez de vous connecter en mode navigation privée** pour éliminer les cookies/cache

## 📝 Notes Importantes

- Les URLs doivent être **exactement** identiques dans Supabase et Google Cloud Console
- Pas d'espace, pas de slash final, respect de la casse
- Après chaque modification dans Supabase ou Google Cloud Console, **attendez quelques secondes** avant de réessayer
- Si vous modifiez `.env.local`, vous **devez redémarrer le serveur**

