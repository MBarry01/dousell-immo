# 🔍 Vérifier la connexion Supabase

## Méthode 1 : Page de test (Recommandé)

1. **Démarrez votre serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Visitez la page de test** :
   ```
   http://localhost:3000/test-supabase
   ```

3. **Vérifiez les résultats** :
   - ✅ Tous les tests verts = Connexion OK
   - ❌ Erreurs rouges = Problème de configuration

## Méthode 2 : Vérifier manuellement

### Étape 1 : Vérifier le fichier `.env.local`

Le fichier `.env.local` doit exister à la racine du projet et contenir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

**⚠️ Important** :
- Le fichier `.env.local` est ignoré par Git (pour la sécurité)
- Vous devez le créer manuellement
- Redémarrez le serveur après modification

### Étape 2 : Trouver vos credentials Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous et sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape 3 : Vérifier que la table `properties` existe

1. Dans Supabase Dashboard, allez dans **Table Editor**
2. Vérifiez que la table `properties` existe
3. Si elle n'existe pas, exécutez les migrations SQL dans **SQL Editor**

### Étape 4 : Vérifier les migrations

Les migrations SQL doivent être exécutées dans Supabase :

1. Allez dans **SQL Editor** dans Supabase Dashboard
2. Exécutez les fichiers dans `supabase/migrations/` :
   - `add_owner_features.sql`
   - `add_rejection_reason.sql`

## Erreurs courantes

### ❌ "Variables d'environnement manquantes"

**Solution** :
1. Créez le fichier `.env.local` à la racine
2. Ajoutez les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redémarrez le serveur (`npm run dev`)

### ❌ "Table 'properties' n'existe pas"

**Solution** :
1. Allez dans Supabase Dashboard → **SQL Editor**
2. Créez la table `properties` avec la structure appropriée
3. Ou exécutez les migrations SQL

### ❌ "Erreur de connexion" ou "Network error"

**Solutions** :
1. Vérifiez que votre projet Supabase est actif (pas en pause)
2. Vérifiez que l'URL Supabase est correcte (sans slash final)
3. Vérifiez votre connexion internet
4. Vérifiez les règles RLS (Row Level Security) dans Supabase

### ❌ "Invalid API key"

**Solution** :
1. Vérifiez que vous utilisez la clé **anon public** (pas la clé service_role)
2. Vérifiez que la clé est complète (pas tronquée)
3. Recopiez la clé depuis Supabase Dashboard

## Test rapide dans la console

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Vérifier les variables d'environnement
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Manquante');
```

## Support

Si les problèmes persistent :
1. Vérifiez les logs du serveur (`npm run dev`)
2. Vérifiez les logs dans Supabase Dashboard → **Logs**
3. Consultez la documentation Supabase : [https://supabase.com/docs](https://supabase.com/docs)


