# 🔑 Vos credentials Google OAuth

## ✅ Ce que vous avez déjà

D'après votre fichier JSON, vous avez :

- **Client ID** : `YOUR_GOOGLE_CLIENT_ID_HERE`
- **Client Secret** : `YOUR_GOOGLE_CLIENT_SECRET_HERE`
- **Project ID** : `dousell`

## ⚠️ Ce qui manque

Dans votre configuration actuelle, il manque l'URL de callback pour localhost dans `redirect_uris`.

**Actuellement vous avez :**
```json
"redirect_uris": ["https://Dousell-immo.supabase.co/auth/v1/callback"]
```

**Il faut ajouter :**
```json
"redirect_uris": [
  "https://Dousell-immo.supabase.co/auth/v1/callback",
  "http://localhost:3000/auth/callback"
]
```

## 🔧 Comment corriger dans Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Sélectionnez le projet **"dousell"**
3. Allez dans **APIs & Services** → **Credentials**
4. Cliquez sur votre OAuth Client ID (remplacez par votre propre Client ID)
5. Dans la section **"Authorized redirect URIs"**, vous devriez voir :
   - URI 1 : `https://Dousell-immo.supabase.co/auth/v1/callback`
6. Cliquez sur **"+ Ajouter un URI"**
7. Dans le nouveau champ, ajoutez :
   ```
   http://localhost:3000/auth/callback
   ```
8. Cliquez sur **Save** (en bas de la page)

## ✅ Configuration Supabase Dashboard

Maintenant, allez dans Supabase Dashboard :

1. **Authentication** → **Providers** → **Google**
2. Activez le toggle **Enable Google provider**
3. Entrez :
   - **Client ID (for OAuth)** : `YOUR_GOOGLE_CLIENT_ID_HERE`
   - **Client Secret (for OAuth)** : `YOUR_GOOGLE_CLIENT_SECRET_HERE`
4. Cliquez sur **Save**

## ✅ Configuration Supabase → URL Configuration

1. **Authentication** → **URL Configuration**
2. **Site URL** : `http://localhost:3000`
3. **Redirect URLs** : Ajoutez ces URLs (une par une avec "+ Add URL") :
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```
4. Cliquez sur **Save**

## 🧪 Tester

1. Vérifiez que `.env.local` existe avec :
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Redémarrez le serveur :
   ```bash
   npm run dev
   ```

3. Allez sur `http://localhost:3000/login`
4. Cliquez sur "Continuer avec Google"
5. Ça devrait fonctionner ! ✅

## 📝 Résumé des valeurs à utiliser

**Google Cloud Console :**
- Client ID : `YOUR_GOOGLE_CLIENT_ID_HERE`
- Client Secret : `YOUR_GOOGLE_CLIENT_SECRET_HERE`

**Supabase Dashboard :**
- Même Client ID et Secret que ci-dessus

**Variables d'environnement (`.env.local`) :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://Dousell-immo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

