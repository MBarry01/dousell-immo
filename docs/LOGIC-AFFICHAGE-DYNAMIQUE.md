# Logique d'affichage dynamique - Liste des locataires

## 🎯 Principe fondamental

**Chaque locataire a son propre statut calculé indépendamment** depuis la base de données en fonction du loyer du mois en cours.

## 🔄 Flux de données

### 1. Chargement initial (Server Component)

**Fichier**: [app/compte/gestion-locative/page.tsx](../app/compte/gestion-locative/page.tsx)

```typescript
// Étape 1: Récupérer TOUS les baux actifs
const { data: leases } = await supabase
    .from('leases')
    .select('...')
    .eq('status', 'active');

// Étape 2: Récupérer TOUTES les transactions
const { data: transactions } = await supabase
    .from('rental_transactions')
    .select('...');

// Étape 3: Pour CHAQUE bail, trouver sa transaction du mois
const formattedTenants = leases.map(lease => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Recherche de LA transaction de ce locataire pour ce mois
    const latestTransaction = transactions.find(t =>
        t.lease_id === lease.id &&
        t.period_month === currentMonth &&
        t.period_year === currentYear
    );

    // Calcul du statut INDIVIDUEL
    let displayStatus = latestTransaction?.status || 'pending';

    if (displayStatus === 'pending' && currentDay > billing_day) {
        displayStatus = 'overdue';
    }

    return {
        id: lease.id,
        name: lease.tenant_name,
        status: displayStatus, // ← STATUT INDIVIDUEL
        last_transaction_id: latestTransaction?.id
    };
});
```

### 2. Affichage des cartes (Client Component)

**Fichier**: [app/compte/gestion-locative/components/TenantList.tsx](../app/compte/gestion-locative/components/TenantList.tsx)

```typescript
// CHAQUE locataire a sa propre carte avec son propre statut
{tenants.map((tenant) => (
    <TenantCard key={tenant.id}>
        {/* Affichage conditionnel INDIVIDUEL */}
        {tenant.status === 'paid' ? (
            <>
                <Badge>Payé</Badge>
                <Button onClick={() => handleViewReceipt(tenant)}>
                    Voir quittance
                </Button>
            </>
        ) : (
            <Button onClick={() => handleConfirmPayment(tenant.id)}>
                Marquer payé
            </Button>
        )}
    </TenantCard>
))}
```

## 🎬 Scénario d'utilisation

### État initial (1er janvier 2026, Cron vient de s'exécuter)

| Locataire | Transaction créée | Statut | UI affichée |
|-----------|-------------------|--------|-------------|
| Mohamadou Barry | Oui (01/2026) | pending | Bouton "Marquer payé" 🟠 |
| Samba Barry | Oui (01/2026) | pending | Bouton "Marquer payé" 🟠 |
| Barry BARRY | Oui (01/2026) | pending | Bouton "Marquer payé" 🟠 |

### Utilisateur clique "Marquer payé" pour Mohamadou

**Actions déclenchées:**

1. **Appel API** `confirmPayment(mohamadou_lease_id, transaction_id)`
   ```typescript
   // Server Action
   await supabase
       .from('rental_transactions')
       .update({ status: 'paid', paid_at: now() })
       .eq('id', transaction_id);
   ```

2. **Rafraîchissement** `router.refresh()`
   - Next.js re-exécute le Server Component
   - Re-fetch des données depuis Supabase
   - Recalcul des statuts individuels

3. **Nouvel état affiché:**

| Locataire | Transaction | Statut | UI affichée |
|-----------|-------------|--------|-------------|
| Mohamadou Barry | 01/2026 | **paid** ✅ | Badge "Payé" + "Voir quittance" 🟢 |
| Samba Barry | 01/2026 | pending | Bouton "Marquer payé" 🟠 |
| Barry BARRY | 01/2026 | pending | Bouton "Marquer payé" 🟠 |

### Utilisateur clique "Marquer payé" pour Samba

Même processus:

| Locataire | Transaction | Statut | UI affichée |
|-----------|-------------|--------|-------------|
| Mohamadou Barry | 01/2026 | paid ✅ | Badge "Payé" + "Voir quittance" 🟢 |
| Samba Barry | 01/2026 | **paid** ✅ | Badge "Payé" + "Voir quittance" 🟢 |
| Barry BARRY | 01/2026 | pending | Bouton "Marquer payé" 🟠 |

