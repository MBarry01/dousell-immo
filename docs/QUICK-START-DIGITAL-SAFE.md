# 🚀 Quick Start - Digital Safe

## ✅ État actuel (24/12/2024)

D'après le diagnostic (`npm run diagnose:safe`):

- ✅ Table `user_documents` créée
- ✅ Bucket `verification-docs` créé (privé)
- ✅ Table `ad_verifications` existe
- ⚠️ **Storage Policies (RLS) manquantes** ← À FAIRE MAINTENANT

---

## 🔧 Configuration finale (5 minutes)

### Étape 1: Configurer les Storage Policies (RLS)

Les policies RLS permettent de sécuriser l'accès au bucket. Suivez ces étapes:

#### 1.1 Accéder au Dashboard Supabase

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet **Dousell Immo**
3. Aller dans **Storage** > **verification-docs** > **Policies**

#### 1.2 Créer les 3 Policies

Cliquez sur **"New Policy"** et créez les 3 policies suivantes:

---

**POLICY 1: Upload (INSERT)**

```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Description**: Les utilisateurs peuvent uploader UNIQUEMENT dans leur propre dossier (`{user_id}/...`)

---

**POLICY 2: Téléchargement/Lecture (SELECT)**

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

**Description**:
- Utilisateurs: peuvent voir UNIQUEMENT leurs propres fichiers
- Admins/Modérateurs: peuvent voir TOUS les fichiers

---

**POLICY 3: Suppression (DELETE)**

```sql
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Description**: Les utilisateurs peuvent supprimer UNIQUEMENT leurs propres fichiers

---

### Étape 2: Tester le Digital Safe

Une fois les 3 policies créées:

1. Se connecter à Dousell Immo avec un compte utilisateur
2. Aller dans **Compte** > **Mes Documents**
3. Cliquer sur **Ajouter un document**
4. Uploader un PDF ou une image (< 5 MB)
5. Vérifier qu'il apparaît dans la liste

---

## 🐛 Troubleshooting

### Erreur "Erreur lors de l'enregistrement"

**Cause**: Storage Policies non configurées ou incorrectes

**Solution**: Vérifier que les 3 policies sont bien créées dans le Dashboard Supabase

---

### Documents de certification ne s'affichent pas

**Cause**: Aucune annonce certifiée ou mauvais path dans `ad_verifications.document_path`

**Solution**:
1. Vérifier qu'il existe des annonces avec `verification_status = 'verified'`
2. Vérifier que `ad_verifications.status = 'verified'` et `document_path` est rempli

Pour vérifier manuellement:
```sql
SELECT * FROM properties WHERE verification_status = 'verified';
SELECT * FROM ad_verifications WHERE status = 'verified';
```

---

### Upload échoue silencieusement

**Cause**: Fichier trop volumineux ou type non autorisé

**Solution**:
- Taille max: **5 MB**
- Types autorisés: **PDF, JPG, PNG**

---

## 📝 Commandes utiles

```bash
# Diagnostic complet du Digital Safe
npm run diagnose:safe

# Afficher les Storage Policies SQL à copier
npm run diagnose:safe

# Tester la connexion Supabase
npm run test:email
```

---

## ✅ Checklist finale

Avant de considérer le Digital Safe comme opérationnel:

- [ ] Les 3 Storage Policies sont créées dans le Dashboard Supabase
- [ ] Test d'upload réussi depuis l'interface web
- [ ] Les documents manuels s'affichent correctement
- [ ] Les documents de certification (si annonces certifiées) s'affichent
- [ ] La suppression de documents manuels fonctionne
- [ ] Les admins peuvent voir tous les documents

---

**Le Digital Safe est prêt à l'emploi! 🎉**
