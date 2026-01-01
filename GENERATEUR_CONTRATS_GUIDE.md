# Guide d'Utilisation : Générateur de Contrats de Bail

## 📋 Vue d'ensemble

Le système de génération de contrats de bail automatise la création de contrats PDF professionnels conformes au droit sénégalais (COCC, décret 2023, loi 2024) et OHADA.

## 🎯 Fonctionnalités

✅ Génération automatique de PDF depuis les données de bail
✅ Conformité juridique Sénégal/OHADA garantie
✅ Support des signatures numériques
✅ Support des logos d'entreprise
✅ Stockage sécurisé dans Supabase Storage
✅ Téléchargement direct du PDF
✅ Aperçu avant génération

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   UI Layer   │─────▶│ Server       │                   │
│  │              │      │ Actions      │                   │
│  │ - Button     │      │              │                   │
│  │ - Preview    │      │ contract-    │                   │
│  └──────────────┘      │ actions.ts   │                   │
│                        └──────┬───────┘                   │
│                               │                            │
│                        ┌──────▼───────┐                   │
│                        │   PDF Gen    │                   │
│                        │              │                   │
│                        │ pdf-         │                   │
│                        │ generator.ts │                   │
│                        └──────┬───────┘                   │
│                               │                            │
│                        ┌──────▼───────┐                   │
│                        │   Template   │                   │
│                        │              │                   │
│                        │ contract-    │                   │
│                        │ template.ts  │                   │
│                        └──────────────┘                   │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Supabase   │      │   Storage    │                   │
│  │   Database   │      │              │                   │
│  │              │      │ lease-       │                   │
│  │ - leases     │      │ contracts/   │                   │
│  │ - profiles   │      │              │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Structure des Fichiers

```
Doussel_immo/
├── lib/
│   ├── contract-template.ts        # Modèle de contrat + validation
│   ├── pdf-generator.ts            # Génération PDF avec pdf-lib
│   └── actions/
│       └── contract-actions.ts     # Server Actions (API)
├── components/
│   └── contracts/
│       ├── GenerateContractButton.tsx  # Bouton de génération
│       └── ContractPreview.tsx         # Aperçu des données
└── supabase/
    └── migrations/
        └── 20251230000000_create_lease_contracts_bucket.sql
```

## 🚀 Installation et Configuration

### 1. Migration Supabase (Bucket Storage)

Exécutez la migration pour créer le bucket Storage :

```bash
# Méthode 1 : Via Supabase CLI (local)
npx supabase db push

# Méthode 2 : Via Dashboard Supabase
# - Allez dans SQL Editor
# - Copiez le contenu de 20251230000000_create_lease_contracts_bucket.sql
# - Exécutez
```

### 2. Vérification des Dépendances

La dépendance `pdf-lib` est déjà installée. Si besoin :

```bash
npm install pdf-lib
```

### 3. Configuration des Données Propriétaire

Assurez-vous que votre table `profiles` contient les colonnes suivantes :

```sql
-- Colonnes pour le branding propriétaire (déjà créées)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_ninea TEXT;
```

## 💻 Utilisation du Code

### Intégration dans la Liste des Locataires (TenantTable)

Le bouton est intégré directement dans le menu d'actions de chaque locataire dans `TenantTable.tsx`.

Pour l'ajouter manuellement :

```tsx
import { GenerateContractButton } from '@/components/contracts/GenerateContractButton';

// Dans le menu dropdown (DropdownMenuContent)
<DropdownMenuItem asChild>
  <div className="w-full cursor-pointer text-slate-300 hover:bg-slate-800 focus:bg-slate-800">
    <GenerateContractButton
      leaseId={tenant.id}
      tenantName={tenant.name || tenant.tenant_name || "Locataire"}
      existingContractUrl={tenant.lease_pdf_url || undefined}
      variant="ghost"
      className="w-full justify-start px-2 py-1.5 h-auto font-normal"
    />
  </div>
</DropdownMenuItem>
```

### Option 3 : Utilisation Programmatique (Server Action)

Pour générer un contrat depuis votre code serveur :

```typescript
import { generateLeaseContract } from '@/lib/actions/contract-actions';

// Dans une Server Action ou Route Handler
async function handleContractGeneration(leaseId: string) {
  const result = await generateLeaseContract({
    leaseId,
    includeWatermark: false,
  });

  if (result.success) {
    console.log('Contrat généré:', result.contractUrl);
    // Le PDF est automatiquement uploadé dans Supabase Storage
    // L'URL est mise à jour dans leases.lease_pdf_url
  } else {
    console.error('Erreur:', result.error);
  }
}
```

## 📝 Mapping des Données

### Table `leases`

Le système récupère automatiquement depuis la table `leases` :

```typescript
{
  tenant_name: "Jean Dupont",           // → Nom du locataire
  tenant_email: "jean@example.com",     // → Email locataire
  tenant_phone: "+221 77 123 45 67",    // → Téléphone locataire
  monthly_amount: 250000,                // → Loyer mensuel (FCFA)
  start_date: "2025-01-01",             // → Date début bail
  end_date: "2026-01-01",               // → Date fin bail (optionnel)
  billing_day: 5,                        // → Jour de paiement
  property_address: "Dakar, Plateau",   // → Adresse du bien
}
```

### Table `profiles` (Propriétaire)

