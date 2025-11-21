# Configuration Supabase pour Dousell Immo

## 📋 Prérequis

1. Créer un projet Supabase sur [supabase.com](https://supabase.com)
2. Récupérer les credentials depuis le dashboard

## 🔑 Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

## ⚙️ Configuration Supabase Dashboard

### 1. Activer Email/Password Authentication

1. Allez dans **Authentication** → **Providers**
2. Activez **Email** provider
3. Configurez les options :
   - ✅ **Enable email signup** : Activé
   - ✅ **Confirm email** : Désactivé (pour le développement) ou Activé (pour la production)
   - ✅ **Secure email change** : Activé

### 2. Configurer les Email Templates (Optionnel)

1. Allez dans **Authentication** → **Email Templates**
2. Personnalisez les templates si nécessaire

### 3. Créer un utilisateur de test (Optionnel)

1. Allez dans **Authentication** → **Users**
2. Cliquez sur **Add user** → **Create new user**
3. Entrez un email et un mot de passe
4. ✅ **Auto Confirm User** : Activé (pour éviter la confirmation email en dev)

### 4. Configurer les RLS (Row Level Security)

Pour la table `properties` :

```sql
-- Permettre la lecture publique
CREATE POLICY "Public read access" ON properties
  FOR SELECT
  USING (true);

-- Permettre l'insertion pour les utilisateurs authentifiés
CREATE POLICY "Authenticated insert" ON properties
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Authenticated update" ON properties
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Permettre la suppression pour les utilisateurs authentifiés
CREATE POLICY "Authenticated delete" ON properties
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

### 5. Configurer Storage (Pour les images)

1. Allez dans **Storage**
2. Créez un bucket nommé `properties`
3. Configurez les policies :

```sql
-- Permettre la lecture publique
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'properties');

-- Permettre l'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'properties' 
    AND auth.role() = 'authenticated'
  );

-- Permettre la suppression pour les utilisateurs authentifiés
CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'properties' 
    AND auth.role() = 'authenticated'
  );
```

## 🧪 Tester la connexion

1. Redémarrez le serveur de développement : `npm run dev`
2. Allez sur `/register` et créez un compte
3. Vérifiez dans Supabase Dashboard → **Authentication** → **Users** que l'utilisateur est créé
4. Connectez-vous sur `/login`

## 🐛 Résolution des erreurs 400

Si vous obtenez une erreur 400 lors de la connexion/inscription :

1. **Vérifiez les variables d'environnement** :
   - Les variables doivent commencer par `NEXT_PUBLIC_`
   - Redémarrez le serveur après modification

2. **Vérifiez que Email provider est activé** :
   - Dashboard → Authentication → Providers → Email → Enabled

3. **Vérifiez les credentials** :
   - `NEXT_PUBLIC_SUPABASE_URL` doit être l'URL complète (avec https://)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` doit être la clé "anon" publique (pas la clé "service_role")

4. **Vérifiez la confirmation email** :
   - Si "Confirm email" est activé, vous devez confirmer l'email avant de vous connecter
   - Ou créez un utilisateur avec "Auto Confirm" activé dans le dashboard

5. **Vérifiez la console du navigateur** :
   - Ouvrez les DevTools → Console
   - Regardez les erreurs détaillées

## 📝 Notes importantes

- En développement, désactivez "Confirm email" pour tester rapidement
- En production, activez "Confirm email" pour la sécurité
- Les `user_metadata` (full_name, phone) sont stockés automatiquement lors de l'inscription
- Le client Supabase utilise un singleton pattern pour éviter les instances multiples

