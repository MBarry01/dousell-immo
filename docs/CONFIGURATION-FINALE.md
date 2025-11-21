# ✅ Configuration finale avec votre URL Supabase

## 🔑 Votre configuration

**URL Supabase** : `https://blyanhulvwpdfpezlaji.supabase.co`

**URL de callback Supabase** : `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback`

## ✅ Vérification Google Cloud Console

### Authorized JavaScript origins
**Champ 1 (URI 1)** :
```
http://localhost:3000
```

### Authorized redirect URIs
**Champ 1 (URI 1)** :
```
https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback
```

**Champ 2 (URI 2)** :
```
http://localhost:3000/auth/callback
```

**⚠️ Important** :
- Pas d'espaces
- Pas de slash à la fin
- Chaque URL dans un champ séparé
- Format exact : `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback`

## ✅ Vérification Supabase Dashboard

### 1. Authentication → Providers → Google

**Toggle** : ✅ Activé (vert/bleu)

**Client ID (for OAuth)** :
```
YOUR_GOOGLE_CLIENT_ID_HERE
```

**Client Secret (for OAuth)** :
```
YOUR_GOOGLE_CLIENT_SECRET_HERE
```

**Cliquez sur Save** après vérification

### 2. Authentication → URL Configuration

**Site URL** :
```
http://localhost:3000
```

**Redirect URLs** (ajoutez avec "+ Add URL" si manquant) :
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**Cliquez sur Save** après vérification

## ✅ Vérification `.env.local`

Créez ou vérifiez `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://blyanhulvwpdfpezlaji.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important** :
- Pas de slash à la fin des URLs
- Remplacez `votre-anon-key-ici` par votre vraie clé (trouvable dans Supabase → Settings → API → anon public)

## 🧪 Test final

1. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

2. Allez sur `http://localhost:3000/login`

3. Cliquez sur **"Continuer avec Google"**

4. **Résultat attendu** :
   - ✅ Redirection vers Google (pas d'erreur 400)
   - ✅ Page de connexion Google s'affiche
   - ✅ Après connexion → Redirection vers `/compte`
   - ✅ Vous êtes connecté !

## 🐛 Si ça ne marche toujours pas

### Vérifier l'URL exacte dans Google Cloud Console

1. Ouvrez Google Cloud Console
2. APIs & Services → Credentials
3. Cliquez sur votre OAuth Client ID
4. Dans "Authorized redirect URIs", vérifiez que l'URL est **exactement** :
   ```
   https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback
   ```
   - Pas d'espaces avant/après
   - Pas de slash à la fin
   - Avec `/v1` dans le chemin

### Vérifier les logs Supabase

1. Supabase Dashboard → Logs → Auth Logs
2. Regardez les erreurs récentes
3. Cela vous donnera plus de détails

### Vérifier la console du navigateur

1. Ouvrez DevTools (F12) → Console
2. Cliquez sur "Continuer avec Google"
3. Regardez les erreurs détaillées

## 📋 Checklist finale

- [ ] Google Cloud Console : `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback` dans Authorized redirect URIs
- [ ] Google Cloud Console : `http://localhost:3000/auth/callback` dans Authorized redirect URIs
- [ ] Supabase : Google provider activé avec Client ID et Secret corrects
- [ ] Supabase : Site URL = `http://localhost:3000`
- [ ] Supabase : Redirect URLs contient `http://localhost:3000/auth/callback`
- [ ] `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL=https://blyanhulvwpdfpezlaji.supabase.co`
- [ ] `.env.local` avec `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Serveur redémarré après modifications
- [ ] Testé sur `/login` → "Continuer avec Google"

## 🎉 Si tout est correct

Votre authentification Google OAuth devrait fonctionner ! 

Si vous avez encore des erreurs, vérifiez :
1. Les URLs dans Google Cloud Console (copiez-collez depuis ce guide)
2. Les credentials dans Supabase (vérifiez qu'ils sont bien sauvegardés)
3. Le serveur redémarré après chaque modification

