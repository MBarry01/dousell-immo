# 🔧 Corriger "redirect_uri_mismatch"

## ❌ Erreur actuelle

```
error?authError=ChVyZWRpcmVjdF91cmlfbWlzbWF0Y2g
```

Cette erreur signifie que l'URL de redirection utilisée ne correspond **pas exactement** à celles autorisées dans Google Cloud Console.

## 🔍 Cause

L'URL de callback Supabase dans Google Cloud Console doit correspondre **exactement** à celle utilisée par Supabase.

## ✅ Solution étape par étape

### Étape 1 : Trouver votre URL Supabase exacte

1. Allez dans **Supabase Dashboard**
2. **Settings** → **API**
3. Trouvez **"Project URL"** : `https://VOTRE-PROJET.supabase.co`
4. L'URL de callback Supabase est : `https://VOTRE-PROJET.supabase.co/auth/v1/callback`

**Exemple** : Si votre projet est `blyanhulvwpdfpezlaji`, l'URL est :
```
https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback
```

### Étape 2 : Vérifier dans Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Projet : **dousell**
3. **APIs & Services** → **Credentials**
4. Cliquez sur votre OAuth Client ID (remplacez par votre propre Client ID)
5. Dans **"Authorized redirect URIs"**, vous devez avoir **exactement** :

**Champ 1 (URI 1)** :
```
https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback
```
*(Remplacez `blyanhulvwpdfpezlaji` par VOTRE projet Supabase)*

**Champ 2 (URI 2)** :
```
http://localhost:3000/auth/callback
```

**⚠️ Important** :
- Pas d'espaces
- Pas de slash à la fin (`/auth/v1/callback` pas `/auth/v1/callback/`)
- Chaque URL dans un champ séparé
- Copiez-collez exactement depuis Supabase Dashboard

### Étape 3 : Vérifier dans Supabase Dashboard

1. **Authentication** → **URL Configuration**
2. **Site URL** : `http://localhost:3000`
3. **Redirect URLs** : Doit contenir :
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

### Étape 4 : Vérifier le format exact

L'URL Supabase doit être au format :
```
https://[VOTRE-PROJET].supabase.co/auth/v1/callback
```

**Exemples corrects** :
- ✅ `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback`
- ✅ `https://dousell-immo.supabase.co/auth/v1/callback`

**Exemples incorrects** :
- ❌ `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback/` (slash à la fin)
- ❌ `https://blyanhulvwpdfpezlaji.supabase.co/auth/v1/callback ` (espace)
- ❌ `https://blyanhulvwpdfpezlaji.supabase.co/auth/callback` (manque `/v1`)

### Étape 5 : Comment trouver votre projet Supabase

**Méthode 1 : Dashboard Supabase**
1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** → **API**
4. **Project URL** = votre URL de base

**Méthode 2 : Vérifier `.env.local`**
Ouvrez `.env.local` et regardez :
```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
```
L'URL de callback est : `https://VOTRE-PROJET.supabase.co/auth/v1/callback`

## 🧪 Tester après correction

1. **Sauvegardez** dans Google Cloud Console
2. **Attendez 1-2 minutes** (propagation)
3. Redémarrez le serveur :
   ```bash
   npm run dev
   ```
4. Allez sur `http://localhost:3000/login`
5. Cliquez sur "Continuer avec Google"
6. **Résultat attendu** :
   - Redirection vers Google (pas d'erreur)
   - Page de connexion Google s'affiche
   - Après connexion → Redirection vers `/compte`

## 🐛 Si l'erreur persiste

### Vérifier l'URL exacte utilisée

1. Ouvrez DevTools (F12) → Network
2. Cliquez sur "Continuer avec Google"
3. Regardez la requête vers `accounts.google.com`
4. Dans les paramètres, trouvez `redirect_uri=`
5. Comparez avec celle dans Google Cloud Console

### Vérifier les espaces cachés

Parfois il y a des espaces invisibles :
1. Dans Google Cloud Console, **supprimez** l'URL
2. **Retapez-la** manuellement (ne copiez pas)
3. Ou copiez depuis Supabase Dashboard et collez

### Vérifier le projet Google Cloud

Assurez-vous d'être dans le **bon projet** Google Cloud :
- Projet : **dousell**
- Pas un autre projet

## 📋 Checklist de vérification

- [ ] URL Supabase trouvée dans Settings → API
- [ ] URL exacte : `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
- [ ] URL ajoutée dans Google Cloud Console (Authorized redirect URIs)
- [ ] Pas d'espaces dans l'URL
- [ ] Pas de slash à la fin
- [ ] `http://localhost:3000/auth/callback` aussi ajouté
- [ ] Sauvegardé dans Google Cloud Console
- [ ] Attendu 1-2 minutes (propagation)
- [ ] Serveur redémarré
- [ ] Testé à nouveau

## 💡 Astuce

Si vous avez plusieurs projets Supabase, assurez-vous d'utiliser le **bon projet** dans :
- `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`)
- Google Cloud Console (Authorized redirect URIs)
- Supabase Dashboard (configuration)

Ils doivent tous pointer vers le **même projet** !

