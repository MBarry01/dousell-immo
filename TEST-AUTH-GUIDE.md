# 🧪 Guide de Test - Authentification Email

## ✅ Configuration actuelle

- **Redirect URLs configurées** : `http://localhost:3000/**` et `https://dousell-immo.vercel.app/**`
- **Email confirmation** : Requise (auto-confirm désactivé)
- **Route de vérification** : `/auth/confirm` (évite les erreurs PKCE)

---

## 📋 Test manuel complet

### Étape 1 : Préparer l'environnement

```bash
npm run dev
```

Le serveur doit démarrer sur `http://localhost:3000`

---

### Étape 2 : Créer un compte

1. Allez sur **http://localhost:3000/register**
2. Remplissez le formulaire avec :
   - **Nom complet** : Test User
   - **Email** : Votre vrai email (vous devez recevoir l'email de confirmation)
   - **Téléphone** : +221771234567
   - **Mot de passe** : TestPassword123!
   - **Confirmer mot de passe** : TestPassword123!
3. Complétez le CAPTCHA Cloudflare Turnstile
4. Cliquez sur **S'inscrire**

---

### Étape 3 : Vérifier les logs

Dans la console du serveur (`npm run dev`), vous devriez voir :

```
📧 Email de confirmation envoyé automatiquement par Supabase
🔗 L'utilisateur sera connecté automatiquement après avoir cliqué sur le lien
```

---

### Étape 4 : Cliquer sur le lien dans l'email

1. **Ouvrez votre boîte email**
2. Cherchez l'email de **Dousell Immo** (ou Supabase si pas personnalisé)
3. **Cliquez sur le lien de confirmation**
4. Le lien devrait ressembler à :
   ```
   http://localhost:3000/auth/confirm?token_hash=...&type=signup
   ```

---

### Étape 5 : Vérifier la connexion automatique

Après avoir cliqué sur le lien, vous devriez :

1. ✅ Être **automatiquement redirigé** vers la home (`http://localhost:3000/?verified=true`)
2. ✅ Voir un **toast de succès** :
   ```
   ✅ Email vérifié avec succès !
   Votre compte est maintenant actif. Bienvenue sur Dousell Immo !
   ```
3. ✅ Être **connecté** (bouton "Mon compte" visible dans le header)

---

### Étape 6 : Vérifier les logs du serveur

Dans la console, vous devriez voir :

```
🔍 Auth Confirm Debug: { token_hash: '✓ présent', type: 'signup', ... }
✅ Email vérifié avec succès
```

---

## 🐛 Dépannage

### Problème : "PKCE code verifier not found in storage"

**Cause** : L'email pointe encore vers `/auth/callback` au lieu de `/auth/confirm`

**Solution** :
1. Supprimez l'utilisateur de test dans Supabase Dashboard
2. Créez un nouveau compte (les nouveaux emails utiliseront `/auth/confirm`)

---

### Problème : "Email link is invalid or has expired"

**Cause** : Le token a expiré (durée de vie : 1 heure par défaut)

**Solution** :
1. Demandez un nouvel email de confirmation
2. OU créez un nouveau compte

---

### Problème : Redirection vers `/auth/auth-code-error`

**Cause** : Erreur lors de la vérification du token

**Solution** :
1. Vérifiez les logs du serveur pour voir l'erreur exacte
2. Vérifiez que le redirect URL est bien dans la liste autorisée du Dashboard Supabase

---

## 🎯 Ce qui devrait fonctionner maintenant

1. ✅ **Inscription** sans erreur
2. ✅ **Email de confirmation** envoyé par Supabase
3. ✅ **Lien de confirmation** pointe vers `/auth/confirm` (pas `/auth/callback`)
4. ✅ **Vérification** fonctionne avec `verifyOtp()` (pas de PKCE)
5. ✅ **Connexion automatique** après vérification
6. ✅ **Toast de bienvenue** s'affiche sur la home
7. ✅ **Pas d'erreur PKCE** !

---

## 📧 Template email personnalisé (optionnel)

Si vous voulez personnaliser l'email de confirmation :

1. Allez sur **Dashboard Supabase** → **Authentication** → **Email Templates**
2. Sélectionnez **"Confirm signup"**
3. Personnalisez le contenu (français, design Dousell Immo, etc.)
4. Le lien `{{ .ConfirmationURL }}` pointera automatiquement vers `/auth/confirm`

---

## ✅ Résultat attendu

Flow complet style Firebase :
1. 📝 Inscription
2. 📧 Email envoyé
3. 🔗 Clic sur le lien
4. ✅ Connexion automatique
5. 🎉 Bienvenue !
