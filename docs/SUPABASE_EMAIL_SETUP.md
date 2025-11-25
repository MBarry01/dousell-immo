# Configuration Email via Supabase Edge Function

## Vue d'ensemble

L'application utilise maintenant l'Edge Function Supabase `send-email-resend` pour envoyer tous les emails. Cette fonction :
- Gère l'envoi via Resend API
- Log automatiquement tous les envois dans la table `email_logs`
- Protégée par une clé d'appel (`APP_INVOKE_KEY`)

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co

# Edge Function Authentication
APP_INVOKE_KEY=votre-cle-secrete-aleatoire

# Resend (géré par l'Edge Function, mais peut être utile pour le fallback)
RESEND_API_KEY=re_xxx...
```

## Configuration Supabase

### 1. Secrets de l'Edge Function

Dans votre dashboard Supabase, allez dans **Project Settings** → **Edge Functions** → **Secrets** et configurez :

- `RESEND_API_KEY` : Votre clé API Resend
- `APP_INVOKE_KEY` : Une clé secrète aléatoire (ex: générée avec `openssl rand -hex 32`)
- `SUPABASE_SERVICE_ROLE_KEY` : Automatiquement disponible dans l'environnement Edge Function
- `SUPABASE_URL` : Automatiquement disponible dans l'environnement Edge Function

### 2. Table email_logs

La table `email_logs` a été créée automatiquement avec la structure suivante :

```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text,
  status text NOT NULL, -- 'sent' ou 'failed'
  resend_response jsonb,
  error_text text,
  user_id uuid NULL,
  created_at timestamptz DEFAULT now()
);
```

## Utilisation dans le code

### Fonction `sendEmail`

La fonction `sendEmail` dans `lib/mail.ts` utilise maintenant l'Edge Function :

```typescript
import { sendEmail } from "@/lib/mail";

await sendEmail({
  to: "user@example.com",
  subject: "Bienvenue !",
  react: <WelcomeEmail />,
  user_id: user.id, // Optionnel : pour lier l'email à un utilisateur
  fromName: "Dousell Immo", // Optionnel
});
```

### Emails automatiquement loggés

Tous les emails envoyés sont automatiquement enregistrés dans `email_logs` avec :
- L'adresse email du destinataire
- Le sujet
- Le statut (sent/failed)
- La réponse complète de Resend
- L'ID utilisateur (si fourni)
- La date d'envoi

## Endpoints protégés

L'Edge Function vérifie le header `Authorization: Bearer <APP_INVOKE_KEY>` avant d'accepter les requêtes.

## Avantages

1. **Centralisation** : Tous les emails passent par une seule fonction
2. **Logging automatique** : Historique complet dans la base de données
3. **Sécurité** : Protection par clé d'appel
4. **Traçabilité** : Lien avec les utilisateurs via `user_id`
5. **Monitoring** : Facile de voir les emails échoués dans `email_logs`

## Monitoring

Pour voir les emails envoyés :

```sql
-- Tous les emails
SELECT * FROM email_logs ORDER BY created_at DESC;

-- Emails échoués
SELECT * FROM email_logs WHERE status = 'failed';

-- Emails par utilisateur
SELECT user_id, COUNT(*) as count 
FROM email_logs 
WHERE user_id IS NOT NULL 
GROUP BY user_id;
```

## Dépannage

### Erreur "APP_INVOKE_KEY not set"
- Vérifiez que `APP_INVOKE_KEY` est défini dans `.env.local`
- Vérifiez que la variable est bien chargée (redémarrez le serveur)

### Erreur "RESEND_API_KEY not set"
- Vérifiez que `RESEND_API_KEY` est défini dans les secrets Supabase
- Allez dans **Project Settings** → **Edge Functions** → **Secrets**

### Emails non loggés
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est disponible dans l'environnement Edge Function
- Vérifiez les logs de l'Edge Function dans le dashboard Supabase