```typescript
{
  first_name: "Amadou",
  last_name: "Diallo",
  phone: "+221 77 999 88 77",
  address: "Dakar, Almadies",

  // Optionnel : Si société
  company_name: "Diallo Immobilier SARL",
  company_ninea: "123456789",
  company_address: "Dakar, Point E",
  company_phone: "+221 33 123 45 67",
  company_email: "contact@diallo-immo.sn",

  // Optionnel : Branding
  logo_url: "https://...",              // Logo sur le PDF
  signature_url: "https://...",         // Signature numérique
}
```

### Table `properties` (Bien loué)

```typescript
{
  name: "Villa Almadies",
  address: "Almadies, Dakar",
  description: "3 chambres, 2 salons, cuisine équipée, garage",
  property_type: "villa",
}
```

## 🎨 Personnalisation

### Ajouter des Clauses Personnalisées

Modifiez [contract-template.ts:404](contract-template.ts:404) pour ajouter des clauses par défaut :

```typescript
const contractData: ContractData = {
  // ... autres données
  additionalClauses: [
    "Le locataire s'engage à ne pas sous-louer sans autorisation écrite",
    "Les animaux domestiques sont interdits sauf accord préalable",
    "Le bien est loué meublé avec inventaire annexé"
  ]
};
```

### Personnaliser la Mise en Page PDF

Modifiez [pdf-generator.ts](pdf-generator.ts) pour ajuster :

- Marges : `const margin = 50;` (ligne 77)
- Taille de police : `const fontSize = ...` (ligne 113)
- Couleurs : `rgb(0, 0, 0)` (ligne 120)

### Modifier le Texte du Contrat

Le template complet est dans [contract-template.ts:50-300](contract-template.ts:50-300). Vous pouvez :

- Changer les articles
- Ajouter/supprimer des sections
- Modifier les mentions légales

## 🔒 Sécurité

### Permissions RLS

Les policies Supabase garantissent que :

- ✅ Seul le propriétaire peut générer/télécharger son contrat
- ✅ Les fichiers sont stockés dans `contracts/{user_id}/`
- ✅ Accès impossible aux contrats d'autres utilisateurs

### Validation des Données

Toutes les Server Actions utilisent Zod pour valider :

```typescript
const GenerateContractSchema = z.object({
  leaseId: z.string().uuid('ID de bail invalide'),
  includeWatermark: z.boolean().optional(),
});
```

### Conformité Légale

Le générateur vérifie automatiquement :

- ✅ Caution max 2 mois (loi sénégalaise 2023)
- ✅ Champs obligatoires remplis
- ✅ Durée du bail cohérente

## 🛠️ Dépannage

### Erreur "Bucket not found"

```bash
# Re-exécutez la migration du bucket
npx supabase db push
```

### Signatures ne s'affichent pas

Vérifiez que :
1. `signature_url` est une URL publique valide
2. Le format est PNG ou JPG
3. L'image est accessible (pas de CORS)

### PDF vide ou cassé

Vérifiez les logs serveur :

```typescript
// Dans contract-actions.ts
console.log('Contract data:', contractData);
```

### Performance lente

Pour de gros volumes :

```typescript
// Activer le watermark pour tests rapides
await generateLeaseContract({
  leaseId,
  includeWatermark: true,
  watermarkText: 'BROUILLON'
});
```

## 📊 Exemple Complet

Voici un workflow complet d'intégration :

```tsx
// app/compte/(gestion)/locataires/[id]/page.tsx
import { createServerClient } from '@/lib/supabase-server';
import { GenerateContractButton } from '@/components/contracts/GenerateContractButton';
import { ContractPreview } from '@/components/contracts/ContractPreview';

export default async function LeaseDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createServerClient();

  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('id', params.id)
    .single();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold text-[#F4C430]">
        Contrat de Bail - {lease.tenant_name}
      </h1>

      {/* Aperçu avant génération */}
      <ContractPreview leaseId={params.id} />

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">
          {lease.lease_pdf_url
            ? 'Contrat déjà généré. Vous pouvez le regénérer si nécessaire.'
            : 'Aucun contrat généré pour ce bail.'}
        </p>

        <GenerateContractButton
          leaseId={params.id}
          tenantName={lease.tenant_name}
          existingContractUrl={lease.lease_pdf_url}
          variant="default"
          size="default"
        />
      </div>
    </div>
  );
}
```

## 🔄 Améliorations Futures

### Phase 2 (Optionnel)

- [ ] Signature électronique dans le PDF (via Canvas API)
- [ ] Support multi-langues (Français/Wolof/Anglais)
- [ ] Templates personnalisables par propriétaire
- [ ] Envoi automatique par email au locataire
- [ ] Génération de quittances mensuelles
- [ ] Export Word (.docx) en plus du PDF

### Phase 3 (Avancé)

- [ ] Intégration signature électronique légale (DocuSign, etc.)
- [ ] Archivage automatique des versions
- [ ] Notification automatique avant échéance
- [ ] Génération d'avenants (augmentation loyer, etc.)

## 📞 Support

En cas de problème :

1. Vérifiez les migrations Supabase sont appliquées
2. Consultez les logs dans la console
3. Vérifiez les données du bail dans la DB
4. Testez d'abord avec `includeWatermark: true`

## ✅ Checklist de Mise en Production

- [ ] Migration Supabase exécutée (bucket créé)
- [ ] Données propriétaire complètes (nom, adresse, téléphone)
- [ ] Logo uploadé (optionnel mais recommandé)
- [ ] Signature numérique configurée (optionnel)
- [ ] Test de génération sur bail réel
- [ ] Vérification conformité juridique du contenu
- [ ] Test de téléchargement PDF
- [ ] Vérification RLS (sécurité)

---

**Généré par Doussel Immo - Plateforme de Gestion Locative Premium 🇸🇳**
