# Configuration Gmail pour l'envoi d'emails

## Vue d'ensemble

Le service d'envoi d'emails utilise **Nodemailer** avec **Gmail SMTP** pour envoyer les emails transactionnels (factures, notifications, etc.).

## Configuration

### 1. Créer un mot de passe d'application Gmail

1. Allez sur [Google Account](https://myaccount.google.com/)
2. Sélectionnez **Sécurité** dans le menu de gauche
3. Activez la **Validation en deux étapes** si ce n'est pas déjà fait
4. Faites défiler jusqu'à **Mots de passe des applications**
5. Sélectionnez **Application** : "Autre (nom personnalisé)"
6. Entrez "Doussel Immo" comme nom
7. Cliquez sur **Générer**
8. **Copiez le mot de passe à 16 caractères** (sans espaces)

### 2. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Configuration Gmail
GMAIL_USER=mb3186802@gmail.com
GMAIL_APP_PASSWORD=zpgvuyffanvdiyio

# Email de l'admin (pour les notifications)
ADMIN_EMAIL=barrymohamadou98@gmail.com
```

⚠️ **Important** : Ne commitez **JAMAIS** ces valeurs dans Git. Elles doivent rester dans `.env.local` (qui est dans `.gitignore`).

### 3. Configuration SMTP

Le service utilise automatiquement :
- **Host** : `smtp.gmail.com`
- **Port** : `465`
- **Secure** : `true` (SSL/TLS)
- **From** : `"Doussel Immo Support" <votre-email@gmail.com>`

## Utilisation

### Envoyer un email simple

```typescript
import { sendEmail } from "@/lib/mail";

await sendEmail({
  to: "client@example.com",
  subject: "Bienvenue sur Doussel Immo",
  html: "<h1>Bonjour !</h1><p>Merci de nous rejoindre.</p>",
});
```

### Envoyer un email avec React Email

```typescript
import { sendEmail } from "@/lib/mail";
import { WelcomeEmail } from "@/emails/welcome-email";

await sendEmail({
  to: "client@example.com",
  subject: "Bienvenue",
  react: <WelcomeEmail name="John" />,
});
```

### Envoyer une facture

```typescript
import { sendInvoiceEmail } from "@/lib/mail";
import fs from "fs";

const pdfBuffer = fs.readFileSync("facture.pdf");

await sendInvoiceEmail({
  to: "client@example.com",
  clientName: "John Doe",
  pdfBuffer: pdfBuffer,
  invoiceNumber: "FAC-2025-001",
  amount: 1500,
});
```

## Fonctionnalités

### ✅ Nom d'expéditeur professionnel

Les emails sont envoyés avec le nom **"Doussel Immo Support"** au lieu de simplement l'adresse email, ce qui donne un aspect plus professionnel.

### ✅ Logging détaillé

Le service log automatiquement :
- ✅ Succès : `Email envoyé avec succès` avec messageId
- ❌ Erreurs : Messages d'erreur détaillés

### ✅ Support des pièces jointes

Vous pouvez attacher des fichiers (PDF, images, etc.) :

```typescript
await sendEmail({
  to: "client@example.com",
  subject: "Document",
  html: "<p>Voir pièce jointe</p>",
  attachments: [
    {
      filename: "document.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});
```

## Dépannage

### Erreur : "Invalid login"

- Vérifiez que `GMAIL_APP_PASSWORD` est correct (16 caractères, sans espaces)
- Assurez-vous que la validation en deux étapes est activée
- Vérifiez que vous utilisez un **mot de passe d'application**, pas votre mot de passe Gmail normal

### Erreur : "Connection timeout"

- Vérifiez votre connexion internet
- Certains réseaux (entreprises, écoles) bloquent le port 465
- Essayez d'utiliser un VPN ou un autre réseau

### Erreur : "Message rejected"

- Vérifiez que l'adresse email de destination est valide
- Gmail peut limiter le nombre d'emails envoyés par jour (500 pour les comptes gratuits)
- Vérifiez que votre compte Gmail n'est pas suspendu

### Les emails arrivent en spam

- Ajoutez votre domaine dans les paramètres Gmail (si vous avez un domaine personnalisé)
- Utilisez un service professionnel comme SendGrid ou Resend pour la production
- Vérifiez que le contenu HTML est valide

## Limites Gmail

- **500 emails/jour** pour les comptes Gmail gratuits
- **2000 emails/jour** pour Google Workspace
- **Taille max** : 25 MB par email (avec pièces jointes)

## Production

Pour la production, considérez :
- **SendGrid** : Service professionnel avec API
- **Resend** : Service moderne avec React Email
- **AWS SES** : Solution AWS scalable
- **Postmark** : Service spécialisé transactionnel

Le service actuel (`lib/mail-gmail.ts`) peut être facilement remplacé par un autre service en modifiant uniquement `lib/mail.ts`.

## Références

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [React Email](https://react.email/)


## Vue d'ensemble

Le service d'envoi d'emails utilise **Nodemailer** avec **Gmail SMTP** pour envoyer les emails transactionnels (factures, notifications, etc.).

## Configuration

### 1. Créer un mot de passe d'application Gmail

1. Allez sur [Google Account](https://myaccount.google.com/)
2. Sélectionnez **Sécurité** dans le menu de gauche
3. Activez la **Validation en deux étapes** si ce n'est pas déjà fait
4. Faites défiler jusqu'à **Mots de passe des applications**
5. Sélectionnez **Application** : "Autre (nom personnalisé)"
6. Entrez "Doussel Immo" comme nom
7. Cliquez sur **Générer**
8. **Copiez le mot de passe à 16 caractères** (sans espaces)

### 2. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Configuration Gmail
GMAIL_USER=mb3186802@gmail.com
GMAIL_APP_PASSWORD=zpgvuyffanvdiyio

# Email de l'admin (pour les notifications)
ADMIN_EMAIL=barrymohamadou98@gmail.com
```

⚠️ **Important** : Ne commitez **JAMAIS** ces valeurs dans Git. Elles doivent rester dans `.env.local` (qui est dans `.gitignore`).

### 3. Configuration SMTP

Le service utilise automatiquement :
- **Host** : `smtp.gmail.com`
- **Port** : `465`
- **Secure** : `true` (SSL/TLS)
- **From** : `"Doussel Immo Support" <votre-email@gmail.com>`

## Utilisation

### Envoyer un email simple

```typescript
import { sendEmail } from "@/lib/mail";

await sendEmail({
  to: "client@example.com",
  subject: "Bienvenue sur Doussel Immo",
  html: "<h1>Bonjour !</h1><p>Merci de nous rejoindre.</p>",
});
```

### Envoyer un email avec React Email

```typescript
import { sendEmail } from "@/lib/mail";
import { WelcomeEmail } from "@/emails/welcome-email";

await sendEmail({
  to: "client@example.com",
  subject: "Bienvenue",
  react: <WelcomeEmail name="John" />,
});
```

### Envoyer une facture

```typescript
import { sendInvoiceEmail } from "@/lib/mail";
import fs from "fs";

const pdfBuffer = fs.readFileSync("facture.pdf");

await sendInvoiceEmail({
  to: "client@example.com",
  clientName: "John Doe",
  pdfBuffer: pdfBuffer,
  invoiceNumber: "FAC-2025-001",
  amount: 1500,
});
```

## Fonctionnalités

### ✅ Nom d'expéditeur professionnel

Les emails sont envoyés avec le nom **"Doussel Immo Support"** au lieu de simplement l'adresse email, ce qui donne un aspect plus professionnel.

### ✅ Logging détaillé

Le service log automatiquement :
- ✅ Succès : `Email envoyé avec succès` avec messageId
- ❌ Erreurs : Messages d'erreur détaillés

### ✅ Support des pièces jointes

Vous pouvez attacher des fichiers (PDF, images, etc.) :

```typescript
await sendEmail({
  to: "client@example.com",
  subject: "Document",
  html: "<p>Voir pièce jointe</p>",
  attachments: [
    {
      filename: "document.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});
```

## Dépannage

### Erreur : "Invalid login"

- Vérifiez que `GMAIL_APP_PASSWORD` est correct (16 caractères, sans espaces)
- Assurez-vous que la validation en deux étapes est activée
- Vérifiez que vous utilisez un **mot de passe d'application**, pas votre mot de passe Gmail normal

### Erreur : "Connection timeout"

- Vérifiez votre connexion internet
- Certains réseaux (entreprises, écoles) bloquent le port 465
- Essayez d'utiliser un VPN ou un autre réseau

### Erreur : "Message rejected"

- Vérifiez que l'adresse email de destination est valide
- Gmail peut limiter le nombre d'emails envoyés par jour (500 pour les comptes gratuits)
- Vérifiez que votre compte Gmail n'est pas suspendu

### Les emails arrivent en spam

- Ajoutez votre domaine dans les paramètres Gmail (si vous avez un domaine personnalisé)
- Utilisez un service professionnel comme SendGrid ou Resend pour la production
- Vérifiez que le contenu HTML est valide

## Limites Gmail

- **500 emails/jour** pour les comptes Gmail gratuits
- **2000 emails/jour** pour Google Workspace
- **Taille max** : 25 MB par email (avec pièces jointes)

## Production

Pour la production, considérez :
- **SendGrid** : Service professionnel avec API
- **Resend** : Service moderne avec React Email
- **AWS SES** : Solution AWS scalable
- **Postmark** : Service spécialisé transactionnel

Le service actuel (`lib/mail-gmail.ts`) peut être facilement remplacé par un autre service en modifiant uniquement `lib/mail.ts`.

## Références

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [React Email](https://react.email/)










