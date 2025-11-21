# 🧪 Tester l'authentification OAuth Google

## ✅ Vérification avant test

### 1. Variables d'environnement (`.env.local`)

Vérifiez que le fichier `.env.local` existe à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://Dousell-immo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Redémarrer le serveur

Après avoir modifié `.env.local`, **redémarrez toujours le serveur** :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

## 🧪 Test de l'inscription Email/Password

1. Allez sur `http://localhost:3000/register`
2. Remplissez le formulaire :
   - Nom complet : `Test User`
   - Email : Votre email
   - Téléphone : `771234567` (9 chiffres)
   - Mot de passe : `test123456` (min 6 caractères)
3. Cliquez sur **"S'inscrire"**
4. **Résultat attendu** :
   - Toast vert : "Compte créé avec succès !"
   - Redirection vers `/compte`
   - Vérifiez votre email pour le lien de confirmation

## 🧪 Test de la connexion Email/Password

1. Allez sur `http://localhost:3000/login`
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**
4. **Résultat attendu** :
   - Toast vert : "Connexion réussie"
   - Redirection vers `/compte`
   - Vous voyez vos informations de profil

## 🧪 Test de Google OAuth

1. Allez sur `http://localhost:3000/login` ou `/register`
2. Cliquez sur **"Continuer avec Google"**
3. **Résultat attendu** :
   - Redirection vers Google (page de connexion Google)
   - Après connexion Google → Redirection vers Supabase
   - Puis redirection vers `/compte`
   - Vous êtes connecté avec votre compte Google

## 🐛 Si ça ne marche pas

### Erreur "redirect_uri_mismatch"

**Vérifiez dans Google Cloud Console :**
- `http://localhost:3000/auth/callback` est bien dans "Authorized redirect URIs"
- Pas d'espaces dans les URLs
- Chaque URL est dans un champ séparé

**Vérifiez dans Supabase :**
- Authentication → URL Configuration → Redirect URLs contient `http://localhost:3000/auth/callback`

**Vérifiez `.env.local` :**
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` (sans slash à la fin)
- Redémarrez le serveur après modification

### Erreur "invalid_client"

**Vérifiez dans Supabase Dashboard :**
- Authentication → Providers → Google
- Client ID : `YOUR_GOOGLE_CLIENT_ID_HERE`
- Client Secret : `YOUR_GOOGLE_CLIENT_SECRET_HERE`
- Pas d'espaces avant/après

### Erreur 400 sur `/auth/v1/token`

**Vérifiez :**
- Email provider activé dans Supabase (Authentication → Providers → Email)
- Variables d'environnement correctes
- Redémarrez le serveur

## ✅ Checklist de test

- [ ] `.env.local` existe avec les bonnes valeurs
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Inscription Email/Password fonctionne
- [ ] Connexion Email/Password fonctionne
- [ ] Google OAuth fonctionne
- [ ] Redirection vers `/compte` après connexion
- [ ] Session persistée (rechargez la page, vous restez connecté)

## 🎉 Si tout fonctionne

Félicitations ! Votre authentification est configurée. Vous pouvez maintenant :
- Tester l'inscription et la connexion
- Tester Google OAuth
- Ajouter votre domaine plus tard pour la production
