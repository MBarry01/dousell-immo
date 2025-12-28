# 📊 Finance System - Documentation Technique

## Vue d'ensemble

Le système financier de Dousell Immo assure la cohérence entre l'interface utilisateur, les KPIs, et le système de relances automatiques.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  (GestionLocativeClient.tsx + TenantTable.tsx)              │
│                                                              │
│  Affiche:                                                    │
│  - 🟢 Payé (status === 'paid')                              │
│  - 🟡 Attente (status !== 'paid' && currentDay <= billing_day)│
│  - 🔴 Retard (status !== 'paid' && currentDay > billing_day) │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      FINANCE GUARD                           │
│                    (lib/finance.ts)                          │
│                                                              │
│  Calcule:                                                    │
│  - Total Attendu (sum of active leases monthly_amount)      │
│  - Total Encaissé (sum of amount_paid or amount_due if paid)│
│  - Taux de recouvrement (%)                                 │
│  - Compteurs: paidCount, pendingCount, overdueCount         │
│                                                              │
│  RÈGLE: overdueCount++ si currentDay > billing_day           │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  REMINDERS SYSTEM                            │
│              (lib/reminders-service.ts)                      │
│                                                              │
│  Envoie relances si:                                         │
│  - status !== 'paid'                                         │
│  - reminder_sent === false                                   │
│  - daysOverdue >= 5 (calculé avec billing_day)              │
│                                                              │
│  Destinataires:                                              │
│  - TO: tenant_email                                          │
│  - CC: owner_email (from profile)                           │
└─────────────────────────────────────────────────────────────┘
```

## Sources de Vérité

### 1. Total Attendu
**Source**: Table `leases` (baux actifs)
```typescript
leases.filter(l => l.status === 'active')
  .reduce((sum, l) => sum + l.monthly_amount, 0)
```

### 2. Total Encaissé
**Source**: Table `rental_transactions`
```typescript
// Priorité 1: Colonne amount_paid (si elle existe)
// Priorité 2: Colonne amount_due si status='paid' (fallback)
if (transaction.status === 'paid') {
  paidAmount = transaction.amount_paid || transaction.amount_due
} else {
  paidAmount = transaction.amount_paid || 0 // Acompte partiel
}
```

### 3. Statut "En retard"
**Calcul synchronisé**:
```typescript
const billingDay = lease.billing_day || 5;
const currentDay = new Date().getDate();
const isCurrentMonth = /* check */;

