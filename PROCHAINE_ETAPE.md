# 🚀 Prochaine Étape: Activer l'Assistant Juridique

## ⚡ Action Unique (2 minutes)

### 1. Ouvrir Supabase Dashboard
👉 https://supabase.com/dashboard

### 2. SQL Editor
- Cliquer sur **"SQL Editor"** (menu gauche)
- Cliquer sur **"New Query"**

### 3. Copier-Coller ce Script

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

### 4. Cliquer "Run"
✅ Vous devriez voir:
```
column_name | data_type | is_nullable
------------|-----------|------------
end_date    | date      | YES
```

---

## ✅ C'est Tout !

Après cette migration:
- ✅ Formulaires création/modification: Champ "Fin bail" fonctionnel
- ✅ Assistant Juridique: Alertes J-180 et J-90 activées
- ✅ Emails automatiques: Cron quotidien opérationnel
- ✅ Dashboard: Widget conformité juridique affiché

---

## 📝 Tests Rapides

1. **Modifier un bail:**
   - `/compte/gestion-locative` → Cliquer sur un locataire
   - Remplir "Fin bail" (ex: `05/12/2027`)
   - Enregistrer

2. **Vérifier Assistant Juridique:**
   - `/compte/legal`
   - Voir les alertes s'afficher

---

## 📚 Documentation Complète

- [STATUS_ASSISTANT_JURIDIQUE.md](STATUS_ASSISTANT_JURIDIQUE.md) - État complet de l'intégration
- [DERNIERE_ETAPE_MIGRATION.md](DERNIERE_ETAPE_MIGRATION.md) - Guide détaillé
- [scripts/apply-end-date-migration.sql](scripts/apply-end-date-migration.sql) - Script SQL complet

---

**Temps estimé:** 2 minutes
**Difficulté:** ⭐ (copier-coller)
**Impact:** 🔥 Assistant Juridique 100% fonctionnel
