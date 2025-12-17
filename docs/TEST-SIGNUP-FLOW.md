# Guide de test du parcours d'inscription

## 🧪 Tests automatisés

Exécutez le script de test :

```bash
npm run test:signup
```

Ce script vérifie :
- ✅ Configuration des variables d'environnement
- ✅ Validation des champs
- ✅ Vérification HIBP
- ✅ Connexion Supabase
- ✅ Création de compte
- ✅ Envoi d'email (si nécessaire)

## 📋 Checklist de test manuel

### 1. Test de la page d'inscription (`/register`)

#### 1.1 Interface utilisateur
- [ ] La page se charge correctement
- [ ] Le formulaire est visible et fonctionnel
- [ ] Les champs sont bien formatés (nom, email, téléphone, mot de passe)
- [ ] Le sélecteur de pays pour le téléphone fonctionne
- [ ] Le captcha Turnstile s'affiche et se valide
- [ ] Le bouton "Créer un compte" est visible

#### 1.2 Validation côté client
- [ ] Email invalide → Message d'erreur affiché
- [ ] Mot de passe < 6 caractères → Message d'erreur affiché
- [ ] Nom < 2 caractères → Message d'erreur affiché
- [ ] Téléphone invalide → Message d'erreur affiché
- [ ] Captcha non complété → Message d'erreur affiché

#### 1.3 Test d'inscription avec email réel

**Prérequis** : Désactiver "Auto Confirm User" dans Supabase pour tester l'email de vérification

1. Remplissez le formulaire avec :
   - Email : `votre-email-reel@gmail.com`
   - Mot de passe : `TestPassword123!` (ou un mot de passe sécurisé)
   - Nom : `Test User`
   - Téléphone : `+221771234567`

2. Complétez le captcha Turnstile

3. Cliquez sur "Créer un compte"

4. **Résultats attendus** :
   - [ ] Toast de succès : "Compte créé !"
   - [ ] Message bleu affiché : "Email de confirmation envoyé"
   - [ ] Email reçu dans la boîte de réception (vérifier aussi les spams)
   - [ ] Email avec le design Doussel Immo
   - [ ] Bouton "Confirmer mon email" dans l'email
   - [ ] Lien de secours fonctionnel dans l'email

#### 1.4 Test du bouton "Renvoyer l'email"

- [ ] Cliquez sur "Renvoyer l'email"
- [ ] Toast de succès : "Email renvoyé !"
- [ ] Nouvel email reçu dans la boîte de réception

#### 1.5 Test de confirmation d'email

1. Ouvrez l'email reçu
2. Cliquez sur "Confirmer mon email" (ou copiez le lien)
3. **Résultats attendus** :
   - [ ] Redirection vers `/auth/callback`
   - [ ] Redirection vers la page d'accueil (`/`)
   - [ ] Vous êtes connecté (vérifier dans `/compte`)
   - [ ] Toast de bienvenue affiché

### 2. Test des cas d'erreur

#### 2.1 Email déjà utilisé
- [ ] Inscription avec un email existant
- [ ] Message d'erreur : "Cet email est déjà enregistré"
- [ ] Toast d'erreur affiché

#### 2.2 Mot de passe compromis (HIBP)
- [ ] Inscription avec un mot de passe connu (ex: `password123`)
- [ ] Message d'erreur : "Ce mot de passe a été compromis"
- [ ] Inscription bloquée

#### 2.3 Rate limiting
- [ ] Faire 5+ tentatives d'inscription rapidement
- [ ] Message d'erreur : "Trop de tentatives de connexion"
- [ ] Toast d'erreur avec durée prolongée (8 secondes)

#### 2.4 Captcha invalide
- [ ] Soumettre le formulaire sans compléter le captcha
- [ ] Message d'erreur : "Veuillez compléter la vérification anti-robot"

### 3. Test avec auto-confirm activé

**Configuration** : Activer "Auto Confirm User" dans Supabase

