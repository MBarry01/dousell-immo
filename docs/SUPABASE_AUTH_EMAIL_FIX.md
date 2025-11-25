# Correction : Erreur d'envoi de Magic Link / Email Auth Supabase

## Problème

L'erreur `Failed to send magic link email` indique que Supabase Auth n'arrive pas à envoyer les emails de confirmation, magic links, ou réinitialisation de mot de passe.

**Cause** : Supabase Auth n'a pas de SMTP configuré pour envoyer les emails automatiques.

## Solution 1 : Configurer SMTP Resend dans Supabase (Recommandé pour Production)

### Dans le Dashboard Supabase

1. Allez dans **Project Settings** → **Auth** → **SMTP Settings**
2. Configurez votre SMTP (ex: Resend, SendGrid, etc.)

**Pour Resend :**
1. Allez dans votre dashboard Resend → **API Keys**
2. Créez une nouvelle clé API ou utilisez une existante
3. Dans Supabase Dashboard → **Project Settings** → **Auth** → **SMTP Settings** :
   - **Enable Custom SMTP**: ✅ Activé
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) ou `587` (TLS)
   - **Username**: `resend`
   - **Password**: Votre clé API Resend (commence par `re_`)
   - **Sender email**: `onboarding@resend.dev` (pour les tests) ou votre domaine vérifié
   - **Sender name**: `Dousell Immo`
4. Cliquez sur **Save**

**Note** : Pour utiliser votre propre domaine, vous devez d'abord le vérifier dans Resend.

### Alternative : Utiliser l'Edge Function (Solution 2)

Si vous préférez utiliser votre Edge Function `send-email-resend` pour tous les emails Auth, vous devez :

1. **Désactiver les emails automatiques de Supabase Auth**
   - Allez dans **Auth** → **Email Templates**
   - Désactivez l'envoi automatique

2. **Créer des webhooks ou triggers** pour intercepter les événements Auth et appeler votre Edge Function

## Solution 2 : Désactiver la confirmation email (Développement uniquement)

⚠️ **ATTENTION** : Uniquement pour le développement local !

1. Allez dans **Authentication** → **Providers** → **Email**
2. Désactivez **"Enable email confirmations"**
3. Activez **"Auto Confirm Users"** (optionnel, pour auto-confirmer les nouveaux utilisateurs)

Cela permet de se connecter sans confirmation email, mais **ne doit jamais être activé en production**.

**Alternative rapide** : Créez les utilisateurs manuellement dans **Authentication** → **Users** avec **"Auto Confirm User"** activé.

## Solution 3 : Utiliser l'Edge Function pour les emails Auth

### Créer un webhook Auth

1. Créez une nouvelle Edge Function `auth-email-handler`
2. Configurez un webhook dans Supabase Auth qui appelle cette fonction
3. La fonction appelle `send-email-resend` avec le bon template

### Exemple de configuration

Dans **Auth** → **Webhooks** :
- **URL**: `https://votre-projet.supabase.co/functions/v1/auth-email-handler`
- **Events**: `user.created`, `user.updated`, etc.

## Vérification

Pour tester si les emails fonctionnent :

1. Allez dans **Auth** → **Users**
2. Créez un utilisateur de test
3. Vérifiez les logs dans **Logs** → **Auth Logs**
4. Vérifiez la table `email_logs` si vous utilisez l'Edge Function

## Recommandation

**Pour la production**, utilisez la **Solution 1** (SMTP Resend) car :
- ✅ Simple à configurer
- ✅ Fonctionne avec tous les emails Auth (magic links, confirmations, reset password)
- ✅ Pas besoin de code supplémentaire
- ✅ Géré directement par Supabase
- ✅ Les emails sont automatiquement envoyés par Supabase

**Pour le développement**, vous pouvez temporairement utiliser la **Solution 2** (désactiver la confirmation).

## Vérification rapide

Après configuration SMTP :

1. Allez dans **Authentication** → **Users**
2. Créez un nouvel utilisateur ou utilisez un existant
3. Cliquez sur **"Send magic link"** ou **"Send password reset"**
4. Vérifiez que l'email arrive dans la boîte de réception
5. Vérifiez les logs dans **Logs** → **Auth Logs** pour voir les tentatives d'envoi

## Dépannage

### L'email n'arrive toujours pas

1. **Vérifiez les logs Auth** : Dashboard → **Logs** → **Auth Logs**
2. **Vérifiez votre clé Resend** : Assurez-vous qu'elle est valide et active
3. **Vérifiez le spam** : Les emails peuvent être dans les spams
4. **Testez avec un autre email** : Certains domaines bloquent les emails automatiques
5. **Vérifiez le domaine Resend** : Si vous utilisez `onboarding@resend.dev`, assurez-vous qu'il n'est pas bloqué

### Erreur "Invalid SMTP credentials"

- Vérifiez que le **Username** est exactement `resend` (en minuscules)
- Vérifiez que le **Password** est votre clé API Resend complète (commence par `re_`)
- Vérifiez que le **Port** est correct (465 pour SSL, 587 pour TLS)