const isOverdue = isCurrentMonth && currentDay > billingDay;
```

## Schéma de Base de Données

### Table `leases`
```sql
CREATE TABLE leases (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  property_address TEXT,
  monthly_amount INTEGER NOT NULL,  -- En FCFA
  billing_day INTEGER DEFAULT 5,    -- Jour de facturation (1-31)
  start_date DATE,
  status TEXT DEFAULT 'active',     -- 'active' | 'terminated' | 'pending'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `rental_transactions`
```sql
CREATE TABLE rental_transactions (
  id UUID PRIMARY KEY,
  lease_id UUID REFERENCES leases(id),
  period_month INTEGER NOT NULL,    -- 1-12
  period_year INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  amount_due INTEGER NOT NULL,      -- En FCFA
  amount_paid INTEGER DEFAULT 0,    -- ⚠️ À ajouter via migration
  status TEXT DEFAULT 'pending',    -- 'pending' | 'paid' | 'late'
  paid_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_rental_transactions_lease_period
ON rental_transactions(lease_id, period_year, period_month);

CREATE INDEX idx_rental_transactions_status_reminder
ON rental_transactions(status, reminder_sent);
```

### Table `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,          -- Email pour CC des quittances
  company_ninea TEXT,
  logo_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Flux de Paiement

### 1. Marquage comme "Payé"
```typescript
// actions.ts: confirmPayment()
1. Update transaction: status = 'paid', paid_at = now()
2. Récupérer profil propriétaire (profiles table)
3. Préparer données quittance
4. Appeler /api/send-receipt (Gmail)
5. Revalider page
```

### 2. Envoi Quittance Automatique
```typescript
// /api/send-receipt/route.tsx
1. Générer PDF (QuittancePDF_v2)
2. Configurer email:
   - TO: tenantEmail
   - CC: company_email || user.email
   - FROM: company_name <GMAIL_USER>
   - ATTACHMENT: PDF
3. Envoyer via Nodemailer (Gmail SMTP)
```

### 3. Relances J+5
```typescript
// lib/reminders-service.ts: internalProcessReminders()
1. Fetch transactions: status !== 'paid' AND reminder_sent = false
2. Pour chaque transaction:
   - Calculer dueDate = new Date(year, month-1, billing_day)
   - Calculer daysOverdue = differenceInDays(today, dueDate)
   - Si daysOverdue >= 5:
     * Envoyer email relance
     * Update reminder_sent = true
```

## Fonctions Utilitaires

### `calculateFinancials(leases, transactions, targetDate)`
Calcule les KPIs pour un mois donné.

**Paramètres**:
- `leases`: LeaseInput[] - Tous les baux
- `transactions`: TransactionInput[] - Transactions du mois ciblé
- `targetDate`: Date - Date cible (ex: 01/12/2025)

**Retour**: FinancialKPIs
```typescript
{
  totalExpected: number,
  totalCollected: number,
  collectionRate: number,  // %
  paidCount: number,
  pendingCount: number,
  overdueCount: number
}
```

### `calculateDisplayStatus(status, billingDay, isCurrentMonth)`
Calcule le statut d'affichage synchronisé.

**Retour**: `'paid' | 'pending' | 'overdue'`

### `validateTenantCreation(email, supabaseClient, ownerId)`
Vérifie qu'un email n'est pas déjà utilisé.

## Migration Requise

### Ajouter `amount_paid`
```sql
-- supabase/migrations/20251228130000_add_amount_paid.sql
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;

COMMENT ON COLUMN rental_transactions.amount_paid
IS 'Montant réellement payé (en FCFA)';
```

**Exécution**:
1. Via Supabase Dashboard → SQL Editor
2. Ou via CLI: `npx supabase db push`

## Configuration Requise

### Variables d'environnement (.env.local)
```env
# Gmail pour envoi quittances et relances
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Configuration Propriétaire
Dans "Configuration Premium" (Gestion Locative), renseigner:
- Nom commercial / Raison sociale
- Adresse complète
- **Email** (pour CC des quittances)
- NINEA
- Logo de l'agence
- Signature numérique

## Tests de Validation

### Scénario 1: Marquer comme Payé
1. Aller sur Gestion Locative
2. Cliquer "Marquer payé" sur une ligne en retard
3. Vérifier toast de confirmation
4. Vérifier email reçu (locataire + CC propriétaire)
5. Vérifier KPIs mis à jour

### Scénario 2: Relances Automatiques
1. Créer une transaction avec due_date > 5 jours dans le passé
2. Appeler `/api/cron` (ou bouton "Relances J+5")
3. Vérifier email relance envoyé
4. Vérifier `reminder_sent = true`

### Scénario 3: Synchronisation UI-KPIs
1. Comparer compteurs UI vs compteurs KPIs
2. Vérifier que "Retard" (rouge) = overdueCount
3. Vérifier que "Attente" (jaune) = pendingCount
4. Vérifier que "Payé" (vert) = paidCount

## Dépannage

### Problème: KPIs incohérents
**Solution**: Vérifier `billing_day` dans les baux

### Problème: Quittances non envoyées
**Solution**:
1. Vérifier GMAIL_USER et GMAIL_APP_PASSWORD
2. Vérifier `company_email` dans profiles
3. Vérifier logs console

### Problème: Relances non envoyées
**Solution**:
1. Vérifier colonne `reminder_sent` existe
2. Vérifier calcul `daysOverdue`
3. Exécuter script `scripts/verify-current-state.ts`

## Changelog

### v2.0 (2025-12-28)
- ✅ Synchronisation UI ↔ KPIs ↔ Relances
- ✅ Calcul statut basé sur `billing_day`
- ✅ Envoi automatique quittances (Gmail)
- ✅ Fallback `amount_paid` → `amount_due`
- ✅ Fonction `calculateDisplayStatus()`
- ✅ Documentation complète

### v1.0 (2025-12-27)
- Initial implementation
