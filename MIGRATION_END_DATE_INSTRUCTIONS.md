# 🔧 Instructions: Appliquer la Migration `end_date`

## ⚠️ Action Requise

La colonne `end_date` doit être ajoutée à la table `leases` pour que l'Assistant Juridique fonctionne complètement.

## 📋 Étapes à Suivre

### Option 1: Via l'Éditeur SQL Supabase (Recommandé)

1. **Ouvrir le Dashboard Supabase**
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet

2. **Ouvrir l'Éditeur SQL**
   - Cliquer sur "SQL Editor" dans la barre latérale
   - Cliquer sur "New Query"

3. **Copier-coller le script**
   - Copier tout le contenu de [`scripts/apply-end-date-migration.sql`](scripts/apply-end-date-migration.sql)
   - Le coller dans l'éditeur SQL

4. **Exécuter le script**
   - Cliquer sur "Run" ou appuyer sur `Ctrl+Enter`
   - Vérifier que le résultat affiche:
     ```
     column_name | data_type | is_nullable
     ------------|-----------|------------
     end_date    | date      | YES
     ```

### Option 2: Via CLI Supabase

Si les migrations CLI fonctionnent pour vous:

```bash
npx supabase db push --include-all
```

**Note:** Cette commande peut échouer si vous avez des migrations dupliquées. Dans ce cas, utilisez l'Option 1.

## 🔍 Vérification

Après avoir appliqué la migration, vérifier que:

1. **La colonne existe:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'leases' AND column_name = 'end_date';
   ```

2. **L'index a été créé:**
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'leases' AND indexname = 'idx_leases_end_date_status';
   ```

## 📊 Remplir les Données (Optionnel)

Si vous avez des baux existants, vous pouvez calculer leur `end_date`:

```sql
-- Exemple: Durée standard de 2 ans
UPDATE leases
SET end_date = start_date + INTERVAL '2 years'
WHERE end_date IS NULL
  AND start_date IS NOT NULL
  AND status = 'active';
```

**Ajustez la durée selon vos contrats:**
- `INTERVAL '1 year'` pour 1 an
- `INTERVAL '3 years'` pour 3 ans
- etc.

## 🎯 Résultat Attendu

Une fois la migration appliquée:

✅ **Assistant Juridique** affichera les vraies alertes
✅ **Widgets** montreront les compteurs J-180 et J-90
✅ **Cron job** pourra envoyer les emails d'échéance

## 🔄 État Actuel Sans Migration

**Sans la colonne `end_date`:**
- ✅ Les pages s'affichent sans erreur
- ✅ Les widgets sont visibles
- ⚠️ Aucune alerte n'apparaît (état vide normal)
- ⚠️ Message "Aucune échéance dans les 6 prochains mois"

**C'est voulu:** Le code gère gracieusement l'absence de la colonne.

## 📝 Script SQL Complet

Le script est dans: [`scripts/apply-end-date-migration.sql`](scripts/apply-end-date-migration.sql)

```sql
-- 1. Ajouter la colonne
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Commentaire
COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail...';

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
```

## ❓ Problèmes Fréquents

### "Permission denied for table leases"
→ Utiliser un compte avec droits `postgres` ou via le Dashboard Supabase

### "Column already exists"
→ Parfait! La migration a déjà été appliquée

### "Duplicate key constraint"
→ Utiliser l'Option 1 (Éditeur SQL) au lieu de la CLI

---

**Besoin d'aide?** Vérifier les logs dans le Dashboard Supabase → Logs → Database
