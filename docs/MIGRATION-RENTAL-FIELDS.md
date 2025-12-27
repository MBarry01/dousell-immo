# Migration: Ajout de period_start, period_end et tenant_id

## 🎯 Objectif

Ajouter trois nouveaux champs à la table `rental_transactions` pour aligner avec les spécifications du Cron Job:
- `period_start` (DATE): Date de début de période (ex: 2026-02-01)
- `period_end` (DATE): Date de fin de période (ex: 2026-02-29)
- `tenant_id` (UUID): Référence directe au locataire

## 📋 Étapes d'application

### Option 1: Via Supabase Dashboard (Recommandé)

1. **Accédez au SQL Editor**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor" dans le menu latéral

2. **Copiez le SQL ci-dessous**

```sql
-- 1. Ajouter les colonnes manquantes
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS period_start DATE,
ADD COLUMN IF NOT EXISTS period_end DATE,
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Créer les index pour optimisation
CREATE INDEX IF NOT EXISTS idx_rental_transactions_tenant_id
ON rental_transactions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_rental_transactions_period_dates
ON rental_transactions(period_start, period_end);

-- 3. Ajouter les commentaires explicatifs
COMMENT ON COLUMN rental_transactions.period_start IS 'Date de début de la période de location (ex: 2026-01-01)';
COMMENT ON COLUMN rental_transactions.period_end IS 'Date de fin de la période de location (ex: 2026-01-31)';
COMMENT ON COLUMN rental_transactions.tenant_id IS 'Référence directe au locataire (dénormalisé pour performance)';

-- 4. Migrer les données existantes (calculer period_start et period_end)
UPDATE rental_transactions
SET
    period_start = make_date(period_year, period_month, 1),
    period_end = (make_date(period_year, period_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
WHERE period_start IS NULL AND period_year IS NOT NULL AND period_month IS NOT NULL;
```

3. **Exécutez la migration**
   - Cliquez sur le bouton "Run" (ou Ctrl+Enter)
   - Vérifiez qu'il n'y a pas d'erreurs

4. **Vérification**
   ```sql
   SELECT id, period_month, period_year, period_start, period_end, tenant_id
   FROM rental_transactions
   LIMIT 5;
   ```

### Option 2: Via fichier de migration local

Si vous utilisez Supabase CLI localement:

```bash
cd c:/Users/Barry/Downloads/Doussel_immo
supabase db push --db-url "postgresql://..."
```

## ✅ Vérification post-migration

### 1. Vérifier les colonnes

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rental_transactions'
AND column_name IN ('period_start', 'period_end', 'tenant_id');
```

Résultat attendu:
```
 column_name  | data_type | is_nullable
--------------+-----------+-------------
 period_start | date      | YES
 period_end   | date      | YES
 tenant_id    | uuid      | YES
```

### 2. Vérifier les données migrées

```sql
SELECT
    period_month,
    period_year,
    period_start,
    period_end,
    CASE
        WHEN period_start IS NULL THEN '❌ Non migré'
        ELSE '✅ Migré'
    END as status
FROM rental_transactions
LIMIT 10;
```

### 3. Tester le Cron avec simulation

```bash
curl "http://localhost:3000/api/cron/generate-monthly-rentals?date=2026-02-01" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Résultat attendu:
```json
{
  "success": true,
  "message": "5 échéances générées",
  "processed": 5,
  "created": 5,
  "skipped": 0,
  "period": "2/2026",
  "period_start": "2026-02-01",
  "period_end": "2026-02-28"
}
```

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la migration:

```sql
-- Supprimer les colonnes ajoutées
ALTER TABLE rental_transactions
DROP COLUMN IF EXISTS period_start,
DROP COLUMN IF EXISTS period_end,
DROP COLUMN IF EXISTS tenant_id;

-- Supprimer les index
DROP INDEX IF EXISTS idx_rental_transactions_tenant_id;
DROP INDEX IF EXISTS idx_rental_transactions_period_dates;
```

## 📊 Impact

- **Tables affectées**: `rental_transactions` uniquement
- **Données existantes**: Automatiquement migrées (period_start/period_end calculés depuis period_month/period_year)
- **tenant_id**: Reste NULL pour l'instant (pas de table tenants séparée)
- **Performance**: Amélioration grâce aux index sur les dates
- **Compatibilité**: Aucun impact sur le code existant (colonnes facultatives)

## 🚀 Après la migration

Le Cron Job utilisera automatiquement ces nouveaux champs lors de la prochaine génération:

```typescript
// Nouveau format d'insertion
{
    lease_id: "...",
    period_month: 2,
    period_year: 2026,
    period_start: "2026-02-01",  // ✨ NOUVEAU
    period_end: "2026-02-28",    // ✨ NOUVEAU
    tenant_id: null,             // ✨ NOUVEAU
    amount_due: 100000,
    status: "pending"
}
```

## 📞 Support

En cas de problème:
1. Vérifiez les logs Supabase Dashboard → SQL Editor → Query History
2. Consultez [docs/GESTION-LOCATIVE-AUTOMATIQUE.md](GESTION-LOCATIVE-AUTOMATIQUE.md)
3. Contactez l'équipe de développement
