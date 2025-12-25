# 🔐 Configuration du Digital Safe (Coffre-fort numérique)

## 📋 Vue d'ensemble

Le Digital Safe est un espace ultra-sécurisé permettant aux utilisateurs de stocker leurs documents sensibles (Titres de propriété, CNI, Bails, etc.) avec chiffrement AES-256.

---

## 🚀 Étapes de configuration Supabase

### 1️⃣ Exécuter la migration SQL

```bash
# Se connecter à Supabase
cd supabase
npx supabase db push

# Ou via le Dashboard Supabase :
# SQL Editor > Nouvelle requête > Coller le contenu de migrations/20250101_digital_safe.sql
```

### 2️⃣ Créer le bucket Storage

1. Aller dans **Storage** > **New Bucket**
2. Configuration :
   - **Name:** `verification-docs`
   - **Public:** ❌ **NON** (Bucket privé)
   - **File size limit:** `5242880` (5 MB)
   - **Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`, `image/jpg`

### 3️⃣ Configurer les Storage Policies (RLS)

Aller dans **Storage** > `verification-docs` > **Policies** et créer 3 policies :

#### **Policy 1 : Upload (INSERT)**
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 2 : Téléchargement/Lecture (SELECT)**
```sql
CREATE POLICY "Users can view own files or admins can view all"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-docs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'superadmin', 'moderateur')
    )
  )
);
```

#### **Policy 3 : Suppression (DELETE)**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🔒 Architecture de sécurité

### Hiérarchie des fichiers
```
verification-docs/
├── {user_id_1}/
│   ├── titre_propriete/
│   │   └── 1735689600_mon_titre.pdf
│   ├── cni/
│   │   └── 1735689601_cni_scan.jpg
│   └── bail/
│       └── 1735689602_bail_2024.pdf
├── {user_id_2}/
│   └── ...
```

### Permissions (RLS)

| Action | Utilisateur | Admin | Note |
|--------|-------------|-------|------|
| **Upload** | ✅ (son dossier uniquement) | ✅ | Bucket privé |
| **Lecture** | ✅ (ses fichiers uniquement) | ✅ (tous les fichiers) | URLs signées |
| **Suppression** | ✅ (documents manuels uniquement) | ✅ | Docs certifiés = lecture seule |
| **Modification** | ❌ | ❌ | Immutable |

### Chiffrement

- **Transport:** TLS 1.3 (HTTPS)
- **Stockage:** AES-256 (Supabase Storage par défaut)
- **URLs:** Signed URLs avec expiration (1 heure pour l'affichage)

---

## 🧪 Tester la configuration

### 1. Vérifier la table `user_documents`
```sql
SELECT * FROM user_documents LIMIT 5;
```

### 2. Vérifier le bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'verification-docs';
```

### 3. Vérifier les policies
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'verification-docs';
```

### 4. Tester l'upload depuis l'interface
1. Se connecter à Dousell Immo
2. Aller dans **Compte** > **Mes Documents**
3. Cliquer sur **Ajouter un document**
4. Sélectionner un fichier PDF ou image (< 5 MB)
5. Vérifier qu'il apparaît dans la liste

---

## 📊 Récupération des documents de certification

Les documents uploadés lors de la certification d'une annonce sont **automatiquement ajoutés** au coffre-fort de l'utilisateur.

### Migration des documents existants (si nécessaire)

Si des documents de certification existent déjà dans `ad_verifications`, ils seront automatiquement visibles dans le Digital Safe via la fonction `getVerificationDocuments()`.

Aucune migration manuelle n'est nécessaire ! ✅

---

## 🎨 UI/UX du Digital Safe

### Design Elements
- **Badges de sécurité :**
  - 🛡️ "Chiffré AES-256" (vert)
  - 🔒 "Confidentiel" (or)
  - ✅ "Accès Privé" (bleu)

- **Types de documents :**
  - Documents manuels : Bouton suppression visible
  - Documents certifiés : Badge "CERTIFIÉ" + Lecture seule

### Navigation
Le lien "Mes Documents" sera ajouté dans le menu du dashboard utilisateur (`/compte`).

---

## 🔧 Troubleshooting

### Erreur "Policy violation"
➡️ Vérifier que les Storage Policies sont bien créées

### Erreur "Bucket does not exist"
➡️ Créer le bucket `verification-docs` manuellement

### Upload échoue sans erreur
➡️ Vérifier la limite de taille (5 MB max)

### Documents de certification ne s'affichent pas
➡️ Vérifier que `ad_verifications.status = 'verified'` et `ad_verifications.document_path` existe

---

## 📝 Checklist finale

- [ ] Migration SQL exécutée
- [ ] Bucket `verification-docs` créé (privé)
- [ ] 3 Storage Policies configurées
- [ ] Test d'upload réussi
- [ ] Documents certifiés visibles
- [ ] Lien "Mes Documents" ajouté à la navigation

---

**Le Digital Safe est maintenant prêt ! 🎉**
