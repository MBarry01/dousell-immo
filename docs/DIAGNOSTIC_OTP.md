# Diagnostic OTP - Problème d'email non reçu

## 🔍 Analyse des logs

D'après vos logs Supabase, voici ce que j'observe :

### ✅ Ce qui fonctionne
- Le renvoi du code retourne `status: 200` (succès)
- L'API Supabase répond correctement
- Pas d'erreur de rate limiting visible

### ❌ Problèmes identifiés

1. **Erreur "User from sub claim in JWT does not exist"**
   - Cela signifie que l'utilisateur a été supprimé ou n'existe plus
   - Le JWT (session) existe encore, mais pas l'utilisateur

2. **Email non reçu malgré status 200**
   - Supabase dit avoir envoyé l'email, mais vous ne le recevez pas
   - Cela indique un problème de configuration SMTP

## 🛠️ Solution étape par étape

### Étape 1 : Nettoyer les utilisateurs de test

1. Allez dans **Supabase Dashboard → Authentication → Users**

2. **Supprimez TOUS les utilisateurs de test** avec votre email

3. Attendez **5 minutes** (pour le rate limiting)

### Étape 2 : Vérifier la configuration Email

Allez dans **Supabase Dashboard → Authentication → Providers → Email**

Vérifiez que ces paramètres sont **TOUS activés** :

- ✅ **Enable email provider**
- ✅ **Confirm email** ← CRITIQUE
- ✅ **Enable email confirmations**
- ❌ **Secure email change** (optionnel)

**Capture d'écran de la configuration attendue :**
```
Email Auth
├─ Enable email provider: ON
├─ Confirm email: ON
├─ Enable email confirmations: ON
└─ Mailer templates: Custom (voir étape 3)
```

### Étape 3 : Configurer le template email OTP

1. **Authentication → Email Templates → Confirm signup**

2. Remplacez **TOUT** le contenu par ce template :

```html
<h2>Confirmez votre inscription - Dousell Immo</h2>

<p>Bonjour,</p>

<p>Merci de vous être inscrit sur <strong>Dousell Immo</strong> ! Pour activer votre compte, veuillez entrer le code suivant dans l'application :</p>

<div style="background: #F4C430; color: #000; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
  <h1 style="font-size: 48px; font-weight: bold; letter-spacing: 12px; margin: 0;">
    {{ .Token }}
  </h1>
</div>

<p style="color: #666; font-size: 14px; margin-top: 20px;">
  ⏰ Ce code est valable pendant <strong>1 heure</strong>.
</p>

<p style="margin-top: 30px;">
  Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
</p>

<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

<p style="color: #999; font-size: 12px;">
  Cordialement,<br>
  L'équipe <strong>Dousell Immo</strong><br>
  La plateforme immobilière de luxe au Sénégal 🏡
</p>
```

3. **Cliquez sur "Save"**

### Étape 4 : Configurer SMTP (Gmail pour test)

**⚠️ IMPORTANT** : Par défaut, Supabase utilise son propre SMTP qui peut avoir des problèmes. Pour les tests, utilisez Gmail :

1. **Activez l'authentification à 2 facteurs** sur votre compte Google
   - [https://myaccount.google.com/security](https://myaccount.google.com/security)

2. **Créez un mot de passe d'application** :
   - [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Application : "Autre (nom personnalisé)" → "Supabase Dousell"
   - Copiez le mot de passe généré (16 caractères)

3. Dans **Supabase Dashboard → Settings → Auth → SMTP Settings** :
   ```
   Enable Custom SMTP: ON

   Sender email: votre-email@gmail.com
   Sender name: Dousell Immo

   Host: smtp.gmail.com
   Port number: 587

   Username: votre-email@gmail.com
   Password: [collez le mot de passe d'application]
   ```

4. **Cliquez sur "Save"**

5. **TESTEZ** l'envoi avec le bouton **"Send test email"**
   - Entrez votre email
   - Cliquez sur "Send test email"
   - Vérifiez votre boîte mail (et spams)

### Étape 5 : Tester l'inscription complète

1. **Supprimez les cookies du site** (F12 → Application → Cookies → Tout supprimer)

2. **Créez un nouveau compte** avec un email différent (ou le même après nettoyage)

3. Vérifiez votre boîte mail **ET les spams**

4. Vous devriez recevoir un email avec un code à 6 chiffres

## 🐛 Si ça ne marche toujours pas

### Test 1 : Vérifier les logs Supabase

1. **Dashboard → Logs → Auth Logs**

2. Cherchez l'événement `user.signup`

3. Si vous voyez une erreur SMTP, notez-la

### Test 2 : Vérifier l'email de fallback Supabase

Peut-être que Supabase envoie les emails à une adresse différente.

1. **Dashboard → Settings → General**

2. Vérifiez **"Support email"** - c'est l'email utilisé par défaut

### Test 3 : Désactiver temporairement la confirmation

Pour tester si le problème vient vraiment de l'email :

1. **Authentication → Providers → Email**

2. **Décochez "Confirm email"**

3. Créez un nouveau compte

4. Si ça fonctionne sans confirmation, le problème est bien l'envoi d'email

## 📧 Pourquoi Gmail peut bloquer les emails

Gmail peut bloquer les emails Supabase si :
- Vous n'avez pas activé le mot de passe d'application
- Votre compte Gmail a la vérification en 2 étapes désactivée
- Le SMTP n'est pas configuré avec les bons paramètres

## 🚀 Solution de production

Pour la production, **n'utilisez PAS Gmail**. Utilisez plutôt :

### SendGrid (Recommandé)
- Gratuit jusqu'à 100 emails/jour
- Configuration facile
- Très fiable

**Configuration SendGrid :**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [votre clé API SendGrid]
```

### Resend (Alternative moderne)
- Gratuit jusqu'à 3 000 emails/mois
- Interface moderne
- Excellent pour Next.js

## 📞 Besoin d'aide ?

Si après toutes ces étapes vous ne recevez toujours pas d'email :

1. **Copiez-moi les logs de la console** (F12) quand vous cliquez sur "Renvoyer le code"

2. **Faites une capture d'écran** de votre configuration Email dans Supabase

3. **Vérifiez les logs SMTP** dans Supabase Dashboard → Logs → Auth Logs

Je pourrai alors vous aider à diagnostiquer le problème exact.
