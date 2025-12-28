# ⚖️ Assistant Juridique - Guide Complet

## 📋 Vue d'Ensemble

L'Assistant Juridique est un module de conformité pour la gestion des baux au Sénégal, conforme au COCC (Code des Obligations Civiles et Commerciales) et à la Loi de 2014.

**Fonctionnalités:**
- 📊 Tableau de bord de conformité ("Radar de Conformité")
- ⏰ Alertes automatiques J-180 (6 mois) et J-90 (3 mois)
- 📧 Emails automatiques via cron quotidien
- 📄 Génération de préavis (future feature)
- 🇸🇳 Vocabulaire juridique sénégalais

## 🎯 Accès Rapide

| Page | URL | Description |
|------|-----|-------------|
| Dashboard Principal | `/compte` | Widget premium avec stats |
| Gestion Locative | `/compte/gestion-locative` | Widget compact intégré |
| Assistant Juridique | `/compte/legal` | Interface complète |

## 🚀 État Actuel

### ✅ Fonctionnel
- [x] Pages et navigation
- [x] Server Actions sécurisées
- [x] Widgets sur tous les dashboards
- [x] Build production réussi
- [x] Design system cohérent
- [x] Gestion gracieuse si `end_date` manquant

### ⚠️ Action Requise
- [ ] **Appliquer la migration `end_date`** (voir section Migration)

Sans la migration:
- Les pages s'affichent sans erreur
- Message "Aucune échéance dans les 6 prochains mois"
- État vide normal (par design)

## 🔧 Migration Base de Données

### Étape 1: Appliquer la Migration

**Via Supabase Dashboard (Recommandé):**

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet
2. SQL Editor → New Query
3. Copier le contenu de [`scripts/apply-end-date-migration.sql`](scripts/apply-end-date-migration.sql)
4. Exécuter

**Le script ajoute:**
```sql
ALTER TABLE leases ADD COLUMN IF NOT EXISTS end_date DATE;
CREATE INDEX idx_leases_end_date_status ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
```

### Étape 2: Remplir les Données

Pour les baux existants (exemple avec durée de 2 ans):

```sql
UPDATE leases
SET end_date = start_date + INTERVAL '2 years'
WHERE end_date IS NULL
  AND start_date IS NOT NULL
  AND status = 'active';
```

**Ajustez selon vos contrats:**
- Résidentiel: généralement 2 ans
- Commercial: généralement 3-9 ans
- Meublé: généralement 1 an

### Étape 3: Vérification

```sql
-- Compter les baux avec end_date
SELECT
  COUNT(*) AS total_baux,
  COUNT(end_date) AS avec_end_date,
  COUNT(*) - COUNT(end_date) AS sans_end_date
FROM leases
WHERE status = 'active';
```

📖 **Documentation complète:** [`MIGRATION_END_DATE_INSTRUCTIONS.md`](MIGRATION_END_DATE_INSTRUCTIONS.md)

## 📊 Logique des Alertes

### J-180 (6 mois avant échéance)
**Objectif:** Préavis propriétaire (Congé pour Reprise)

```typescript
if (endDate <= sixMonthsFromNow && endDate > threeMonthsFromNow) {
    // Alerte J-180 : Important mais pas urgent
    // Badge orange
    // Email automatique au propriétaire
}
```

**Cadre légal:**
- Délai minimum: 6 mois pour congé propriétaire
- Obligation: Lettre recommandée
- Motifs: Reprise pour soi-même ou famille

### J-90 (3 mois avant échéance)
**Objectif:** Négociation avant tacite reconduction

```typescript
if (endDate <= threeMonthsFromNow && endDate > today) {
    // Alerte J-90 : Moment de négocier
    // Badge bleu
    // Email rappel au propriétaire
}
```

**Cadre légal:**
- Tacite reconduction: Renouvellement automatique
- Moment clé: Renégocier loyer/conditions
- Délai: Agir avant le renouvellement

## 🎨 Design System

### Couleurs Sémantiques

| Élément | Couleur | Code | Usage |
|---------|---------|------|-------|
| J-180 | Orange | `orange-500` | Congé Reprise (6 mois) |
| J-90 | Bleu | `blue-500` | Reconduction (3 mois) |
| Conforme | Vert | `green-500` | Aucune alerte |
| Urgent | Rouge | `red-500` | Dépassé (future) |

### Structure des Pages

**Dashboard Principal (`/compte`):**
```
┌─────────────────────────────────────────┐
│ Widget Premium "Assistant Juridique"    │
│ - Badge orange si alertes > 0          │
│ - Stats J-180 et J-90                  │
│ - Cliquable → /compte/legal            │
└─────────────────────────────────────────┘
```

**Gestion Locative (`/compte/gestion-locative`):**
```
┌─────────────────────────────────────────┐
│ Widget Compact "Conformité Juridique"   │
│ - Compteurs discrets                    │
│ - Lien vers assistant                   │
└─────────────────────────────────────────┘
```

**Assistant Juridique (`/compte/legal`):**
```
┌─────────────────────────────────────────┐
│ KPIs (Baux Actifs, Renouvellements, etc)│
├─────────────────────────────────────────┤
│ Radar des Échéances (Table)             │
│ - Locataire & Bien                      │
│ - Date échéance                         │
│ - Badge J-180/J-90                      │
│ - Statut (pending/sent)                 │
│ - Bouton "Générer Préavis"              │
├─────────────────────────────────────────┤
│ Générateurs Rapides                     │
│ - Quittance                             │
│ - Contrat de Bail                       │
├─────────────────────────────────────────┤
│ Cadre Juridique de Référence            │
│ - COCC, Décret 2014, Loi 2024          │
│ - Délais clés avec couleurs            │
└─────────────────────────────────────────┘
```

