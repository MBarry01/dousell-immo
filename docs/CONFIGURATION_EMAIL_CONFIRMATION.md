# Configuration Email de Confirmation - Supabase

## Problème Identifié

Votre workflow d'inscription présentait 3 problèmes majeurs :

### 1. ❌ Erreur HIBP "Failed to fetch"
- **Cause**: Appel d'une Edge Function Supabase depuis le client (problèmes CORS)
- **Solution**: ✅ Vérification HIBP déplacée côté serveur uniquement

### 2. ❌ Template Email non utilisé
- Le fichier `emails/confirm-signup-template.html` existe mais **Supabase n'utilise pas ce template par défaut**
- **Solution**: Configurer manuellement dans le Dashboard Supabase

### 3. ❌ Workflow de confirmation peu clair
- Pas de redirection vers page de vérification email
- **Solution**: ✅ Redirection vers `/auth/check-email?email=...`

---

## ✅ Corrections Appliquées

### 1. Suppression de la vérification HIBP côté client
- ✅ Supprimé l'appel `checkPasswordHIBP()` dans `app/register/page.tsx:232`
- ✅ La vérification se fait maintenant **uniquement côté serveur** dans `app/auth/actions.ts:42`
- ✅ Plus d'erreur "Failed to fetch"

### 2. Amélioration du workflow d'inscription
- ✅ Redirection automatique vers `/auth/check-email` après inscription
- ✅ Page de vérification email avec :
  - Bouton "Renvoyer l'email"
  - Détection automatique de la vérification
  - Redirection auto vers `/login` après confirmation

---

## 📧 Configuration du Template Email Supabase

### Étape 1 : Accéder aux Templates Email

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : `blyanhulvwpdfpezlaji`
3. Menu **Authentication** → **Email Templates**

### Étape 2 : Configurer le Template "Confirm Signup"

1. Cliquez sur **"Confirm signup"**
2. **IMPORTANT** : Utilisez `token_hash` au lieu de `ConfirmationURL` pour éviter les erreurs PKCE
3. Remplacez le template par défaut par celui-ci :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre inscription - Dousell Immo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #121212;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #F4C430 0%, #D4A028 100%);
      padding: 40px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #000000;
    }
    .content {
      padding: 40px 24px;
    }
    .content h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #ffffff;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
      color: #d1d5db;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #F4C430 0%, #D4A028 100%);
      color: #000000 !important;
      text-decoration: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(244, 196, 48, 0.3);
    }
    .info-box {
      background-color: #1a1a1a;
      border-left: 4px solid #F4C430;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #9ca3af;
    }
    .footer {
      padding: 24px;
      text-align: center;
      background-color: #0a0a0a;
      border-top: 1px solid #2a2a2a;
    }
    .footer p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6b7280;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Dousell Immo</div>
      <p style="margin: 8px 0 0 0; color: #000000; font-size: 16px;">L'immobilier de confiance au Sénégal</p>
    </div>

    <div class="content">
      <h2>Bienvenue sur Dousell Immo ! 🎉</h2>
      <p>Merci de vous être inscrit sur notre plateforme. Vous êtes à un clic d'accéder aux meilleures offres immobilières de Dakar et de la Petite Côte.</p>
      <p>Pour activer votre compte et commencer à explorer nos biens, cliquez sur le bouton ci-dessous :</p>

      <div class="button-container">
        <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/" class="button">
          ✓ Confirmer mon inscription
        </a>
      </div>

      <div class="info-box">
        <p><strong>⏱️ Ce lien est valable pendant 24 heures.</strong></p>
        <p>Après ce délai, vous devrez demander un nouveau lien de confirmation.</p>
      </div>

      <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #F4C430; font-size: 14px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/</p>

      <p style="margin-top: 32px;">Une fois votre compte activé, vous pourrez :</p>
      <ul style="color: #d1d5db; line-height: 1.8;">
        <li>Publier vos annonces immobilières</li>
        <li>Contacter des vendeurs et propriétaires</li>
        <li>Enregistrer vos biens favoris</li>
        <li>Recevoir des alertes personnalisées</li>
      </ul>
    </div>

    <div class="footer">
      <p>Vous n'avez pas demandé ce lien ? Ignorez simplement cet email.</p>
      <p style="margin-top: 16px; color: #4b5563;">
        © 2025 Dousell Immo. Tous droits réservés.<br>
        Dakar, Sénégal
      </p>
    </div>
  </div>
