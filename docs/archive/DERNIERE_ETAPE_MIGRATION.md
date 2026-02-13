# ✅ Dernière Étape : Migration Base de Données

## 🎉 Tout est Prêt Côté Code!

✅ **Formulaire de création** - Champ "Fin bail" ajouté
✅ **Formulaire de modification** - Champ "Fin bail" ajouté
✅ **Server Actions** - Support de `end_date` implémenté
✅ **Build production** - Réussi sans erreurs
✅ **Assistant Juridique** - Intégration complète

## ⚠️ Il Reste 1 Seule Chose : La Migration SQL

### Pourquoi Faire Cette Migration?

Sans la colonne `end_date` dans la table `leases`:
- ❌ Le champ "Fin bail" ne se sauvegarde pas
- ❌ L'Assistant Juridique affiche "0 Renouvellements"
- ❌ Pas d'alertes J-180 et J-90

Avec la migration:
- ✅ Le champ "Fin bail" fonctionne
- ✅ Les alertes s'affichent automatiquement
- ✅ Emails automatiques via cron

## 📋 Instructions (2 minutes)

### Étape 1: Ouvrir Supabase SQL Editor

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet "Dousell Immo"
3. Cliquer sur "SQL Editor" dans le menu de gauche
4. Cliquer sur "New Query"

### Étape 2: Copier-Coller ce Script

```sql
-- ========================================
-- Migration: Ajouter end_date à la table leases
-- Pour: Assistant Juridique (Alertes J-180 et J-90)
-- ========================================

-- 1. Ajouter la colonne end_date
ALTER TABLE leases
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Commentaire explicatif
COMMENT ON COLUMN leases.end_date IS 'Date de fin prévue du bail. Utilisée pour les alertes J-180 (6 mois) et J-90 (3 mois) conformément au droit sénégalais.';

-- 3. Index pour performance (requêtes cron)
CREATE INDEX IF NOT EXISTS idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;

-- 4. Vérification (vous devriez voir: end_date | date | YES)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leases' AND column_name = 'end_date';
```

### Étape 3: Exécuter

1. Cliquer sur le bouton "Run" (ou `Ctrl+Enter`)
2. Vérifier le résultat en bas:

**Résultat Attendu:**
```
column_name | data_type | is_nullable
------------|-----------|------------
end_date    | date      | YES
```

Si vous voyez cette ligne → **Migration réussie!** ✅

## ✅ Après la Migration

### Test 1: Modifier un Bail

1. Aller sur `/compte/gestion-locative`
2. Cliquer sur un locataire (ex: Barry BARRY)
3. Vous verrez le nouveau champ **"Fin bail"**
4. Remplir une date (ex: `05/12/2027` pour un bail de 2 ans)
5. Cliquer "Enregistrer"

### Test 2: Vérifier l'Assistant Juridique

1. Aller sur `/compte/legal`
2. Si la date de fin est dans moins de 6 mois:
   - **KPI "Renouvellements"** affiche un nombre > 0
   - **Table "Radar des Échéances"** montre les alertes
   - **Badge orange** (J-180) ou **bleu** (J-90)

### Test 3: Créer un Nouveau Bail

1. `/compte/gestion-locative` → Bouton "Nouveau"
2. Remplir les informations
3. **Nouveau champ "Fin bail"** visible
4. Le remplir est optionnel mais recommandé

## 🔧 Remplir les Dates Manquantes (Optionnel)

Si vous avez des baux existants sans `end_date`, vous pouvez les calculer automatiquement:

```sql
-- Pour les baux de 2 ans (durée standard résidentielle au Sénégal)
UPDATE leases
SET end_date = start_date + INTERVAL '2 years'
WHERE end_date IS NULL
  AND start_date IS NOT NULL
  AND status = 'active';

-- Vérifier le résultat
SELECT
  tenant_name,
  start_date,
  end_date,
  end_date - CURRENT_DATE AS jours_restants
FROM leases
WHERE status = 'active' AND end_date IS NOT NULL
ORDER BY end_date;
```

**Ajustez la durée selon vos contrats:**
- Résidentiel: `'2 years'` (standard)
- Commercial: `'3 years'` ou `'9 years'`
- Meublé: `'1 year'`

## 📊 Résultat Final

Une fois la migration appliquée et les dates renseignées:

### Dashboard Principal (`/compte`)
```
┌───────────────────────────────────┐
│ 🏛️ Assistant Juridique            │
│ ⚠️  2 alertes                      │
│                                   │
│ 🟠 J-180 (6 mois): 1              │
│ 🔵 J-90 (3 mois): 1               │
└───────────────────────────────────┘
```

### Gestion Locative (`/compte/gestion-locative`)
```
┌───────────────────────────────────┐
│ ⚖️ Conformité Juridique            │
│ 🟠 2 alertes                       │
│                                   │
│ J-180 (Congé Reprise): 1          │
│ J-90 (Reconduction): 1            │
└───────────────────────────────────┘
```

### Assistant Juridique (`/compte/legal`)
```
┌──────────────────────────────────────────┐
│ KPIs                                      │
│ 📄 Baux Actifs: 8                         │
│ 🟠 Renouvellements (3 mois): 2            │
│ ⚠️ Risque Juridique: 0                    │
├──────────────────────────────────────────┤
│ Radar des Échéances                       │
│ ┌──────────────────────────────────────┐ │
│ │ Barry BARRY      | 30 juin 2027     │ │
│ │ 38 rue chemin st | 🟠 J-180 (Congé) │ │
│ │ [Générer Préavis]                    │ │
│ ├──────────────────────────────────────┤ │
│ │ Khardiatou Sy    | 15 mars 2027     │ │
│ │ 15 allée...      | 🔵 J-90 (Recon.) │ │
│ │ [Générer Préavis]                    │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## 🚀 Emails Automatiques (Cron)

Une fois les dates renseignées, le cron quotidien (8h00) enverra:

**Email J-180 (6 mois avant):**
```
Objet: ⚠️ Préavis Légal - Échéance Bail dans 6 mois

Bonjour,

Le bail de [Locataire] arrivera à échéance le [Date].

🔴 Action Requise (J-180):
Délai légal pour envoyer un congé pour reprise.

Conformité: Loi 2014 & COCC Sénégal
```

**Email J-90 (3 mois avant):**
```
Objet: 📅 Rappel - Reconduction Bail dans 3 mois

Bonjour,

Le bail de [Locataire] arrivera à échéance le [Date].

🔵 Tacite Reconduction:
Dernière opportunité de négocier avant renouvellement automatique.
```

## ❓ FAQ

**Q: La migration a échoué avec "permission denied"**
→ Utiliser un compte admin ou le service role key de Supabase

**Q: J'ai appliqué la migration mais "0 Renouvellements"**
→ Normal! Il faut remplir les `end_date` via le formulaire ou SQL

**Q: Comment calculer la date de fin si je connais la durée?**
→ Utiliser le script SQL ci-dessus (section "Remplir les Dates Manquantes")

**Q: Puis-je laisser `end_date` vide?**
→ Oui, c'est optionnel. Mais sans date, pas d'alertes juridiques.

---

**Status:** ✅ Code prêt - Attente migration SQL uniquement
**Temps estimé:** 2 minutes
**Fichier SQL:** Copier le script ci-dessus dans Supabase SQL Editor
