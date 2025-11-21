# 🔐 Vérifier les politiques RLS pour Storage

## ✅ Checklist des politiques nécessaires

Après avoir créé le bucket `properties`, vous devez avoir **au minimum** ces politiques :

### 1. Politique de lecture publique (SELECT)

**Obligatoire** pour que le test et l'application puissent accéder au bucket.

**Dans Supabase Dashboard** :
1. Allez dans **Storage** → Cliquez sur le bucket `properties`
2. Allez dans l'onglet **"Policies"**
3. Vérifiez qu'il existe une politique avec :
   - **Nom** : `Public Access` ou similaire
   - **Command** : `SELECT`
   - **USING** : `bucket_id = 'properties'`

**Ou créez-la via SQL** :

```sql
-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Créer la politique de lecture publique
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');
```

### 2. Politique d'upload (INSERT)

**Pour permettre l'upload d'images** :

```sql
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);
```

## 🧪 Test rapide

1. **Rechargez la page de test** : `http://localhost:3000/test-supabase`
2. Le test devrait maintenant être ✅ vert

## ⚠️ Si le test échoue toujours

### Vérifiez dans Supabase Dashboard :

1. **Storage** → `properties` → **Policies**
2. Vous devriez voir au moins :
   - Une politique `SELECT` (lecture publique)
   - Une politique `INSERT` (upload authentifié)

### Si les politiques manquent :

**Option 1 : Via l'interface**
- Cliquez sur **"New policy"** dans l'onglet Policies
- Créez la politique de lecture publique (SELECT)

**Option 2 : Via SQL**
- Allez dans **SQL Editor**
- Exécutez le script simplifié : `supabase/migrations/create_storage_bucket_simple.sql`
- Ou le script complet : `supabase/migrations/create_storage_bucket.sql`

## 📝 Note importante

Le test amélioré essaie maintenant d'accéder directement au bucket avec `.list()` au lieu de se fier uniquement à `listBuckets()`. Cela devrait mieux fonctionner même si `listBuckets()` est bloqué par RLS.

