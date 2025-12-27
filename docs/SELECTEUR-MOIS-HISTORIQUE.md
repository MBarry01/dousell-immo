# Sélecteur de mois et historique des paiements

## 🎯 Fonctionnalité

Le tableau de bord de gestion locative permet maintenant de **naviguer entre les mois** pour consulter l'historique complet des paiements.

## 🎨 Interface utilisateur

### Sélecteur de mois (MonthSelector)

```
┌────────────────────────────────────────────────────────┐
│  ←  │  📅  Janvier 2026            │  →              │
│     │  Revenir au mois actuel      │                  │
└────────────────────────────────────────────────────────┘
```

**Éléments**:
- Bouton `←` : Mois précédent
- Bouton `→` : Mois suivant
- Affichage central : Mois et année sélectionnés
- Lien "Revenir au mois actuel" : Visible uniquement si ≠ mois actuel

### Statistiques du mois

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Baux  │  Payés      │ En attente  │  En retard  │
│     5       │    3        │     1       │      1      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌──────────────────────────────────────────────────────┐
│  Montant total du mois: 330,000 FCFA                 │
│                 Encaissé: 230,000 FCFA (70% collecté)│
└──────────────────────────────────────────────────────┘
```

## 🔄 Flux de données

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                SERVER COMPONENT (page.tsx)                  │
│                                                              │
│  1. Fetch ALL leases (status=active)                        │
│  2. Fetch ALL transactions (tous les mois)                  │
│  3. Pass raw data to GestionLocativeClient                  │
│                                                              │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│          CLIENT COMPONENT (GestionLocativeClient)           │
│                                                              │
│  State: selectedMonth, selectedYear                         │
│                                                              │
│  Filter logic:                                               │
│  transactions.filter(t =>                                    │
│    t.period_month === selectedMonth &&                       │
│    t.period_year === selectedYear                            │
│  )                                                           │
│                                                              │
│  For each lease:                                             │
│    find_transaction(lease_id, month, year) → status         │
│                                                              │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│                   TENANT CARDS (TenantList)                 │
│                                                              │
│  Mohamadou Barry - Payé ✅    [Voir quittance]             │
│  Samba Barry     - En attente [Marquer payé]                │
│  Barry BARRY     - En retard  [Paiement reçu]               │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

## 📊 Scénarios d'utilisation

### Scénario 1: Navigation mensuelle

**État initial** (27 décembre 2025):
```
Sélecteur: [←] Décembre 2025 [→]

Locataires:
  Mohamadou Barry - Payé ✅
  Samba Barry     - Payé ✅
  Barry BARRY     - En attente
```

**User clique "→" (Janvier 2026)**:
```
Sélecteur: [←] Janvier 2026 [→]
           Revenir au mois actuel

Locataires:
  Mohamadou Barry - En attente  ← Nouvelle échéance!
  Samba Barry     - En attente  ← Nouvelle échéance!
  Barry BARRY     - En attente  ← Nouvelle échéance!

Note: Le Cron a créé les échéances de janvier le 1er janvier
```

**User clique "←" deux fois (Novembre 2025)**:
```
Sélecteur: [←] Novembre 2025 [→]
           Revenir au mois actuel

Locataires:
  Mohamadou Barry - Payé ✅
  Samba Barry     - Payé ✅
  Barry BARRY     - Payé ✅

Note: Historique des paiements passés
```

### Scénario 2: Consultation de l'historique

**Propriétaire veut vérifier si Samba a payé en novembre**:

1. Clique "←" depuis décembre → novembre
2. Voit "Samba Barry - Payé ✅"
3. Clique "Voir quittance" pour télécharger le PDF de novembre
4. Clique "Revenir au mois actuel" pour retourner à décembre

### Scénario 3: Anticipation des paiements futurs

**Propriétaire en décembre veut voir les échéances de janvier**:

1. Clique "→" depuis décembre → janvier
2. Voit toutes les échéances "En attente"
3. Note mentalement qu'il doit envoyer les avis d'échéance
4. Revient à décembre pour finaliser les paiements en cours

## 🧮 Calcul des statistiques

Les statistiques sont **recalculées dynamiquement** à chaque changement de mois:

```typescript
// GestionLocativeClient.tsx

const monthStats = {
    total: formattedTenants.length,
    paid: formattedTenants.filter(t => t.status === 'paid').length,
    pending: formattedTenants.filter(t => t.status === 'pending').length,
    overdue: formattedTenants.filter(t => t.status === 'overdue').length,
    totalAmount: formattedTenants.reduce((sum, t) => sum + t.rentAmount, 0),
    paidAmount: formattedTenants
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.rentAmount, 0),
};
```

**Exemple** (Janvier 2026):
- Total: 5 baux
- Payés: 0 (début du mois)
- En attente: 5
- En retard: 0 (pas encore de retard)
- Montant total: 330,000 FCFA
- Encaissé: 0 FCFA (0% collecté)

**Après paiement de Mohamadou**:
- Payés: 1 ✅
- En attente: 4
- Encaissé: 100,000 FCFA (30% collecté)

## 🔑 Logique clé

### Filtrage par mois (GestionLocativeClient.tsx:48-65)

```typescript
const formattedTenants = leases.map(lease => {
    // Trouver LA transaction pour ce mois spécifique
    const selectedTransaction = transactions.find(t =>
        t.lease_id === lease.id &&
        t.period_month === selectedMonth &&
        t.period_year === selectedYear
    );

    // Si pas de transaction = pending par défaut
    let displayStatus = selectedTransaction?.status || 'pending';

    // Calcul overdue uniquement pour le mois ACTUEL
    if (isCurrentMonth && displayStatus === 'pending' && overDueDate) {
        displayStatus = 'overdue';
    }

    return {
        id: lease.id,
        name: lease.tenant_name,
        status: displayStatus, // ← Statut pour CE mois
        last_transaction_id: selectedTransaction?.id
    };
});
```

### Gestion du changement de mois (MonthSelector.tsx:17-33)

```typescript
const handlePrevious = () => {
    if (selectedMonth === 1) {
        // Janvier → Décembre de l'année précédente
        onMonthChange(12, selectedYear - 1);
    } else {
        onMonthChange(selectedMonth - 1, selectedYear);
    }
};

