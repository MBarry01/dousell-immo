---
name: Rental Payment System
description: Architecture et flux des paiements locatifs (Stripe, fallback, webhook)
---

# Rental Payment System

## Schéma `rental_transactions`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `lease_id` | UUID | FK vers `leases` |
| `period_month` | INTEGER | Mois de la période (1-12) |
| `period_year` | INTEGER | Année de la période |
| `amount_due` | DECIMAL | Montant dû |
| `amount_paid` | INTEGER | Montant payé |
| `status` | TEXT | `pending`, `paid`, `overdue` |
| `paid_at` | TIMESTAMPTZ | Date de paiement |
| `payment_method` | TEXT | `stripe`, `manual`, `transfer` |
| `payment_ref` | TEXT | ID Stripe session/transaction |
| `team_id` | UUID | FK pour multi-tenant |
| `owner_id` | UUID | FK vers `profiles` |
| `meta` | JSONB | Métadonnées (provider, timestamps) |

## Flux de paiement Stripe

```
┌─────────────┐     ┌────────────────────┐     ┌──────────────────┐
│ /locataire  │────▶│ Stripe Checkout    │────▶│ Webhook          │
│ Payer       │     │ createRentSession  │     │ /api/stripe/     │
└─────────────┘     └────────────────────┘     │ webhook          │
                                               └────────┬─────────┘
                                                        │
                    ┌────────────────────┐              │
                    │ /paiement-succes   │◀─────────────┘
                    │ saveRentPayment    │
                    │ Fallback           │
                    └────────────────────┘
```

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `app/api/stripe/webhook/route.ts` | Webhook Stripe - marque paiement "paid" |
| `app/locataire/paiement-succes/page.tsx` | Page succès + fallback si webhook échoue |
| `lib/stripe-rent.ts` | Création session Stripe pour loyer |

## Fonction `saveRentPaymentFallback`

**Localisation**: `app/locataire/paiement-succes/page.tsx`

Cette fonction est **idempotente** et sert de filet de sécurité si le webhook Stripe n'a pas traité le paiement :

1. Récupère `team_id` et `owner_id` depuis le bail
2. Vérifie si transaction "paid" existe déjà → skip
3. Vérifie si transaction "pending" existe → update vers "paid"
4. Sinon → insert nouvelle transaction "paid"

```typescript
// Colonnes OBLIGATOIRES pour insert/update
{
  status: 'paid',
  paid_at: new Date().toISOString(),
  payment_method: 'stripe',
  payment_ref: sessionId,
  amount_paid: amountFcfa,
  team_id: teamId,  // Pour visibilité dashboard /gestion
  owner_id: ownerId,
  meta: { provider: 'stripe', ... }
}
```

## ⚠️ Pièges courants

1. **Colonnes manquantes** : Si erreur `PGRST204`, vérifier que les colonnes existent en DB
2. **Webhook vs Fallback** : Les deux chemins doivent avoir la même logique d'insert
3. **team_id requis** : Sans `team_id`, les transactions n'apparaissent pas dans `/gestion`
4. **Admin client** : Utiliser `createAdminClient()` pour bypass RLS dans les webhooks

## Migration colonnes manquantes

```sql
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_ref TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
```

## Debugging

Script pour vérifier les paiements d'un bail :

```bash
npx tsx scripts/check-lease.ts
```

Logs à surveiller :
- `✅ Rent payment updated (fallback)` - Transaction pending mise à jour
- `✅ Rent payment created (fallback)` - Nouvelle transaction créée
- `❌ Failed to insert/update payment` - Erreur DB (vérifier colonnes)
