# 🗺️ Routes Assistant Juridique

## Navigation Utilisateur

### 1. Dashboard Principal
**URL:** `/compte`
**Composant:** [app/compte/page.tsx](app/compte/page.tsx)
**Widget:** [LegalAssistantWidget.tsx](app/compte/components/LegalAssistantWidget.tsx)
**Description:**
- Widget premium "Assistant Juridique"
- Badge orange avec nombre d'alertes
- Clic → Redirige vers `/compte/legal`

---

### 2. Gestion Locative
**URL:** `/compte/gestion-locative`
**Composant:** [app/compte/(gestion)/gestion-locative/page.tsx](app/compte/(gestion)/gestion-locative/page.tsx)
**Widget:** [LegalAlertsWidget.tsx](app/compte/(gestion)/gestion-locative/components/LegalAlertsWidget.tsx)
**Description:**
- Widget compact "Conformité Juridique"
- Compteurs J-180 et J-90
- Clic → Redirige vers `/compte/legal`

**Formulaires:**
- **Création:** [AddTenantButton.tsx](app/compte/(gestion)/gestion-locative/components/AddTenantButton.tsx)
  - Bouton "Nouveau"
  - Champ "Fin bail" (optionnel)
- **Modification:** [EditTenantDialog.tsx](app/compte/(gestion)/gestion-locative/components/EditTenantDialog.tsx)
  - Clic sur ligne locataire
  - Champ "Fin bail" visible

---

### 3. Assistant Juridique
**URL:** `/compte/legal`
**Composant:** [app/compte/(gestion)/legal/page.tsx](app/compte/(gestion)/legal/page.tsx)
**Server Actions:** [app/compte/(gestion)/legal/actions.ts](app/compte/(gestion)/legal/actions.ts)

**Sections:**

#### KPIs
- 📄 Baux Actifs
- 🟠 Renouvellements (3 mois)
- ⚠️ Risque Juridique
- 📊 Score de Conformité

#### Table "Radar des Échéances"
- Locataire
- Date d'échéance
- Badge J-180 (🟠) ou J-90 (🔵)
- Bouton "Générer Préavis"

#### Générateurs Juridiques
- Préavis de Congé
- Modèles de Lettres

#### Référence Juridique
- Code des Obligations Civiles et Commerciales (COCC)
- Loi 2014 (Baux d'habitation)

---

## Server Actions

### Legal Actions ([app/compte/(gestion)/legal/actions.ts](app/compte/(gestion)/legal/actions.ts))

#### `getLegalStats()`
```typescript
export async function getLegalStats(): Promise<LegalStats>
```
**Retour:**
```typescript
{
    activeLeases: number;       // Nombre de baux actifs
    upcomingRenewals: number;   // Alertes J-180 + J-90
    legalRisks: number;         // Toujours 0 pour l'instant
    complianceScore: number;    // Score 0-100
}
```

#### `getLeaseAlerts()`
```typescript
export async function getLeaseAlerts(): Promise<LeaseAlert[]>
```
**Retour:**
```typescript
{
    id: string;
    tenant_name: string;
    property_address: string;
    end_date: string;           // YYYY-MM-DD
    alert_type: 'j180' | 'j90'; // 6 mois ou 3 mois
    days_until_expiry: number;
}
```

#### `generateNotice(leaseId: string, noticeType: string)`
```typescript
export async function generateNotice(
    leaseId: string,
    noticeType: 'termination' | 'renewal'
): Promise<{ success: boolean; message: string }>
```

#### `getLeaseTransactions(leaseId: string)`
```typescript
export async function getLeaseTransactions(
    leaseId: string
): Promise<Transaction[]>
```

### Gestion Locative Actions ([app/compte/(gestion)/gestion-locative/actions.ts](app/compte/(gestion)/gestion-locative/actions.ts))

#### `createNewLease(data)`
```typescript
export async function createNewLease(data: {
    owner_id: string;
    tenant_name: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount: number;
    billing_day?: number;
    start_date?: string;
    end_date?: string;  // ✅ Nouveau
    status: 'active' | 'terminated' | 'pending';
})
```

#### `updateLease(leaseId, data)`
```typescript
export async function updateLease(leaseId: string, data: {
    tenant_name?: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount?: number;
    billing_day?: number;
    start_date?: string;
    end_date?: string;  // ✅ Nouveau
})
```

---

## API Cron

### Lease Expirations
**Route:** [/api/cron/lease-expirations/route.ts](app/api/cron/lease-expirations/route.ts)
**Service:** [lib/lease-expiration-service.ts](lib/lease-expiration-service.ts)
**Fréquence:** Quotidien à 8h00
**Fonction:**
- Scanne tous les baux actifs
- Détecte J-180 et J-90
- Envoie emails automatiques
- Utilise templates `emails/lease-expiration-*.html`

---

## Base de Données

### Table `leases`
```sql
CREATE TABLE leases (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id),
    tenant_name TEXT NOT NULL,
    tenant_phone TEXT,
    tenant_email TEXT,
    property_address TEXT,
    monthly_amount NUMERIC NOT NULL,
    billing_day INTEGER DEFAULT 5,
    start_date DATE,
    end_date DATE,  -- ✅ Colonne ajoutée par migration
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- ...
);

-- Index pour performance
CREATE INDEX idx_leases_end_date_status
ON leases(end_date, status)
WHERE status = 'active' AND end_date IS NOT NULL;
```

---

## Flux de Données

### Création d'un Bail
```
Utilisateur
    ↓ Remplit formulaire
AddTenantButton
    ↓ FormData avec end_date
createNewLease() (Server Action)
    ↓ Insert dans Supabase
Table leases
    ↓ end_date stocké
Cron quotidien
    ↓ Scanne end_date
Emails J-180 et J-90
```

### Modification d'un Bail
```
Utilisateur
    ↓ Clic sur locataire
EditTenantDialog
    ↓ Affiche defaultValue={tenant.endDate}
Utilisateur
    ↓ Modifie end_date
updateLease() (Server Action)
    ↓ Update Supabase
Table leases
    ↓ end_date mis à jour
Assistant Juridique
    ↓ Recalcule alertes
Affichage mis à jour
```

### Affichage Assistant Juridique
```
Page /compte/legal
    ↓ Server Component
getLegalStats()
    ↓ Query Supabase
getLeaseAlerts()
    ↓ Filtre par date
    ↓ Calcul jours restants
UI
    ↓ KPIs
    ↓ Table alertes
    ↓ Boutons actions
```

---

## Tests

### Test 1: Navigation
```
1. /compte → Voir widget "Assistant Juridique"
2. Clic → Redirige vers /compte/legal
3. /compte/gestion-locative → Voir widget "Conformité"
4. Clic → Redirige vers /compte/legal
```

### Test 2: Formulaires
```
1. /compte/gestion-locative → "Nouveau"
2. Remplir champ "Fin bail"
3. Enregistrer
4. Vérifier en base: end_date rempli
```

### Test 3: Assistant Juridique
```
1. /compte/legal
2. Vérifier KPIs affichés
3. Vérifier table alertes
4. Clic "Générer Préavis" → Toast success
```

---

## Sécurité

### Authentification
**Tous les Server Actions:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    throw new Error("Non authentifié");
}
```

### Row Level Security (RLS)
**Supabase:**
```sql
-- Les utilisateurs ne voient que leurs propres baux
CREATE POLICY "Users can view own leases"
ON leases FOR SELECT
USING (auth.uid() = owner_id);
```

---

**Date:** 2025-12-28
**Build:** ✅ Réussi
**Status:** Production Ready
