# Configuration OTP Email - Supabase

Ce guide vous explique comment configurer Supabase pour envoyer des codes OTP (One-Time Password) à 6 chiffres au lieu de liens magiques lors de l'inscription.

## Avantages du système OTP

✅ **Meilleure expérience utilisateur** : L'utilisateur reste sur votre site (pas de redirection)
✅ **Pas d'erreur 404** : Pas de problème de lien expiré ou de code PKCE
✅ **Plus rapide** : L'utilisateur tape directement le code sans changer de fenêtre
✅ **Mobile-friendly** : Idéal pour copier-coller depuis l'app email mobile

## Étape 1 : Activer l'OTP Email dans Supabase

### Dashboard Supabase

1. Allez dans votre projet Supabase : [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Authentication → Email Templates → Confirm signup**

3. Remplacez le template par défaut par celui-ci :

```html
<h2>Confirmez votre inscription</h2>

<p>Bonjour,</p>

<p>Merci de vous être inscrit sur Dousell Immo ! Pour activer votre compte, veuillez entrer le code suivant dans l'application :</p>

<h1 style="font-size: 32px; font-weight: bold; text-align: center; background: #F4C430; color: #000; padding: 20px; border-radius: 8px; letter-spacing: 8px;">
  {{ .Token }}
</h1>

<p style="color: #666; font-size: 14px;">Ce code est valable pendant 1 heure.</p>

<p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>

<p>Cordialement,<br>L'équipe Dousell Immo</p>
```

4. **Sauvegardez** le template.

### Activer l'OTP au lieu du lien magique

1. **Authentication → Providers → Email**

2. ⚠️ **IMPORTANT** : Vérifiez ces paramètres critiques :
   - **"Enable email confirmations"** : **ACTIVÉ** (coché)
   - **"Confirm email"** : **ACTIVÉ** (coché) - Sans cela, les codes OTP ne sont pas envoyés
   - **"Secure email change"** : **ACTIVÉ** (recommandé)

3. **Optionnel** : Si vous utilisez un SMTP personnalisé (recommandé pour la production) :
   - **Authentication → Settings → SMTP Settings**
   - Configurez votre serveur SMTP (Gmail, SendGrid, AWS SES, etc.)
   - **TESTEZ** l'envoi avec le bouton "Send test email"

## Étape 2 : Vérifier la configuration

### Test manuel

1. Lancez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Allez sur [http://localhost:3000/register](http://localhost:3000/register)

3. Créez un compte de test avec un email valide

4. Vérifiez votre boîte mail : vous devriez recevoir un email avec un **code à 6 chiffres**

5. Entrez le code dans le modal OTP qui s'affiche automatiquement

6. Si le code est correct, vous serez automatiquement connecté et redirigé vers la page d'accueil

### Résolution de problèmes

#### Pas d'email reçu lors de l'inscription ou du renvoi ?

1. **Vérifiez les spams** : L'email peut être dans les courriers indésirables

2. **Vérifiez la console du navigateur (F12)** :
   - Recherchez les logs `🔄 Tentative de renvoi du code OTP`
   - Vérifiez s'il y a des erreurs `❌`
   - Copiez le message d'erreur pour diagnostic

3. **Vérifiez les logs Supabase** :
   - Dashboard → Logs → Auth Logs
   - Cherchez les erreurs d'envoi d'email
   - Vérifiez si l'événement `user.signup` apparaît

4. **Vérifiez la configuration Email dans Supabase** :
   - Authentication → Providers → Email
   - **"Confirm email" DOIT être ACTIVÉ** ✅
   - Si désactivé, Supabase ne demandera pas de confirmation et ne enverra pas de code

5. **SMTP non configuré** : Par défaut, Supabase utilise son propre serveur SMTP qui peut avoir des limites. Configurez votre propre SMTP pour la production.

6. **Rate Limiting** : Supabase limite l'envoi d'emails à :
   - **1 email par minute** par adresse email
   - **3 emails par heure** par adresse email
   - Si vous dépassez cette limite, attendez quelques minutes

#### Code invalide ou expiré ?

- Les codes OTP expirent après **1 heure** (par défaut)
- Cliquez sur "Renvoyer le code" pour obtenir un nouveau code

#### Erreur "Token hash not found" ?

- Cette erreur signifie que le système utilise encore l'ancien mode de confirmation par lien
- Vérifiez que vous avez bien modifié le template email
- Vérifiez que "Enable email confirmations" est activé

## Étape 3 : Configuration SMTP (Production)

Pour la production, il est **fortement recommandé** de configurer votre propre serveur SMTP au lieu d'utiliser celui de Supabase.

### Option 1 : Gmail (Développement uniquement)

1. Activez l'authentification à deux facteurs sur votre compte Google

2. Créez un "Mot de passe d'application" :
   - [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

3. Dans Supabase → Authentication → Email Templates → SMTP Settings :
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: votre-email@gmail.com
   Password: [mot de passe d'application]
   ```

### Option 2 : SendGrid (Recommandé pour la production)

1. Créez un compte sur [SendGrid](https://sendgrid.com/)

2. Générez une clé API

3. Dans Supabase → SMTP Settings :
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [votre clé API SendGrid]
   ```

### Option 3 : AWS SES (Production avec volume élevé)

1. Configurez AWS SES dans votre compte AWS

2. Obtenez vos identifiants SMTP

3. Dans Supabase → SMTP Settings :
   ```
   Host: email-smtp.[region].amazonaws.com
   Port: 587
   Username: [SMTP username from AWS]
   Password: [SMTP password from AWS]
   ```

## Étape 4 : Personnalisation avancée

### Modifier la durée de validité du code

Par défaut, les codes OTP expirent après 1 heure. Pour modifier :

1. Utilisez l'API Supabase Admin :
   ```typescript
   const { data, error } = await supabase.auth.admin.updateUser(userId, {
     email_confirm_token_ttl: 3600, // en secondes (1h = 3600s)
   });
   ```

### Personnaliser le template email

Vous pouvez utiliser ces variables dans le template :

- `{{ .Token }}` : Le code OTP à 6 chiffres
- `{{ .SiteURL }}` : L'URL de votre site
- `{{ .ConfirmationURL }}` : L'URL de confirmation (ne pas utiliser en mode OTP)
- `{{ .Email }}` : L'email de l'utilisateur
- `{{ .Data.full_name }}` : Le nom complet (metadata)

## Support

Si vous rencontrez des problèmes :

1. Consultez les logs Supabase : Dashboard → Logs → Auth Logs
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs du serveur Next.js
4. Consultez la documentation Supabase : [https://supabase.com/docs/guides/auth/auth-email](https://supabase.com/docs/guides/auth/auth-email)
