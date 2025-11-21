# 🔧 Corriger l'erreur 400 sur OAuth Google

## ❌ Erreur actuelle

```
GET https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/authorize?provider=google 400 (Bad Request)
```

Cette erreur signifie que Supabase ne peut pas initier le flux OAuth Google.

## 🔍 Causes possibles

1. **Google provider non activé** dans Supabase
2. **Client ID ou Secret incorrect** dans Supabase
3. **URLs de redirection non autorisées** dans Supabase
4. **Site URL incorrect** dans Supabase

## ✅ Solution étape par étape

### Étape 1 : Vérifier Google Provider dans Supabase

1. Allez dans votre projet Supabase Dashboard
2. **Authentication** → **Providers**
3. Trouvez **Google** dans la liste
4. **Vérifiez que le toggle est ACTIVÉ** (vert/bleu)
5. Si ce n'est pas le cas, activez-le

### Étape 2 : Vérifier Client ID et Secret

Dans **Authentication** → **Providers** → **Google**, vérifiez :

**Client ID (for OAuth)** :
```
YOUR_GOOGLE_CLIENT_ID_HERE
```

**Client Secret (for OAuth)** :
```
YOUR_GOOGLE_CLIENT_SECRET_HERE
```

**⚠️ Important** :
- Pas d'espaces avant/après
- Copiez-collez exactement depuis Google Cloud Console
- Cliquez sur **Save** après modification

### Étape 3 : Vérifier les URLs dans Supabase

1. **Authentication** → **URL Configuration**
2. **Site URL** : Doit être `http://localhost:3000`
3. **Redirect URLs** : Doit contenir (ajoutez avec "+ Add URL" si manquant) :
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

### Étape 4 : Vérifier dans Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Projet : **dousell**
3. **APIs & Services** → **Credentials**
4. Cliquez sur votre OAuth Client ID
5. Vérifiez que **"Authorized redirect URIs"** contient :
   ```
   https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   *(Remplacez "blyanhulvwpdfpezlaji" par votre vrai projet Supabase si différent)*

### Étape 5 : Vérifier les variables d'environnement

Vérifiez que `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://blyanhulvwpdfpezlaji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important** : Redémarrez le serveur après modification :
```bash
# Arrêtez (Ctrl+C) puis :
npm run dev
```

## 🧪 Tester après correction

1. Redémarrez le serveur
2. Allez sur `http://localhost:3000/login`
3. Cliquez sur "Continuer avec Google"
4. **Résultat attendu** :
   - Redirection vers Google (pas d'erreur 400)
   - Page de connexion Google s'affiche
   - Après connexion → Redirection vers `/compte`

## 🐛 Si l'erreur persiste

### Vérifiez les logs Supabase

1. Allez dans Supabase Dashboard
2. **Logs** → **Auth Logs**
3. Regardez les erreurs récentes
4. Cela vous donnera plus de détails sur l'erreur

### Vérifiez la console du navigateur

Ouvrez DevTools (F12) → Console et regardez les erreurs détaillées.

### Erreur "redirect_uri_mismatch"

- Vérifiez que l'URL dans Google Cloud Console correspond exactement à celle dans Supabase
- Format Supabase : `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
- Pas d'espaces, pas de slash à la fin

## 📋 Checklist de vérification

- [ ] Google provider activé dans Supabase (toggle vert)
- [ ] Client ID correct dans Supabase (sans espaces)
- [ ] Client Secret correct dans Supabase (sans espaces)
- [ ] Site URL = `http://localhost:3000` dans Supabase
- [ ] Redirect URLs contient `http://localhost:3000/auth/callback` dans Supabase
- [ ] Google Cloud Console : `https://VOTRE-PROJET.supabase.co/auth/v1/callback` dans redirect URIs
- [ ] `.env.local` avec `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Serveur redémarré après modification