## 🔐 Sécurité

### Authentification
Toutes les Server Actions vérifient l'authentification:

```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    throw new Error("Non authentifié");
}
```

### Ownership
Les données sont filtrées par `owner_id`:

```typescript
.eq('owner_id', user.id)
```

### Validation
Zod schemas pour toutes les actions:

```typescript
const generateNoticeSchema = z.object({
    leaseId: z.string().uuid(),
    noticeType: z.enum(['J-180', 'J-90']),
});
```

## 📧 Système de Cron

### Configuration
**Fichier:** [`app/api/cron/lease-expirations/route.ts`](app/api/cron/lease-expirations/route.ts)

**Schedule (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/lease-expirations",
    "schedule": "0 8 * * *"
  }]
}
```
→ Exécution quotidienne à 8h00 UTC

### Service
**Fichier:** [`lib/lease-expiration-service.ts`](lib/lease-expiration-service.ts)

**Fonctionnement:**
1. Récupère baux actifs avec `end_date`
2. Calcule J-180 et J-90 via `date-fns`
3. Envoie emails (templates en français)
4. Log résultats

**Test manuel:**
```bash
npm run test:lease-expirations
```

## 📁 Structure des Fichiers

```
app/compte/(gestion)/
├── layout.tsx                          # Menu navigation
├── legal/
│   ├── page.tsx                        # Page principale
│   ├── actions.ts                      # Server Actions
│   └── components/
│       └── GenerateNoticeButton.tsx    # Bouton action
└── gestion-locative/
    ├── page.tsx                        # Page modifiée
    └── components/
        └── LegalAlertsWidget.tsx       # Widget compact

app/compte/
└── components/
    └── LegalAssistantWidget.tsx        # Widget dashboard

lib/
└── lease-expiration-service.ts         # Service emails

supabase/migrations/
└── 20251228140000_add_end_date_to_leases.sql

scripts/
├── apply-end-date-migration.sql        # Migration manuelle
└── test-lease-expirations.ts           # Test cron
```

## 🔄 Workflow Utilisateur

### Scénario 1: Propriétaire avec Bail Proche Échéance

1. **Dashboard (`/compte`)**
   - Widget montre "2 alertes"
   - Badge orange visible

2. **Clic sur widget**
   - Redirection vers `/compte/legal`

3. **Assistant Juridique**
   - Table affiche:
     - J-180: "Mamadou Diallo - 15 juin 2025"
     - J-90: "Khady Ndiaye - 30 mars 2025"

4. **Action**
   - Clic "Générer Préavis"
   - Toast success
   - (Future: PDF téléchargé)

### Scénario 2: Pas d'Alerte

1. **Dashboard**
   - Widget vert "Conforme"
   - Message positif

2. **Assistant Juridique**
   - Icône verte ✅
   - "Aucune échéance dans les 6 prochains mois"
   - "Tous vos baux sont à jour"

## 🚀 Prochaines Étapes

### Court Terme (Semaine 1-2)
- [ ] Appliquer migration `end_date` en production
- [ ] Tester cron en production
- [ ] Générer vrais PDFs de préavis

### Moyen Terme (Mois 1)
- [ ] Table `lease_alerts` pour tracker statut
- [ ] Synchroniser avec emails cron
- [ ] Templates de contrats personnalisables
- [ ] Historique des préavis envoyés

### Long Terme (Trimestre 1)
- [ ] Chatbot juridique (API Claude)
- [ ] Base jurisprudence sénégalaise
- [ ] Modèles de documents avancés
- [ ] Analytics conformité

## 📚 Ressources

### Documentation
- [`ASSISTANT_JURIDIQUE_UX.md`](ASSISTANT_JURIDIQUE_UX.md) - Philosophie UX
- [`MARCHE_SENEGALAIS_BAUX.md`](MARCHE_SENEGALAIS_BAUX.md) - Cadre légal
- [`INTEGRATION_FINALE.md`](INTEGRATION_FINALE.md) - Résumé technique
- [`MIGRATION_END_DATE_INSTRUCTIONS.md`](MIGRATION_END_DATE_INSTRUCTIONS.md) - Migration DB

### Code Clé
- Server Actions: [`legal/actions.ts`](app/compte/(gestion)/legal/actions.ts)
- Page Legal: [`legal/page.tsx`](app/compte/(gestion)/legal/page.tsx)
- Service Cron: [`lib/lease-expiration-service.ts`](lib/lease-expiration-service.ts)

### Références Juridiques
- COCC (Code des Obligations Civiles et Commerciales)
- Décret de 2014 sur la baisse des loyers
- Loi de régulation 2024
- Droit OHADA (usage commercial)

## ❓ FAQ

**Q: Pourquoi la page affiche "Aucune échéance" ?**
R: Soit la migration `end_date` n'est pas appliquée, soit vos baux n'ont pas de date de fin renseignée.

**Q: Comment tester le cron localement ?**
R: `npm run test:lease-expirations` (voir `scripts/test-lease-expirations.ts`)

**Q: Les emails sont envoyés en double ?**
R: Le cron envoie 1 email J-180 et 1 email J-90 par bail. C'est voulu.

**Q: Comment personnaliser les templates email ?**
R: Modifier `lib/lease-expiration-service.ts` → fonctions `sendJ180Email` et `sendJ90Email`

**Q: Le build échoue avec une erreur auth ?**
R: Utiliser `createClient()` serveur, pas `getCurrentUser()` client (voir `legal/actions.ts`)

---

**Version:** 1.0.0
**Date:** 2025-12-28
**Statut:** ✅ Production Ready (avec migration)
