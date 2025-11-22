# 🔐 Configuration de la politique RLS pour l'upload

## ✅ Configuration complète pour la politique "Allow authenticated upload"

### Étape 1 : Informations de base

1. **Nom de la politique** : `Allow authenticated upload`
2. **Checkbox "Allow authenticated upload"** : ✅ **COCHEZ** cette case

### Étape 2 : Permissions SQL

Cochez les permissions suivantes :
- ✅ **SELECT** (pour vérifier les fichiers)
- ✅ **INSERT** (pour uploader des fichiers)
- ⬜ UPDATE (optionnel, pour modifier les métadonnées)
- ⬜ DELETE (géré par une autre politique)

### Étape 3 : Actions Storage

Sélectionnez les actions suivantes (en vert) :
- ✅ **upload** (important !)
- ✅ **download** (pour télécharger)
- ✅ **list** (pour lister les fichiers)
- ✅ **getPublicUrl** (pour obtenir l'URL publique)
- ✅ **createSignedUrl** (optionnel, pour URLs signées)
- ⬜ update (optionnel)
- ⬜ move (optionnel)
- ⬜ copy (optionnel)
- ⬜ remove (géré par une autre politique)

### Étape 4 : Condition (USING)

Dans le champ "USING expression", entrez :
```sql
bucket_id = 'properties'
```

### Étape 5 : Expression de vérification (WITH CHECK)

Dans le champ "WITH CHECK expression", entrez :
```sql
bucket_id = 'properties' AND auth.role() = 'authenticated'
```

Cette expression garantit que :
- Le fichier est dans le bucket 'properties'
- L'utilisateur est authentifié

### Étape 6 : Rôles

- Laissez le dropdown sur **"Defaults to all (public) roles if none selected"**
- OU sélectionnez **"authenticated"** si disponible

### Étape 7 : Valider

Cliquez sur **"Review"** puis **"Save policy"**

## 📋 Résumé de la configuration

| Élément | Valeur |
|---------|--------|
| Nom | `Allow authenticated upload` |
| Checkbox "Allow authenticated upload" | ✅ Coché |
| Permissions | SELECT ✅, INSERT ✅ |
| Actions | upload ✅, download ✅, list ✅, getPublicUrl ✅ |
| USING | `bucket_id = 'properties'` |
| WITH CHECK | `bucket_id = 'properties' AND auth.role() = 'authenticated'` |

## ⚠️ Points importants

1. **La checkbox "Allow authenticated upload"** doit être cochée
2. **L'action "upload"** doit être sélectionnée (en vert)
3. **INSERT** doit être coché dans les permissions SQL
4. **WITH CHECK** doit vérifier `auth.role() = 'authenticated'`

## 🧪 Test

Après avoir créé la politique, testez l'upload :
1. Connectez-vous à votre application
2. Allez sur `/compte/deposer` ou `/admin/biens/nouveau`
3. Essayez d'uploader une photo
4. Si ça fonctionne, la politique est correcte ! ✅