const handleNext = () => {
    if (selectedMonth === 12) {
        // Décembre → Janvier de l'année suivante
        onMonthChange(1, selectedYear + 1);
    } else {
        onMonthChange(selectedMonth + 1, selectedYear);
    }
};
```

## 🎭 Comportements spéciaux

### 1. Statut "overdue" (en retard)

**Règle**: Un loyer est "en retard" uniquement si:
- C'est le mois ACTUEL (pas un mois passé ou futur)
- Le statut est "pending"
- La date actuelle > billing_day du bail

```typescript
const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 &&
    selectedYear === today.getFullYear();

if (isCurrentMonth && status === 'pending' && currentDay > billing_day) {
    status = 'overdue';
}
```

**Exemple**:
- Bail: Samba Barry, billing_day = 5
- Aujourd'hui: 27 décembre 2025
- Mois sélectionné: Décembre 2025 (current)
- Statut DB: pending
- → Affichage: **overdue** (car 27 > 5)

### 2. Mois futurs

Si le user navigue vers un mois futur où le Cron n'a pas encore créé d'échéances:

```
Sélecteur: [←] Mars 2026 [→]

Locataires:
  Mohamadou Barry - En attente (pas de transaction)
  Samba Barry     - En attente (pas de transaction)
  Barry BARRY     - En attente (pas de transaction)

Note: Échéances non créées = status "pending" par défaut
```

### 3. Bouton "Marquer payé"

Lorsque le user clique "Marquer payé" sur un locataire:

1. **Update de la transaction pour CE mois**:
   ```sql
   UPDATE rental_transactions
   SET status = 'paid', paid_at = NOW()
   WHERE id = transaction_id;
   ```

2. **Refresh de la page**:
   ```typescript
   router.refresh();
   ```

3. **Re-calcul des statuts**:
   - Le composant client re-exécute le filtrage
   - La transaction mise à jour a maintenant `status = 'paid'`
   - Le locataire s'affiche avec Badge "Payé" + bouton "Voir quittance"

4. **Autres locataires non affectés**:
   - Mohamadou devient "Payé"
   - Samba reste "En attente" (sa transaction n'a pas changé)

## 📁 Fichiers concernés

- [MonthSelector.tsx](../app/compte/gestion-locative/components/MonthSelector.tsx) - Sélecteur de mois
- [GestionLocativeClient.tsx](../app/compte/gestion-locative/components/GestionLocativeClient.tsx) - Logique de filtrage
- [page.tsx](../app/compte/gestion-locative/page.tsx) - Server component (fetch des données)
- [TenantList.tsx](../app/compte/gestion-locative/components/TenantList.tsx) - Affichage des cartes

## 🧪 Tests de validation

### Test 1: Navigation basique
1. Ouvrir `/compte/gestion-locative`
2. Noter le mois affiché (ex: Décembre 2025)
3. Cliquer "→" → Vérifier que le mois change (Janvier 2026)
4. Cliquer "←" deux fois → Vérifier Novembre 2025
5. Cliquer "Revenir au mois actuel" → Retour à Décembre

### Test 2: Changement d'année
1. Sélectionner Décembre 2025
2. Cliquer "→" → Vérifier Janvier **2026** (pas 2025!)
3. Cliquer "←" → Retour à Décembre **2025**

### Test 3: Statuts indépendants par mois
1. Sélectionner Décembre 2025
2. Noter: Mohamadou = Payé ✅
3. Changer vers Janvier 2026
4. Vérifier: Mohamadou = En attente (nouvelle échéance)
5. Revenir à Décembre 2025
6. Vérifier: Mohamadou = Payé ✅ (statut conservé)

### Test 4: Statistiques dynamiques
1. Sélectionner un mois avec 3 payés, 2 en attente
2. Noter: Badge "Payés: 3"
3. Changer de mois
4. Vérifier que les badges se mettent à jour

### Test 5: Paiement dans un mois spécifique
1. Sélectionner Janvier 2026
2. Cliquer "Marquer payé" pour Mohamadou
3. Vérifier: Mohamadou passe à "Payé"
4. Changer vers Décembre 2025
5. Vérifier: Mohamadou reste dans son état de décembre (indépendant)

## 💡 Avantages

1. **Historique complet**: Consulter les paiements des mois passés
2. **Anticipation**: Voir les échéances futures créées par le Cron
3. **Analyse**: Comparer les performances mois par mois
4. **Flexibilité**: Générer des quittances pour n'importe quel mois
5. **Indépendance**: Chaque mois est isolé, pas d'effet de bord

## 🚀 Évolutions futures possibles

- [ ] Graphique d'évolution du taux de collecte mensuel
- [ ] Export CSV/PDF des paiements d'un mois spécifique
- [ ] Comparaison mois à mois (Janvier vs Décembre)
- [ ] Prévisions basées sur l'historique
- [ ] Alertes automatiques pour les retards récurrents
- [ ] Vue calendrier annuelle
