# 🔧 FIX : Email Link is Invalid or Has Expired

## 🔴 Erreur Actuelle

```
Erreur d'authentification
Email link is invalid or has expired

URL: https://dousell-immo.vercel.app/auth/auth-code-error?reason=Email+link+is+invalid+or+has+expired#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

**Code d'erreur**: `otp_expired`

---

## 🔍 Causes Possibles

1. ❌ **Lien expiré** : Le lien de confirmation a une durée de validité limitée (par défaut 24h)
2. ❌ **Lien déjà utilisé** : Vous avez déjà cliqué sur le lien une première fois
3. ❌ **URL de redirection incorrecte** : La configuration Supabase n'autorise pas `https://dousell-immo.vercel.app/auth/callback`
4. ❌ **PKCE Flow mal configuré** : Le flux d'authentification PKCE n'est pas correctement paramétré
5. ❌ **Configuration SMTP** : L'email contient un lien malformé

---

## ✅ Solution 1 : Vérifier les URLs Autorisées dans Supabase

### Étape 1 : Accéder à la Configuration

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard/project/blyanhulvwpdfpezlaji)
2. Menu **Authentication** → **URL Configuration**

### Étape 2 : Configurer les URLs de Redirection

Dans **"Redirect URLs"**, assurez-vous d'avoir **EXACTEMENT** ces URLs :

```
http://localhost:3000/auth/callback
https://dousell-immo.vercel.app/auth/callback
```

**IMPORTANT** :
- Pas de slash `/` à la fin
- Utilisez `https://` pour Vercel (pas `http://`)
- Pas d'espaces avant/après

### Étape 3 : Configurer le Site URL

**Site URL** : `https://dousell-immo.vercel.app`

**IMPORTANT** : Pas de slash `/` à la fin

### Étape 4 : Sauvegarder

Cliquez sur **"Save"** en bas de la page

---

## ✅ Solution 2 : Augmenter la Durée de Validité du Lien

### Étape 1 : Accéder aux Paramètres Auth

1. Dashboard Supabase → **Authentication** → **Settings**

### Étape 2 : Modifier le Délai d'Expiration

Cherchez **"Email OTP Expiry"** ou **"Email Link Expiry"**

**Valeur recommandée** : `86400` (24 heures)

Si vous voulez prolonger pour les tests : `259200` (72 heures)

---

## ✅ Solution 3 : Corriger le Template Email

Le template email doit utiliser la **bonne variable** pour le lien de confirmation.

### Étape 1 : Vérifier le Template

1. Dashboard Supabase → **Authentication** → **Email Templates** → **"Confirm signup"**

### Étape 2 : Utiliser la Bonne Variable

**❌ INCORRECT** :
```html
<a href="{{ .ConfirmationURL }}">Confirmer</a>
```

**✅ CORRECT** (selon votre version de Supabase) :
```html
<!-- Option 1 : Variable Token (ancien format) -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirmer</a>

<!-- Option 2 : Variable ConfirmationURL (nouveau format) -->
<a href="{{ .ConfirmationURL }}">Confirmer</a>
```

### Étape 3 : Template Complet Corrigé

Remplacez **uniquement** la ligne du bouton par :

```html
<div class="button-container">
  <a href="{{ .ConfirmationURL }}" class="button">
    ✓ Confirmer mon inscription
  </a>
</div>

<!-- Lien de secours -->
<p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
<p style="word-break: break-all; color: #F4C430; font-size: 14px;">{{ .ConfirmationURL }}</p>
```

**Si ça ne fonctionne toujours pas**, essayez cette alternative :

```html
<div class="button-container">
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/" class="button">
    ✓ Confirmer mon inscription
  </a>
</div>
```

---

## ✅ Solution 4 : Vérifier les Variables Disponibles

### Tester les Variables Email

Créez un template de test pour voir quelles variables sont disponibles :

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Test Variables</h1>
  <p>SiteURL: {{ .SiteURL }}</p>
  <p>ConfirmationURL: {{ .ConfirmationURL }}</p>
  <p>Token: {{ .Token }}</p>
  <p>TokenHash: {{ .TokenHash }}</p>
  <p>Email: {{ .Email }}</p>
