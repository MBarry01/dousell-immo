# 🔧 Correction : Emails non reçus en production

## 🔍 Diagnostic

Le diagnostic a confirmé que :
- ✅ Configuration locale fonctionne
- ✅ Connexion SMTP Gmail réussie
- ❌ **Problème : Variables d'environnement manquantes en production (Vercel)**

## 🚨 Cause du problème

Après un push en production, les emails ne sont plus reçus car **les variables d'environnement Gmail ne sont pas configurées dans Vercel**.

Le fichier `.env.local` contient les variables mais :
- ⚠️ `.env.local` est **ignoré par Git** (dans `.gitignore`)
- ⚠️ Les variables ne sont **pas automatiquement** copiées vers Vercel
- ⚠️ Il faut les **ajouter manuellement** dans Vercel

## ✅ Solution : Configurer les variables dans Vercel

### Étape 1 : Ouvrir les paramètres Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **Doussel Immo**
4. Allez dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter les variables Gmail

Cliquez sur **Add New** et ajoutez ces 3 variables :

#### Variable 1 : `GMAIL_USER`
- **Key** : `GMAIL_USER`
- **Value** : `mb3186802@gmail.com` (ou votre email Gmail)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 2 : `GMAIL_APP_PASSWORD`
- **Key** : `GMAIL_APP_PASSWORD`
- **Value** : Votre mot de passe d'application Gmail (16 caractères)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

#### Variable 3 : `ADMIN_EMAIL`
- **Key** : `ADMIN_EMAIL`
- **Value** : `barrymohamadou98@gmail.com` (ou votre email admin)
- **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

### Étape 3 : Redéployer l'application

Après avoir ajouté toutes les variables :

1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋮) → **Redeploy**
4. Ou faites un nouveau push sur GitHub (Vercel redéploiera automatiquement)

## 🧪 Vérification

### Test local

```bash
npx tsx scripts/diagnose-email.ts
```

Devrait afficher :
```
✅ Configuration locale semble correcte
✅ Connexion SMTP réussie !
```

### Test en production

1. Déposez une nouvelle annonce sur votre site en production
2. Vérifiez que l'email arrive bien à l'admin
3. Vérifiez les logs Vercel pour voir s'il y a des erreurs

## 📋 Checklist complète des variables Vercel

Assurez-vous d'avoir **toutes** ces variables dans Vercel :

### Variables Supabase (déjà configurées normalement)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (si utilisé)

### Variables Gmail (⚠️ À AJOUTER)
- ❌ `GMAIL_USER` → **À AJOUTER**
- ❌ `GMAIL_APP_PASSWORD` → **À AJOUTER**
- ❌ `ADMIN_EMAIL` → **À AJOUTER**

### Variables autres
- ✅ `NEXT_PUBLIC_APP_URL` (URL de votre site)
- ✅ Autres variables spécifiques à votre projet

## 🔍 Vérifier les logs Vercel

Si les emails ne fonctionnent toujours pas après configuration :

1. Allez dans **Deployments** → Cliquez sur le dernier déploiement
2. Ouvrez les **Build Logs** ou **Function Logs**
3. Cherchez les erreurs contenant :
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `Configuration Gmail manquante`
   - `Invalid login`

## 💡 Notes importantes

1. **Sécurité** : Ne commitez **JAMAIS** `GMAIL_APP_PASSWORD` dans Git
2. **Mot de passe d'application** : Utilisez un **mot de passe d'application Gmail** (16 caractères), pas votre mot de passe Gmail normal
3. **Validation 2 étapes** : Le mot de passe d'application nécessite que la validation en deux étapes soit activée sur Gmail
4. **Limites Gmail** : Gmail limite à 500 emails/jour pour les comptes gratuits

## 🆘 Si ça ne fonctionne toujours pas

1. Vérifiez que les variables sont bien dans Vercel (Settings → Environment Variables)
2. Vérifiez que vous avez redéployé après avoir ajouté les variables
3. Vérifiez les logs Vercel pour les erreurs
4. Testez localement avec `npx tsx scripts/test-email.ts`
5. Vérifiez que `GMAIL_APP_PASSWORD` est un mot de passe d'application valide (pas votre mot de passe Gmail)

## 📚 Documentation

- [Configuration Gmail](./GMAIL-SETUP.md)
- [Variables d'environnement Vercel](./VERCEL-ENV-VARIABLES.md)
- [Test email](./TEST-SIGNUP-FLOW.md)

