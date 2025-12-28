# 🚀 ROADMAP - Panels d'Automatisation Gestion Locative

## Vue d'ensemble

Ce document définit l'architecture et le plan d'implémentation des panels d'automatisation pour transformer la gestion locative en système ultra-performant.

---

## 📋 Panel 1: Relances Intelligentes ⚡

### Objectif
Dashboard temps réel du système de relances automatiques avec visibilité totale sur les emails envoyés.

### Emplacement
Sous le tableau principal (même layout que MaintenanceHub)

### Fonctionnalités détaillées

#### 1.1 Stats en temps réel
```typescript
interface ReminderStats {
  toSendToday: number;        // Relances à envoyer aujourd'hui
  sentThisMonth: number;      // Envoyées ce mois
  failedLastWeek: number;     // Échecs dernière semaine
  averageResponseTime: number; // Délai moyen de paiement après relance (en jours)
}
```

#### 1.2 Historique des envois
```typescript
interface ReminderHistory {
  id: string;
  tenant_name: string;
  sent_at: Date;
  status: 'delivered' | 'pending' | 'failed' | 'bounced';
  email: string;
  amount_due: number;
  days_overdue: number;
  opened_at?: Date;           // Si tracking email activé
  paid_after_reminder: boolean;
}
```

#### 1.3 Templates personnalisables
- **Template J+5**: Premier rappel amical
- **Template J+10**: Relance ferme
- **Template J+15**: Mise en demeure (avant procédures)

Variables disponibles:
```
{{tenant_name}}
{{amount_due}}
{{property_address}}
{{billing_day}}
{{days_overdue}}
{{owner_name}}
{{owner_phone}}
```

#### 1.4 Actions disponibles
- 🧪 **Test relance**: Envoyer à son propre email (preview)
- 📧 **Relance manuelle**: Forcer l'envoi immédiat pour un locataire
- ⚙️ **Configurer templates**: Éditeur WYSIWYG
- 📊 **Export historique**: CSV des relances envoyées

### Schéma Base de Données

```sql
-- Table pour historique des relances
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES rental_transactions(id),
  lease_id UUID REFERENCES leases(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending' | 'delivered' | 'failed' | 'bounced'
  email_to TEXT NOT NULL,
  email_cc TEXT,
  template_used TEXT, -- 'j5' | 'j10' | 'j15'
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  paid_after BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour templates personnalisés
CREATE TABLE reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  template_name TEXT NOT NULL, -- 'j5' | 'j10' | 'j15' | 'custom'
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_reminder_logs_lease ON reminder_logs(lease_id, sent_at DESC);
CREATE INDEX idx_reminder_logs_status ON reminder_logs(status, sent_at DESC);
```

### Composants à créer

```
app/compte/gestion-locative/components/
  ├── RemindersPanel.tsx          (Container principal)
  ├── ReminderStats.tsx           (Compteurs visuels)
  ├── ReminderHistory.tsx         (Table historique)
  ├── ReminderTemplateEditor.tsx  (Éditeur templates)
  └── SendReminderButton.tsx      (Action manuelle)

app/compte/gestion-locative/actions/
  └── reminders-actions.ts        (Server Actions)
```

### Intégration

**Modification**: `app/compte/gestion-locative/page.tsx`

```typescript
// Après GestionLocativeClient
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Panel Interventions (existant) */}
  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
    <MaintenanceHub requests={formattedRequests} />
  </div>

  {/* Panel Relances (nouveau) */}
  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
    <RemindersPanel ownerId={user.id} />
  </div>
</div>
```

---

## 📋 Panel 2: Gestion des Baux & Documents 📜

### Objectif
Centraliser tous les documents contractuels avec alertes automatiques d'expiration et gestion du cycle de vie des baux.

### Emplacement
**Intégré au MaintenanceHub existant** via système d'onglets.

### Architecture proposée