</body>
</html>
```

3. **Variables disponibles** :
   - `{{ .ConfirmationURL }}` : Lien de confirmation automatique
   - `{{ .SiteURL }}` : URL de votre application

4. Cliquez sur **"Save"**

### Étape 3 : Vérifier la Configuration SMTP

1. Menu **Authentication** → **Email Provider**
2. Assurez-vous que **SMTP** est configuré avec Gmail :
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `mb3186802@gmail.com`
   - **Password**: Votre **App Password** Gmail (16 caractères)
   - **Sender Email**: `mb3186802@gmail.com`
   - **Sender Name**: `Dousell Immo`

3. Testez l'envoi d'email via **"Send Test Email"**

### Étape 4 : Configurer l'URL de Redirection

1. Menu **Authentication** → **URL Configuration**
2. Ajoutez ces URLs dans **"Redirect URLs"** :
   ```
   http://localhost:3000/auth/callback
   https://dousell-immo.vercel.app/auth/callback
   ```

3. **Site URL** : `https://dousell-immo.vercel.app`

---

## 🧪 Test du Workflow Complet

### Test 1 : Inscription Locale

```bash
npm run dev
```

1. Allez sur `http://localhost:3000/register`
2. Remplissez le formulaire avec un email valide
3. Vérifiez que vous êtes redirigé vers `/auth/check-email`
4. Vérifiez votre boîte email (Gmail)
5. Cliquez sur le bouton **"Confirmer mon inscription"**
6. Vérifiez que vous êtes redirigé vers `/login`

### Test 2 : Vérifier les Logs

Pendant le test, surveillez les logs :

```bash
# Dans un terminal
npm run dev

# Ouvrez la console navigateur (F12)
# Vérifiez qu'il n'y a plus d'erreur "Failed to fetch"
```

### Test 3 : Renvoyer l'Email

1. Sur `/auth/check-email`, cliquez sur **"Renvoyer l'email"**
2. Vérifiez que vous recevez un nouvel email
3. Le délai entre 2 envois est **60 secondes** (limitation Supabase)

---

## 🔍 Dépannage

### Problème : Pas d'email reçu

1. **Vérifiez les spams** dans Gmail
2. **Vérifiez les logs Supabase** :
   - Dashboard → Logs → Auth Logs
   - Recherchez "signup" ou l'email de test

3. **Vérifiez la configuration SMTP** :
   - Le mot de passe Gmail doit être un **App Password**, pas votre mot de passe principal
   - Générez un App Password : https://myaccount.google.com/apppasswords

### Problème : Erreur "Error sending confirmation email"

1. **Vérifiez le Dashboard Supabase** → Authentication → SMTP Settings
2. **Testez l'envoi** via "Send Test Email"
3. Si l'erreur persiste, vérifiez les logs :
   ```bash
   # Dans app/auth/actions.ts:146
   console.error("⚠️ ERREUR SMTP PROBABLE : Vérifiez la configuration SMTP")
   ```

### Problème : "Failed to fetch" persiste

✅ **Ce problème est normalement résolu** par les modifications apportées.

Si vous voyez encore cette erreur :
1. Vérifiez que vous avez bien redémarré le serveur Next.js
2. Videz le cache du navigateur (Ctrl+Shift+R)
3. Vérifiez qu'il n'y a plus d'import de `checkPasswordHIBP` dans `app/register/page.tsx`

---

## 📝 Résumé des Fichiers Modifiés

1. ✅ `lib/hibp.ts` : Vérification HIBP désactivée côté client
2. ✅ `app/register/page.tsx` :
   - Suppression de l'appel HIBP client
   - Redirection vers `/auth/check-email`
3. ✅ `app/auth/actions.ts` : Vérification HIBP côté serveur (déjà en place)
4. ✅ `docs/CONFIGURATION_EMAIL_CONFIRMATION.md` : Ce guide

---

## 🚀 Prochaines Étapes

1. **Configurez le template email** dans le Dashboard Supabase
2. **Testez l'inscription** en local
3. **Vérifiez les emails** Gmail
4. **Déployez sur Vercel** une fois les tests OK

---

## 💡 Conseils de Sécurité

- ✅ La vérification HIBP est maintenant **côté serveur uniquement**
- ✅ Les mots de passe compromis sont bloqués avant création du compte
- ✅ Rate limiting Turnstile (Captcha) activé
- ✅ Rate limiting Supabase (5 tentatives max par heure)
