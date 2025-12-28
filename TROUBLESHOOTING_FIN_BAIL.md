# 🔧 Dépannage: Le champ "Fin bail" ne se sauvegarde pas

## 🔍 Problème

Vous voyez le champ "Fin bail" dans le formulaire de modification, mais quand vous enregistrez, la date ne se sauvegarde pas.

## ✅ Cause

**La colonne `end_date` n'existe pas encore dans la base de données.**

Le code de l'application est prêt (formulaire + Server Actions), mais la migration SQL n'a pas encore été appliquée.

## 🚀 Solution (2 minutes)

### Étape 1: Vérifier l'État Actuel

1. Ouvrir **Supabase Dashboard**
   - https://supabase.com/dashboard
   - Sélectionner votre projet "Dousell Immo"

2. Cliquer sur **"SQL Editor"** (menu gauche)

3. Cliquer sur **"New Query"**

4. Copier-coller ce script de vérification:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'leases' AND column_name = 'end_date';
   ```

5. Cliquer sur **"Run"**

**Résultats possibles:**

#### ❌ Aucun résultat (0 lignes)
→ La colonne n'existe pas, passez à l'Étape 2

#### ✅ 1 ligne retournée
```
column_name | data_type | is_nullable
------------|-----------|------------
end_date    | date      | YES
```
→ La colonne existe déjà ! Le problème est ailleurs (voir section "Autres Causes")

---

### Étape 2: Appliquer la Migration

1. Dans **SQL Editor**, créer une **nouvelle requête**

2. Copier-coller le script complet:
   ```sql
   -- Migration: Ajouter end_date pour Assistant Juridique
   ALTER TABLE leases ADD COLUMN IF NOT EXISTS end_date DATE;

   COMMENT ON COLUMN leases.end_date IS
     'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois)';

   CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
   ON leases(end_date, status)
   WHERE status = 'active' AND end_date IS NOT NULL;

   -- Vérification
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'leases' AND column_name = 'end_date';
   ```

3. Cliquer sur **"Run"** (ou `Ctrl+Enter`)

4. Vérifier le résultat en bas:
   ```
   column_name | data_type | is_nullable
   ------------|-----------|------------
   end_date    | date      | YES
   ```

**Si vous voyez cette ligne → Migration réussie! ✅**

---

### Étape 3: Tester

1. Retourner sur votre application (rafraîchir la page si besoin)

2. Aller sur `/compte/gestion-locative`

3. Cliquer sur un locataire (ex: Massamba Dikhité)

4. Remplir le champ **"Fin bail"** (ex: `01/12/2027`)

5. Cliquer **"Enregistrer"**

6. ✅ La date devrait être sauvegardée

7. Vérifier en rouvrant le formulaire → La date doit être affichée

---

## 🔍 Vérification dans la Base de Données

Pour confirmer que la date a été sauvegardée:

1. **Supabase Dashboard** → **Table Editor**

2. Sélectionner la table **`leases`**

3. Chercher la ligne correspondante (ex: Massamba Dikhité)

4. Vérifier que la colonne **`end_date`** contient la date

---

## ⚠️ Autres Causes Possibles

Si la migration est appliquée mais le problème persiste:

### 1. Erreur de Permission Supabase

**Vérifier les Row Level Security (RLS) policies:**

```sql
-- Vérifier les policies existantes
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'leases';
```

**Solution:** Vérifier que l'utilisateur a le droit `UPDATE` sur la table `leases`.

### 2. Erreur JavaScript dans la Console

**Ouvrir la Console du Navigateur:**
- Chrome/Edge: `F12` → Onglet "Console"
- Firefox: `F12` → Onglet "Console"

**Chercher des erreurs rouges lors de l'enregistrement**

**Erreurs courantes:**
- `400 Bad Request` → La colonne n'existe pas
- `403 Forbidden` → Problème de permissions RLS
- `Network error` → Problème de connexion Supabase

### 3. Cache du Navigateur

**Vider le cache:**
- `Ctrl+Shift+R` (Windows/Linux)
- `Cmd+Shift+R` (Mac)

Ou en navigation privée pour tester.

### 4. Vérifier les Server Actions

**Ouvrir la console réseau (F12 → Network):**
- Enregistrer le formulaire
- Chercher la requête vers `/api/...` ou Server Action
- Vérifier la réponse

**Payload attendu:**
```json
{
  "tenant_name": "Massamba Dikhité",
  "tenant_phone": "+33751081579",
  "tenant_email": "barrymohamadou98@gmail.com",
  "property_address": "38 rue chemin st léger, 93240, stains",
  "monthly_amount": 15000,
  "billing_day": 5,
  "start_date": "2025-12-01",
  "end_date": "2027-12-01"  // ✅ Cette valeur doit être présente
}
```

---

## 📝 Logs de Débogage

### Activer les Logs Server Actions

Éditer temporairement `app/compte/(gestion)/gestion-locative/actions.ts`:

```typescript
export async function updateLease(leaseId: string, data: {
    // ...
    end_date?: string;
}) {
    console.log('🔍 [updateLease] leaseId:', leaseId);
    console.log('🔍 [updateLease] data:', data);

    // ... reste du code

    const { error } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', leaseId);

    console.log('🔍 [updateLease] updateData:', updateData);
    console.log('🔍 [updateLease] error:', error);

    // ...
}
```

Vérifier les logs dans le terminal où `npm run dev` tourne.

---

## 📚 Fichiers de Référence

- [EditTenantDialog.tsx](app/compte/(gestion)/gestion-locative/components/EditTenantDialog.tsx:60-61) - Récupération du champ
- [actions.ts](app/compte/(gestion)/gestion-locative/actions.ts:341,370) - Server Action
- [Migration SQL](scripts/apply-end-date-migration.sql) - Script à appliquer

---

## 🆘 Support Rapide

**Résumé du problème:**

1. ❌ Champ visible mais ne se sauvegarde pas
   → Appliquer la migration SQL

2. ✅ Migration appliquée mais erreur 400
   → Vider le cache navigateur (`Ctrl+Shift+R`)

3. ✅ Migration appliquée, pas d'erreur, mais valeur non sauvegardée
   → Vérifier RLS policies Supabase

4. ✅ Tout fonctionne mais valeur `null` en base
   → Le champ était vide lors de la soumission

---

**Date:** 2025-12-28
**Fichier:** TROUBLESHOOTING_FIN_BAIL.md
**Prochaine étape:** Appliquer [scripts/apply-end-date-migration.sql](scripts/apply-end-date-migration.sql)