1. Inscription avec un nouvel email
2. **Résultats attendus** :
   - [ ] Toast de succès : "Compte créé avec succès !"
   - [ ] Redirection automatique vers `/`
   - [ ] Vous êtes connecté immédiatement
   - [ ] Pas d'email de vérification envoyé

### 4. Test de connexion Google

1. Cliquez sur "Continuer avec Google"
2. **Résultats attendus** :
   - [ ] Redirection vers Google OAuth
   - [ ] Sélection du compte Google
   - [ ] Redirection vers `/auth/callback`
   - [ ] Redirection vers la page d'accueil
   - [ ] Vous êtes connecté

### 5. Vérification des routes

- [ ] `/register` → Page d'inscription accessible
- [ ] `/login` → Page de connexion accessible
- [ ] `/auth/callback` → Route de callback fonctionnelle
- [ ] `/auth/auth-code-error` → Page d'erreur accessible

### 6. Vérification des logs

Ouvrez la console du navigateur (F12) et vérifiez :

- [ ] Pas d'erreurs JavaScript
- [ ] Pas d'erreurs de réseau (404, 500, etc.)
- [ ] Logs de debug présents (si activés)
- [ ] Pas d'erreurs CORS

### 7. Vérification des emails

#### 7.1 Design de l'email
- [ ] Logo Doussel Immo visible
- [ ] Couleurs cohérentes (orange #f59e0b)
- [ ] Bouton "Confirmer mon email" cliquable
- [ ] Lien de secours fonctionnel
- [ ] Responsive (test sur mobile)

#### 7.2 Contenu de l'email
- [ ] Nom de l'utilisateur correct
- [ ] Lien de confirmation valide
- [ ] Expéditeur : "Doussel Immo Support"
- [ ] Pas de spam (vérifier le dossier spam)

## 🐛 Dépannage

### L'email de vérification n'arrive pas

1. **Vérifier les variables d'environnement** :
   ```bash
   echo $GMAIL_USER
   echo $GMAIL_APP_PASSWORD
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Tester l'envoi d'email** :
   ```bash
   npm run test:verification
   ```

3. **Vérifier les logs** :
   - Console du navigateur
   - Logs serveur (terminal)
   - Logs Supabase Dashboard

4. **Vérifier le dossier spam**

### Le lien de confirmation ne fonctionne pas

1. **Vérifier `NEXT_PUBLIC_APP_URL`** :
   - Dev : `http://localhost:3000`
   - Prod : `https://votre-domaine.com`

2. **Vérifier la route `/auth/callback`** :
   - Doit être accessible
   - Doit gérer les paramètres `code` et `error`

3. **Vérifier le token** :
   - Le token expire après 24h
   - Utiliser "Renvoyer l'email" pour obtenir un nouveau lien

### Erreur "SUPABASE_SERVICE_ROLE_KEY non défini"

**Solution** :
1. Dashboard Supabase → Settings → API
2. Copier la `service_role` key
3. Ajouter dans `.env.local` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre_key_ici
   ```

### Erreur "Email rate limit exceeded"

**Cause** : Trop d'emails envoyés rapidement

**Solution** :
- Attendre quelques minutes
- Vérifier les limites Gmail (500 emails/jour)

## ✅ Validation finale

Après tous les tests, vérifiez :

- [ ] Inscription fonctionne avec email réel
- [ ] Email de vérification reçu et fonctionnel
- [ ] Confirmation d'email fonctionne
- [ ] Connexion après confirmation fonctionne
- [ ] Tous les cas d'erreur gérés correctement
- [ ] Interface utilisateur cohérente
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (< 3s pour l'inscription)

## 📝 Notes

- Les tests automatisés ne remplacent pas les tests manuels
- Toujours tester avec un email réel pour valider l'envoi
- Vérifier sur différents navigateurs (Chrome, Firefox, Safari)
- Tester sur mobile (responsive design)










