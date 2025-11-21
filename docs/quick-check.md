# ✅ Vérification rapide Supabase

## Checklist de configuration

### 1. Variables d'environnement
- [ ] Fichier `.env.local` créé à la racine
- [ ] `NEXT_PUBLIC_SUPABASE_URL` défini (format: `https://xxx.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` défini (clé "anon" publique, pas "service_role")
- [ ] Serveur redémarré après modification

### 2. Configuration Supabase Dashboard

#### Authentication → Providers
- [ ] **Email** provider activé
- [ ] **Enable email signup** : ✅ Activé
- [ ] **Confirm email** : ⚠️ Désactivé (pour dev) ou Activé (pour prod)

#### Authentication → Users
- [ ] Créer un utilisateur de test (optionnel)
- [ ] **Auto Confirm User** : ✅ Activé (pour éviter la confirmation email)

### 3. Test de connexion

1. Allez sur `/register`
2. Créez un compte avec :
   - Email : `test@example.com`
   - Mot de passe : `test123456`
   - Nom : `Test User`
   - Téléphone : `771234567`
3. Vérifiez dans Supabase Dashboard → **Authentication** → **Users** que l'utilisateur apparaît
4. Allez sur `/login` et connectez-vous

### 4. Erreurs courantes

#### Erreur 400 "Bad Request"
**Causes possibles :**
- Email provider non activé → Vérifiez Authentication → Providers → Email
- Variables d'environnement incorrectes → Vérifiez `.env.local`
- Email déjà utilisé → Utilisez un autre email ou supprimez l'utilisateur dans Supabase

#### "Invalid login credentials"
- Vérifiez que l'utilisateur existe dans Supabase Dashboard
- Vérifiez que le mot de passe est correct (min 6 caractères)
- Si "Confirm email" est activé, vérifiez que l'email est confirmé

#### "Email not confirmed"
- Désactivez "Confirm email" dans Authentication → Providers → Email
- Ou confirmez l'email depuis le lien reçu
- Ou créez un utilisateur avec "Auto Confirm" activé

## 🔍 Debug

Ouvrez la console du navigateur (F12) et regardez :
- Les erreurs détaillées dans la console
- Les requêtes réseau dans l'onglet "Network"
- Les logs `console.error` pour plus de détails

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs dans Supabase Dashboard → Logs
2. Vérifiez la console du navigateur
3. Vérifiez que les variables d'environnement sont correctes

