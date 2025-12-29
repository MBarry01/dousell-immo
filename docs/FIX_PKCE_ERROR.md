# 🔧 FIX : PKCE Code Verifier Not Found

## 🔴 Erreur Actuelle

```
PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared.
```

**URL d'erreur** : `https://dousell-immo.vercel.app/auth/auth-code-error?reason=PKCE+code+verifier+not+found...`

---

## 🔍 Cause du Problème

Le **flow PKCE** (Proof Key for Code Exchange) stocke un "code verifier" dans le **localStorage/cookies** du navigateur lors de l'inscription.

**Problème** : L'email de confirmation est ouvert dans :
- Un **navigateur différent** (ex: inscription sur Chrome, email ouvert sur Firefox)
- Un **appareil différent** (ex: inscription sur PC, email ouvert sur mobile)
- Le même navigateur mais **localStorage/cookies vidés**

→ Le code verifier n'est **pas retrouvé**, donc l'authentification échoue.

---

## ✅ Solution 1 : Désactiver PKCE (Pour Emails de Confirmation)

La solution recommandée est de désactiver PKCE **uniquement pour les emails de confirmation**, car ils peuvent être ouverts n'importe où.

### Étape 1 : Modifier la Configuration Supabase

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard/project/blyanhulvwpdfpezlaji/auth/providers)
2. Menu **Authentication** → **Providers** → **Email**
3. Chercher **"Email Confirmation Flow"**
4. Sélectionner **"Email OTP"** au lieu de **"Magic Link"**

**⚠️ ATTENTION** : Cette option peut ne pas être disponible selon votre version de Supabase.

### Option Alternative : Utiliser Token Hash au lieu de PKCE

Si l'option ci-dessus n'est pas disponible, modifiez le template email pour utiliser `TokenHash` :

1. Dashboard → **Authentication** → **Email Templates** → **"Confirm signup"**
2. Remplacer le lien par :

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/">
  ✓ Confirmer mon inscription
</a>
```

---

## ✅ Solution 2 : Modifier le Callback pour Gérer les Tokens

Modifions [app/auth/callback/route.ts](c:/Users/Barry/Downloads/Doussel_immo/app/auth/callback/route.ts) pour gérer à la fois PKCE et Token Hash.

### Code Actuel vs Nouveau

Le code actuel ne gère que PKCE (`code`). Nous devons ajouter le support pour `token_hash`.

---

## ✅ Solution 3 : Utiliser verifyOtp au lieu de exchangeCodeForSession

Pour les emails de confirmation, utiliser `verifyOtp` au lieu de `exchangeCodeForSession`.

---

## 🛠️ Implémentation

Je vais modifier le callback pour gérer les deux cas :

