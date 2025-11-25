# Configuration Email Supabase

## 🚨 Erreur : "Failed to send magic link email"

Cette erreur signifie que Supabase ne peut pas envoyer d'emails car **SMTP n'est pas configuré**.

---

## ✅ Solution 1 : Désactiver la confirmation email (Développement)

**Pour tester rapidement sans configurer SMTP :**

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Providers** → **Email**
3. **Désactivez** "Confirm email"
4. Cliquez sur **Save**

➡️ **L'inscription fonctionnera immédiatement sans email !**

---

## ✅ Solution 2 : Configurer SMTP (Production)

**Pour activer les emails de confirmation en production :**

### Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte gratuit
3. Récupérez votre **API Key** (commence par `re_`)

### Étape 2 : Configurer SMTP dans Supabase

1. Allez dans **Supabase Dashboard**
2. **Project Settings** → **Auth** → **SMTP Settings**
3. Activez **"Enable Custom SMTP"**
4. Remplissez les champs :

```
Host: smtp.resend.com
Port: 465 (SSL) ou 587 (TLS)
Username: resend
Password: re_VOTRE_CLE_API_RESEND
Sender email: onboarding@resend.dev (ou votre domaine vérifié)
Sender name: Dousell Immo
```

5. Cliquez sur **Save**

### Étape 3 : Activer la confirmation email

1. **Authentication** → **Providers** → **Email**
2. **Activez** "Confirm email"
3. Cliquez sur **Save**

---

## 📧 Vérifier l'envoi d'emails

### Dans Supabase Dashboard

1. **Authentication** → **Logs**
2. Filtrez par "Email sent"
3. Vérifiez les logs d'envoi

### Dans Resend Dashboard

1. Allez sur [resend.com/emails](https://resend.com/emails)
2. Voir tous les emails envoyés
3. Vérifier les statuts (delivered, bounced, etc.)

---

## 🔧 Alternative : Utiliser votre propre SMTP

Si vous avez un autre fournisseur SMTP (Gmail, SendGrid, Mailgun, etc.) :

1. **Project Settings** → **Auth** → **SMTP Settings**
2. Entrez les credentials de votre fournisseur
3. Testez avec "Send test email"

---

## ⚠️ Limites Resend (gratuit)

- **100 emails/jour** en gratuit
- **3 000 emails/mois** en gratuit
- Pour plus : [resend.com/pricing](https://resend.com/pricing)

---

## 🧪 Test

1. Inscrivez-vous avec un email valide
2. Vérifiez votre boîte email (et les spams)
3. Cliquez sur le lien de confirmation
4. Vous devriez être redirigé vers l'application

---

## 📝 Notes

- **En développement** : Désactivez "Confirm email" pour éviter les emails
- **En production** : Activez "Confirm email" + configurez SMTP
- Les emails de confirmation expirent après **24 heures** par défaut
- Vous pouvez personnaliser les templates dans **Authentication** → **Email Templates**