## 🧩 Architecture de la logique

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENT (page.tsx)                   │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Lease 1    │   │   Lease 2    │   │   Lease 3    │        │
│  │  Mohamadou   │   │    Samba     │   │    Barry     │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                   │                 │
│         ▼                  ▼                   ▼                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │ Transaction  │   │ Transaction  │   │ Transaction  │        │
│  │  01/2026     │   │  01/2026     │   │  01/2026     │        │
│  │ status: paid │   │ status: paid │   │status:pending│        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                   │                 │
│         ▼                  ▼                   ▼                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │tenant.status │   │tenant.status │   │tenant.status │        │
│  │   = 'paid'   │   │   = 'paid'   │   │  = 'pending' │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                   │                 │
└─────────┼──────────────────┼───────────────────┼─────────────────┘
          │                  │                   │
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLIENT COMPONENT (TenantList.tsx)               │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  TenantCard  │   │  TenantCard  │   │  TenantCard  │        │
│  │              │   │              │   │              │        │
│  │ Badge: Payé  │   │ Badge: Payé  │   │Btn: Marquer  │        │
│  │ Btn: Voir    │   │ Btn: Voir    │   │     payé     │        │
│  │   quittance  │   │   quittance  │   │              │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 🔑 Points clés

### ✅ Ce qui fonctionne

1. **Indépendance totale**: Chaque locataire a son propre statut calculé depuis SA transaction
2. **Pas de state partagé**: Pas de useState global qui pourrait causer des conflits
3. **Source de vérité unique**: La base de données (rental_transactions.status)
4. **Rafraîchissement automatique**: `router.refresh()` après chaque action
5. **Re-calcul à chaque refresh**: Les statuts sont toujours à jour

### ⚠️ Ce qui ne fonctionne PAS (et qu'il ne faut PAS faire)

1. ❌ **État local partagé**:
   ```typescript
   // MAUVAIS
   const [allTenantStatuses, setAllTenantStatuses] = useState({});
   ```

2. ❌ **Mutation directe du state**:
   ```typescript
   // MAUVAIS
   const updateTenant = (id) => {
       tenants.find(t => t.id === id).status = 'paid'; // ❌
   }
   ```

3. ❌ **Pas de refresh après mutation**:
   ```typescript
   // MAUVAIS
   await confirmPayment(id);
   // ← pas de router.refresh() = UI obsolète
   ```

## 🎨 Logique d'affichage conditionnelle

```typescript
// Pour CHAQUE locataire individuellement:

if (tenant.status === 'paid') {
    // ✅ Loyer payé ce mois
    return (
        <div className="bg-green-500/20">
            <Badge>Payé ✅</Badge>
            <Button onClick={handleViewReceipt}>
                Voir quittance
            </Button>
        </div>
    );
}

if (tenant.status === 'pending') {
    // ⏳ Loyer en attente (pas encore la date limite)
    return (
        <div className="bg-yellow-500/20">
            <Button onClick={handleConfirmPayment}>
                Marquer payé
            </Button>
        </div>
    );
}

if (tenant.status === 'overdue') {
    // 🔴 Loyer en retard (date limite dépassée)
    return (
        <div className="bg-red-500/20">
            <Badge>En retard</Badge>
            <Button onClick={handleConfirmPayment}>
                Paiement reçu
            </Button>
        </div>
    );
}
```

## 🧪 Test du comportement

### Test 1: Isolation des locataires

1. Ouvrez `/compte/gestion-locative`
2. Notez que Mohamadou = pending, Samba = pending
3. Cliquez "Marquer payé" pour Mohamadou
4. ✅ Mohamadou devient "Payé"
5. ✅ Samba reste "En attente" (non affecté)

### Test 2: Rafraîchissement

1. Marquez Mohamadou comme payé
2. Actualisez la page (F5)
3. ✅ Mohamadou est toujours "Payé" (persisté en DB)
4. ✅ Samba est toujours "En attente"

### Test 3: Mois suivant

1. Attendez le 1er février (ou simulez avec `?date=2026-02-01`)
2. Le Cron crée de nouvelles transactions pour février
3. ✅ Mohamadou = "En attente" (nouvelle échéance de février)
4. ✅ Samba = "En attente" (nouvelle échéance de février)
5. Les paiements de janvier restent accessibles via l'historique

## 💡 Pourquoi ça marche si bien

1. **Server-Side Rendering**: Les données viennent directement de la DB
2. **Aucun cache côté client**: Chaque refresh = nouvelles données
3. **Calcul à la volée**: Les statuts sont calculés à chaque rendu
4. **Atomicité**: Chaque action modifie UNE transaction à la fois
5. **Immutabilité**: On ne mute jamais les props, on refresh

## 🔗 Fichiers concernés

- [page.tsx](../app/compte/gestion-locative/page.tsx) - Logique serveur, calcul des statuts
- [TenantList.tsx](../app/compte/gestion-locative/components/TenantList.tsx) - Affichage et actions client
- [actions.ts](../app/compte/gestion-locative/actions.ts) - Server Actions (confirmPayment)

## 📚 Ressources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js router.refresh()](https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) (pour updates temps-réel futurs)