</body>
</html>
```

Envoyez-vous un email de test pour voir ce qui s'affiche.

---

## ✅ Solution 5 : Activer le Mode "Auto-confirm Email"

**Pour les tests uniquement**, vous pouvez désactiver la confirmation email.

### Étape 1 : Désactiver la Confirmation Email

1. Dashboard Supabase → **Authentication** → **Providers** → **Email**
2. **Décochez** "Enable email confirmation"
3. Cliquez sur **"Save"**

**⚠️ ATTENTION** : En production, gardez cette option **activée** pour la sécurité !

---

## ✅ Solution 6 : Vérifier le Code de Callback

Votre fichier [app/auth/callback/route.ts](c:/Users/Barry/Downloads/Doussel_immo/app/auth/callback/route.ts) est correct, mais vérifions qu'il gère bien tous les cas.

### Code Actuel (Vérifié ✅)

Le code existant est bon. Il gère :
- ✅ Échange du code pour une session
- ✅ Redirection vers page d'erreur si problème
- ✅ Logs pour debugging

---

## 🧪 Test de la Correction

### Méthode 1 : Renvoyer l'Email de Confirmation

1. **Aller sur** `https://dousell-immo.vercel.app/auth/check-email?email=VOTRE_EMAIL`
2. **Cliquer** sur "Renvoyer l'email"
3. **Vérifier** votre boîte email (+ spams)
4. **Cliquer** sur le nouveau lien

### Méthode 2 : Créer un Nouveau Compte

1. **Aller sur** `https://dousell-immo.vercel.app/register`
2. **Utiliser un nouvel email** (différent du précédent)
3. **Vérifier** l'email reçu
4. **Cliquer** sur le lien dans les **5 minutes** suivant la réception

### Méthode 3 : Test Local

```bash
npm run dev
```

1. **Aller sur** `http://localhost:3000/register`
2. **Créer un compte** avec un email test
3. **Vérifier** l'email
4. **Cliquer** sur le lien

**Résultat attendu** :
- ✅ Redirection vers `http://localhost:3000/auth/callback?code=...`
- ✅ Puis redirection vers `/` ou `/login`
- ✅ Message "Email vérifié avec succès"

---

## 🔍 Debugging Avancé

### Vérifier les Logs Supabase

1. Dashboard → **Logs** → **Auth Logs**
2. Chercher les événements **"signup"** ou **"email_confirmation"**
3. Vérifier s'il y a des erreurs

### Exemple de Log Normal

```json
{
  "event": "user.signup",
  "email": "test@example.com",
  "confirmed_at": null,
  "email_sent": true
}
```

### Exemple de Log avec Erreur

```json
{
  "event": "token.verification_failed",
  "error": "Token expired",
  "email": "test@example.com"
}
```

---

## 📋 Checklist de Vérification

Avant de réessayer, vérifiez :

- [ ] URLs de redirection configurées dans Supabase (`/auth/callback`)
- [ ] Site URL configuré : `https://dousell-immo.vercel.app`
- [ ] Template email utilise `{{ .ConfirmationURL }}`
- [ ] SMTP Gmail configuré et testé
- [ ] Délai d'expiration email suffisant (24h minimum)
- [ ] Pas de faute de frappe dans les URLs (pas de slash final)
- [ ] Email confirmation activée dans les paramètres

---

## 🚀 Solution Rapide (Production)

Si vous devez **débloquer rapidement** des utilisateurs :

### Option 1 : Confirmer Manuellement dans Supabase

1. Dashboard → **Authentication** → **Users**
2. Chercher l'utilisateur par email
3. Cliquer sur l'utilisateur
4. Cliquer sur **"Confirm Email"**

### Option 2 : Réinitialiser le Mot de Passe

1. L'utilisateur va sur `/login`
2. Clique sur "Mot de passe oublié ?"
3. Reçoit un email de réinitialisation
4. Change son mot de passe
5. **→ Email confirmé automatiquement**

---

## 📝 Configuration Recommandée (Résumé)

### Supabase Dashboard

**Authentication → URL Configuration** :
```
Redirect URLs:
  http://localhost:3000/auth/callback
  https://dousell-immo.vercel.app/auth/callback

Site URL:
  https://dousell-immo.vercel.app
```

**Authentication → Email Templates → Confirm Signup** :
```html
<a href="{{ .ConfirmationURL }}" class="button">
  ✓ Confirmer mon inscription
</a>
```

**Authentication → Providers → Email** :
```
✓ Enable email confirmation (activé)
Email OTP Expiry: 86400 (24h)
```

---

## 🎯 Prochaines Étapes

1. **Appliquer** les corrections ci-dessus dans le Dashboard Supabase
2. **Tester** avec un nouveau compte (nouvel email)
3. **Vérifier** que le lien de confirmation fonctionne
4. **Si ça ne marche toujours pas**, activer temporairement "Auto-confirm" pour débloquer

---

**Créé le** : 2025-12-29
**Status** : 🔧 En cours de correction