```typescript
// MaintenanceHub devient "PropertyHub" (Hub Propriété)
interface PropertyHubTabs {
  interventions: MaintenanceRequest[];
  leases: LeaseDocument[];
  expenses: Expense[];
}
```

### Fonctionnalités détaillées

#### 2.1 Upload et stockage des baux
```typescript
interface LeaseDocument {
  id: string;
  lease_id: string;
  document_type: 'bail_initial' | 'avenant' | 'etat_lieux' | 'assurance' | 'autre';
  file_url: string;              // Supabase Storage URL
  file_name: string;
  file_size: number;
  uploaded_at: Date;
  uploaded_by: string;
  expiry_date?: Date;            // Pour alertes
  notes?: string;
}
```

**Stockage**: `leases-documents/{owner_id}/{lease_id}/{file_name}`

#### 2.2 Alertes automatiques
```typescript
interface LeaseAlert {
  id: string;
  lease_id: string;
  alert_type: 'expiry_30d' | 'expiry_60d' | 'renewal_due' | 'missing_doc';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: Date;
  dismissed: boolean;
}
```

**Règles**:
- 🔔 60 jours avant fin: Notification "Préparer renouvellement"
- ⚠️ 30 jours avant fin: Alerte "Renouvellement urgent"
- 🚨 7 jours avant fin: Alerte critique "Bail expire bientôt"

#### 2.3 Gestion des avenants
```typescript
interface LeaseAmendment {
  id: string;
  lease_id: string;
  amendment_type: 'rent_increase' | 'term_extension' | 'clause_modification';
  old_value: string;
  new_value: string;
  effective_date: Date;
  document_url?: string;
  created_at: Date;
}
```

**Cas d'usage**:
- Augmentation de loyer annuelle (indexation)
- Prolongation de bail
- Modification des charges

#### 2.4 Renouvellement automatique
```typescript
interface LeaseRenewal {
  id: string;
  original_lease_id: string;
  new_lease_id?: string;
  status: 'proposed' | 'accepted' | 'declined' | 'expired';
  proposed_start_date: Date;
  proposed_end_date: Date;
  proposed_amount: number;
  tenant_response_at?: Date;
  created_at: Date;
}
```

