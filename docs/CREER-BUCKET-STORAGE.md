# 📦 Créer le bucket Storage 'properties' dans Supabase

## Méthode 1 : Via Supabase Dashboard (Recommandé)

1. **Allez dans Supabase Dashboard** :
   - Connectez-vous à [https://supabase.com](https://supabase.com)
   - Sélectionnez votre projet : `blyanhulvwpdfpezlaji`

2. **Accédez au Storage** :
   - Dans le menu de gauche, cliquez sur **Storage**

3. **Créez un nouveau bucket** :
   - Cliquez sur **"New bucket"** ou **"Créer un bucket"**
   - Nom du bucket : `properties`
   - **Public bucket** : ✅ **Cochez cette option** (important pour que les images soient accessibles publiquement)
   - Cliquez sur **"Create bucket"**

4. **Configurez les politiques RLS (Row Level Security)** :
   - Cliquez sur le bucket `properties` que vous venez de créer
   - Allez dans l'onglet **"Policies"**
   - Cléez sur **"New Policy"**
   - Sélectionnez **"For full customization"**
   - Nom de la politique : `Allow public read access`
   - Définition de la politique :
     ```sql
     (bucket_id = 'properties'::text)
     ```
   - Expression de vérification :
     ```sql
     true
     ```
   - Opérations autorisées : Cochez **SELECT** (lecture)
   - Cliquez sur **"Review"** puis **"Save policy"**

5. **Politique pour l'upload (authentifié)** :
   - Créez une autre politique : `Allow authenticated upload`
   - Définition :
     ```sql
     (bucket_id = 'properties'::text)
     ```
   - Expression de vérification :
     ```sql
     auth.role() = 'authenticated'
     ```
   - Opérations autorisées : Cochez **INSERT** (upload)
   - Cliquez sur **"Save policy"**

## Méthode 2 : Via SQL Editor (Alternative)

Si vous préférez utiliser SQL, exécutez ce script dans **SQL Editor** :

```sql
-- Créer le bucket 'properties'
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour la lecture publique
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- Politique pour l'upload authentifié
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

-- Politique pour la suppression (propriétaire uniquement)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'properties' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Vérification

Après avoir créé le bucket :

1. **Rechargez la page de test** :
   ```
   http://localhost:3000/test-supabase
   ```

2. **Le test "Storage 'properties'" devrait maintenant être ✅ vert**

## Notes importantes

- ✅ Le bucket doit être **public** pour que les images soient accessibles
- ✅ Les politiques RLS permettent :
  - **Lecture publique** : Tout le monde peut voir les images
  - **Upload authentifié** : Seuls les utilisateurs connectés peuvent uploader
  - **Suppression** : Seul le propriétaire peut supprimer ses fichiers

## Structure des fichiers

Les images seront stockées dans :
```
properties/
  ├── [uuid-1].jpg
  ├── [uuid-2].jpg
  └── ...
```

L'URL publique sera :
```
https://blyanhulvwpdfpezlaji.supabase.co/storage/v1/object/public/properties/[filename]
```

