# 🏠 Commencer sans domaine (Configuration minimale)

## 🎯 Objectif

Configurer OAuth Google pour fonctionner **uniquement en local** pour l'instant. Vous ajouterez le domaine plus tard.

---

## ✅ Configuration minimale (5 minutes)

### 1. Google Cloud Console

**OAuth consent screen** :
- App name : `Doussel Immo`
- Scopes : Cochez `email`, `profile`, `openid`
- Test users : Ajoutez votre email

**OAuth Client ID** :
- Type : Web application
- **Authorized JavaScript origins** :
  ```
  http://localhost:3000
  ```
- **Authorized redirect URIs** :
  ```
  https://votre-projet.supabase.co/auth/v1/callback
  http://localhost:3000/auth/callback
  ```

### 2. Supabase Dashboard

**Google Provider** :
- Activez Google
- Collez Client ID et Secret

**URL Configuration** :
- Site URL : `http://localhost:3000`
- Redirect URLs :
  ```
  http://localhost:3000/**
  http://localhost:3000/auth/callback
  ```

### 3. Fichier `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Tester

```bash
npm run dev
```

Allez sur `http://localhost:3000/login` → Cliquez sur "Continuer avec Google"

**Ça devrait fonctionner ! ✅**

---

## 🚀 Ajouter le domaine plus tard

Quand vous aurez un domaine (ex: `doussel-immo.vercel.app` ou votre domaine custom) :

1. **Google Cloud Console** → Ajoutez les URLs de production
2. **Supabase Dashboard** → Ajoutez les URLs de production
3. **Variables d'environnement** → Changez `NEXT_PUBLIC_APP_URL`

**C'est tout !** La même configuration fonctionnera pour les deux environnements.