**Workflow**:
1. Système détecte fin de bail à J-60
2. Propose auto-renouvellement au proprio
3. Génère nouveau bail (copie de l'ancien)
4. Envoie proposition au locataire (optionnel)

### Schéma Base de Données

```sql
-- Table pour documents de baux
CREATE TABLE lease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour avenants
CREATE TABLE lease_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  amendment_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  effective_date DATE NOT NULL,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour alertes de baux
CREATE TABLE lease_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modification table leases (ajouter colonnes)
ALTER TABLE leases
ADD COLUMN end_date DATE,
ADD COLUMN auto_renew BOOLEAN DEFAULT FALSE,
ADD COLUMN renewal_notice_days INTEGER DEFAULT 60;

-- Index
CREATE INDEX idx_lease_documents_lease ON lease_documents(lease_id, uploaded_at DESC);
CREATE INDEX idx_lease_alerts_active ON lease_alerts(lease_id, dismissed) WHERE dismissed = FALSE;
CREATE INDEX idx_leases_expiry ON leases(end_date) WHERE status = 'active';
```

### Composants à créer

```
app/compte/gestion-locative/components/
  ├── PropertyHub.tsx              (Remplace MaintenanceHub)
  │   ├── InterventionsTab.tsx     (Ancien MaintenanceHub)
  │   ├── LeasesTab.tsx            (Nouveau - Gestion baux)
  │   └── ExpensesTab.tsx          (Nouveau - Dépenses)
  │
  ├── LeaseDocumentUpload.tsx      (Upload de fichiers)
  ├── LeaseAlertsBanner.tsx        (Bandeau alertes)
  ├── LeaseAmendmentForm.tsx       (Formulaire avenant)
  └── LeaseRenewalProposal.tsx     (Proposition renouvellement)

app/compte/gestion-locative/actions/
  └── lease-documents-actions.ts   (Server Actions)
```

### UI Proposée (Onglets)

```typescript
<Tabs defaultValue="interventions">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="interventions">
      Interventions
      {maintenanceCount > 0 && (
        <Badge variant="destructive" className="ml-2">{maintenanceCount}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="leases">
      Baux
      {leaseAlertsCount > 0 && (
        <Badge variant="warning" className="ml-2">{leaseAlertsCount}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="expenses">
      Dépenses
    </TabsTrigger>
  </TabsList>

  <TabsContent value="interventions">
    <MaintenanceHub requests={requests} />
  </TabsContent>

  <TabsContent value="leases">
    <LeasesTab leaseId={currentLeaseId} />
  </TabsContent>

  <TabsContent value="expenses">
    <ExpensesTab leaseId={currentLeaseId} />
  </TabsContent>
</Tabs>
```

---

## 📋 Panel 3: Dépenses & Charges 💸

### Objectif
Enregistrer toutes les dépenses liées aux propriétés et calculer automatiquement le ROI réel (Revenus - Dépenses).

### Emplacement
**Intégré au PropertyHub** (onglet "Dépenses")

### Fonctionnalités détaillées

#### 3.1 Catégories de dépenses
```typescript
interface ExpenseCategory {
  maintenance: {
    name: 'Maintenance',
    subcategories: ['Réparations', 'Peinture', 'Plomberie', 'Électricité', 'Autre']
  },
  taxes: {
    name: 'Fiscalité',
    subcategories: ['Taxe foncière', 'Taxe d\'habitation', 'TOM', 'Autre']
  },
  charges: {
    name: 'Charges communes',
    subcategories: ['Eau', 'Électricité', 'Gardiennage', 'Assainissement', 'Autre']
  },
  insurance: {
    name: 'Assurances',
    subcategories: ['PNO', 'Responsabilité civile', 'Loyers impayés', 'Autre']
  },
  legal: {
    name: 'Juridique',
    subcategories: ['Notaire', 'Avocat', 'Huissier', 'Autre']
  },
  management: {
    name: 'Gestion',
    subcategories: ['Honoraires agence', 'Comptabilité', 'Autre']
  }
}
```

#### 3.2 Enregistrement des dépenses
```typescript
interface Expense {
  id: string;
  lease_id?: string;              // Optionnel (peut être général)
  property_id?: string;           // Pour futur multi-propriétés
  category: keyof ExpenseCategory;
  subcategory: string;
  amount: number;                 // En FCFA
  expense_date: Date;
  description: string;
  receipt_url?: string;           // Scan de facture
  vendor_name?: string;           // Fournisseur
  is_recurring: boolean;
  recurrence_rule?: string;       // "monthly" | "yearly" | "quarterly"
  created_at: Date;
}
```

#### 3.3 Calcul automatique du ROI
```typescript
interface PropertyROI {
  property_address: string;
  period: { start: Date; end: Date };

  // Revenus
  total_rent_expected: number;
  total_rent_collected: number;

  // Dépenses
  total_expenses: number;
  expenses_by_category: {
    [key in keyof ExpenseCategory]: number;
  };

  // Calculs
  net_income: number;             // Revenus - Dépenses
  roi_percentage: number;         // (Net Income / Total Collected) * 100
  break_even_point?: Date;        // Si investissement initial renseigné
}
```

#### 3.4 Export comptable
Format CSV pour expert-comptable:

```csv
Date,Catégorie,Sous-catégorie,Description,Montant,Fournisseur,N° Facture,Propriété
2025-12-15,Maintenance,Plomberie,Réparation fuite,45000,Plombier Dakar,FACT-2025-001,Appartement Almadies
2025-12-20,Fiscalité,Taxe foncière,TF 2025,120000,Trésor Public,TF-2025-XXX,Appartement Almadies
```

#### 3.5 Alertes de dépassement
```typescript
interface ExpenseBudget {
  category: keyof ExpenseCategory;
  monthly_limit: number;
  current_month_spent: number;
  alert_threshold: number;        // En % (ex: 80%)
}

// Notification si dépassement
if (current_month_spent >= monthly_limit * alert_threshold / 100) {
  sendAlert({
    type: 'budget_alert',
    message: `⚠️ Budget Maintenance dépassé à 85% (${current_month_spent} / ${monthly_limit} FCFA)`
  });
}
```

### Schéma Base de Données

```sql
-- Table pour dépenses
CREATE TABLE property_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  lease_id UUID REFERENCES leases(id),
  property_id UUID, -- Pour futur
  category TEXT NOT NULL,
  subcategory TEXT,
  amount INTEGER NOT NULL, -- En FCFA (centimes)
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  vendor_name TEXT,
  vendor_siret TEXT,
  invoice_number TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour budgets (optionnel)
CREATE TABLE expense_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL,
  alert_threshold INTEGER DEFAULT 80, -- En %
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_expenses_owner_date ON property_expenses(owner_id, expense_date DESC);
CREATE INDEX idx_expenses_lease ON property_expenses(lease_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON property_expenses(category, expense_date DESC);
```

### Composants à créer

```
app/compte/gestion-locative/components/
  ├── ExpensesTab.tsx              (Container principal)
  ├── AddExpenseForm.tsx           (Formulaire ajout)
  ├── ExpensesList.tsx             (Liste dépenses)
  ├── ExpenseCategories.tsx        (Filtres par catégorie)
  ├── ROICalculator.tsx            (Calcul ROI visuel)
  ├── ExpenseChart.tsx             (Graphique dépenses)
  └── ExportExpensesButton.tsx     (Export CSV)

app/compte/gestion-locative/actions/
  └── expenses-actions.ts          (Server Actions)
```

### UI Proposée

```typescript
// Onglet Dépenses
<div className="space-y-4">
  {/* Stats rapides */}
  <div className="grid grid-cols-3 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-slate-400">Dépenses ce mois</div>
        <div className="text-2xl font-bold text-white">245 000 FCFA</div>
        <div className="text-xs text-red-400">+12% vs mois dernier</div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-slate-400">ROI Net</div>
        <div className="text-2xl font-bold text-green-400">+523 000 FCFA</div>
        <div className="text-xs text-slate-400">68% de marge</div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-slate-400">Catégorie principale</div>
        <div className="text-2xl font-bold text-white">Maintenance</div>
        <div className="text-xs text-orange-400">152 000 FCFA (62%)</div>
      </CardContent>
    </Card>
  </div>

  {/* Actions */}
  <div className="flex gap-2">
    <AddExpenseButton />
    <ExportExpensesButton />
  </div>

  {/* Liste des dépenses */}
  <ExpensesList expenses={expenses} />
</div>
```

---

## 🎯 Plan d'Implémentation

### Phase 1 - Semaine 1 (Priorité HAUTE)
**Objectif**: Rendre visible le système de relances

- [ ] **Jour 1-2**: Panel Relances Intelligentes
  - [ ] Créer `reminder_logs` et `reminder_templates` tables
  - [ ] Composant `RemindersPanel.tsx`
  - [ ] Afficher historique des envois
  - [ ] Bouton "Test relance"

- [ ] **Jour 3-4**: Intégration complète
  - [ ] Modifier `/api/cron/route.ts` pour logger dans `reminder_logs`
  - [ ] Ajouter tracking des emails ouverts (webhooks Gmail)
  - [ ] Dashboard stats temps réel

- [ ] **Jour 5**: Tests & Documentation
  - [ ] Tester envoi manuel + automatique
  - [ ] Vérifier logs en base
  - [ ] Documenter dans `docs/REMINDERS_PANEL.md`

### Phase 2 - Semaine 2
**Objectif**: Centraliser documents et alertes

- [ ] **Jour 1-2**: Migration MaintenanceHub → PropertyHub
  - [ ] Créer système d'onglets (Interventions / Baux / Dépenses)
  - [ ] Migrer MaintenanceHub vers `InterventionsTab.tsx`
  - [ ] Tester régression

- [ ] **Jour 3-5**: Onglet "Baux"
  - [ ] Créer tables `lease_documents`, `lease_amendments`, `lease_alerts`
  - [ ] Upload de fichiers (Supabase Storage)
  - [ ] Système d'alertes (Cron job quotidien)
  - [ ] Ajouter `end_date` à table `leases`

### Phase 3 - Semaine 3
**Objectif**: Suivi financier complet (ROI)

- [ ] **Jour 1-3**: Onglet "Dépenses"
  - [ ] Créer table `property_expenses`
  - [ ] Formulaire ajout de dépense
  - [ ] Liste filtrable par catégorie

- [ ] **Jour 4-5**: Calcul ROI automatique
  - [ ] Fonction `calculateROI()` dans `lib/finance.ts`
  - [ ] Composant `ROICalculator.tsx`
  - [ ] Export CSV pour comptable

### Phase 4 - Semaine 4 (Polissage)
**Objectif**: UX et optimisations

- [ ] Ajouter graphiques (Chart.js ou Recharts)
- [ ] Notifications push (Service Workers)
- [ ] Mobile responsive (tests tablette)
- [ ] Documentation finale

---

## 📊 Métriques de Succès

### KPIs à suivre
- **Taux de recouvrement** après implémentation relances: **> 85%**
- **Temps gagné** sur gestion admin: **~10h/semaine**
- **Aucun bail expiré** sans alerte: **100%**
- **ROI calculé automatiquement**: **Mensuel**

### Feedback utilisateur
- Satisfaction propriétaires: **> 4.5/5**
- Réduction erreurs manuelles: **> 90%**
- Adoption fonctionnalités: **> 70%**

---

## 🔧 Stack Technique

### Frontend
- **Next.js 15+** (App Router)
- **React Server Components**
- **Shadcn/UI** (composants)
- **Tailwind CSS**
- **date-fns** (dates)
- **Chart.js** ou **Recharts** (graphiques)

### Backend
- **Supabase** (Auth, DB, Storage, Realtime)
- **PostgreSQL** (base de données)
- **Server Actions** (mutations)
- **Edge Functions** (webhooks)

### Email & Notifications
- **Gmail SMTP** (quittances + relances)
- **Supabase Auth** (notifications in-app)
- **Service Workers** (push notifications)

### Stockage Fichiers
- **Supabase Storage**
  - Bucket: `lease-documents` (privé)
  - Bucket: `expense-receipts` (privé)
  - Politique RLS stricte (owner_id)

---

## 📚 Ressources & Références

### Documentation interne
- `docs/FINANCE_SYSTEM.md` - Système financier
- `docs/REMINDERS_PANEL.md` - Panel relances (à créer)
- `docs/LEASE_MANAGEMENT.md` - Gestion baux (à créer)

### Librairies externes
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [React Email](https://react.email/) - Templates emails
- [Chart.js](https://www.chartjs.org/) - Graphiques
- [date-fns](https://date-fns.org/) - Manipulation dates

---

## ✅ Checklist Pré-Production

Avant mise en production, vérifier:

- [ ] Tous les tests passent (`npm run quality`)
- [ ] Migrations DB appliquées (Supabase)
- [ ] Variables d'env configurées (`.env.production`)
- [ ] Politiques RLS testées (sécurité)
- [ ] Backup base de données effectué
- [ ] Documentation à jour
- [ ] Guide utilisateur créé (screenshots)
- [ ] Tests sur mobile (responsive)
- [ ] Performance optimisée (Lighthouse > 90)
- [ ] Logs d'erreurs configurés (Sentry optionnel)

---

**Dernière mise à jour**: 2025-12-28
**Version**: 1.0
**Auteur**: Claude Code (Dousell Immo Team)
