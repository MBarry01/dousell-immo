# ✅ Assistant Juridique - UX "Radar de Conformité"

## 🎯 Philosophie UX

**"Le Radar de Conformité"** - L'utilisateur vient vérifier qu'il ne risque rien, pas pour "travailler".

### Structure de l'information
1. **Haut** : État de santé immédiat (KPIs)
2. **Milieu** : Les urgences chronologiques (Timeline)
3. **Bas** : Les outils de génération (Actions)

## 🎨 Design System Appliqué

### Couleurs Sémantiques (Dark Mode)

| Couleur | Usage | Code | Signification |
|---------|-------|------|---------------|
| 🟠 Orange | J-180 (6 mois) | `orange-500` | Important, pas urgent |
| 🔵 Bleu | J-90 (3 mois) | `blue-500` | Informatif (reconduction) |
| 🔴 Rouge | Dépassé | `red-500` | Urgent, non conforme |
| 🟢 Vert | OK | `green-500` | Sécurisé, conforme |
| 🟡 Jaune | Attention | `yellow-500` | À surveiller |

### Palette Slate (Base)
- **Background** : `slate-950` (#020617)
- **Cards** : `slate-900` (#0f172a)
- **Borders** : `slate-800` (#1e293b)
- **Text** : `slate-300/400` (gris clair)

## 📊 Sections de la Page

### 1. En-Tête & Score de Santé

```tsx
<h1>⚖️ Assistant Juridique</h1>
<badge>✅ Conformité : 100%</badge>
```

**UX** : Rassurer immédiatement l'utilisateur

### 2. KPIs (3 Cartes)

| KPI | Icône | Couleur | Signification |
|-----|-------|---------|---------------|
| **Baux Actifs** | 📄 | Bleu | Nombre total de contrats |
| **Renouvellements (3 mois)** | ⏰ | Orange | Échéances proches (barre orange sur la droite si > 0) |
| **Risque Juridique** | ⚠️ | Rouge | Contentieux en cours |

**UX** : La carte "Renouvellements" a une **barre orange** à droite si > 0 pour attirer l'œil.

### 3. Radar des Échéances (Timeline)

**Table avec 5 colonnes :**
1. Locataire & Bien
2. Échéance (date formatée en français)
3. Type d'alerte (Badge coloré)
4. Statut (En attente / Mail envoyé ✅)
5. Action (Bouton CTA)

#### Badges d'Alerte

| Type | Badge | Couleur | Texte |
|------|-------|---------|-------|
| J-180 | 🟠 | Orange | "J-180 (Congé Reprise)" |
| J-90 | 🔵 | Bleu | "J-90 (Reconduction)" |

#### Empty State
```
✅ Aucune échéance dans les 6 prochains mois
Tous vos baux sont à jour
```

**UX** : Message positif avec icône verte (CheckCircle)

### 4. Générateur Rapide (2 Cartes)

- **Générer une Quittance** 📄
  - Hover : Bordure slate-700
  - Gradient : `from-slate-900 to-black`

- **Nouveau Contrat de Bail** 🛡️
  - Modèle conforme OHADA/Sénégal

### 5. Cadre Juridique de Référence

**2 colonnes :**
- **Textes applicables** : COCC, Décret 2014, Loi 2024, OHADA
- **Délais clés** :
  - 🔴 **6 mois** (Préavis propriétaire)
  - 🟡 **3 mois** (Négociation)
  - 🔵 **2 mois** (Locataire résidentiel)
  - 🟣 **1 mois** (Locataire meublé)

## 💡 Détails UX Implémentés

### 1. Code Couleur "Alerte"
- **Orange** (J-180) : Important, mais pas catastrophique
- **Bleu** (J-90) : Informatif, reconduction
- **Rouge** (dépassé) : Non conforme (future feature)

### 2. Appel à l'Action (CTA)
```tsx
{alert.status === 'pending' ? (
    <Button>Générer Préavis</Button>
) : (
    <Button variant="ghost">Voir détails</Button>
)}
```

**UX** : Bouton visible et actionnable immédiatement

### 3. Vocabulaire Local (Sénégal)
- "Préavis" au lieu de "notice"
- "Congé pour Reprise" (terme juridique sénégalais)
- "Tacite Reconduction" (concept du COCC)
- Dates en français (via `date-fns` locale `fr`)

### 4. Micro-interactions
- **Hover** : Cards + Rows → `bg-slate-900/50`
- **Transition** : `transition-colors`
- **Animation entrée** : `animate-in fade-in duration-500`
- **Barre orange** : Indicateur visuel sur KPI si alertes > 0

## 📈 Logique Métier (Implémentée)

### Calcul des Alertes

```typescript
const today = new Date();
const threeMonths = addMonths(today, 3);
const sixMonths = addMonths(today, 6);

// J-180 : entre 3 et 6 mois
if (endDate <= sixMonths && endDate > threeMonths) {
    alert_type = 'J-180';
}

// J-90 : dans les 3 prochains mois
if (endDate <= threeMonths && endDate > today) {
    alert_type = 'J-90';
}
```

### Récupération Données Réelles

```typescript
// Fetch depuis Supabase
const { data: leases } = await supabase
    .from('leases')
    .select('id, tenant_name, property_address, end_date')
    .eq('owner_id', user.id)
    .eq('status', 'active');
```

**Note** : Nécessite que `end_date` soit renseigné dans les baux (voir migration `20251228140000_add_end_date_to_leases.sql`)

## 🚀 Fonctionnalités Futures

### Court Terme
1. **Action "Générer Préavis"** : Créer PDF de lettre de congé
2. **Modal détails** : Voir historique des échanges
3. **Marquer comme traité** : Changer statut de 'pending' à 'sent'

### Moyen Terme
1. **Intégration Cron** : Synchroniser avec `lease-expiration-service.ts`
2. **Notifications** : Toast quand nouvelle alerte
3. **Historique** : Archive des préavis envoyés

### Long Terme
1. **Modèles de contrats** : Générateur avec variables dynamiques
2. **Chatbot juridique** : API Claude pour conseils
3. **Base jurisprudence** : Recherche de décisions de justice

## ✅ Checklist UX Validée

- [x] **Sérénité** : Badge vert "Conformité 100%" en haut
- [x] **Clarté** : Tableau lisible avec badges colorés
- [x] **Action** : CTA "Générer Préavis" visible
- [x] **Vocabulaire** : Termes juridiques sénégalais
- [x] **Feedback visuel** : Barre orange si alertes > 0
- [x] **Empty state** : Message positif si aucune alerte
- [x] **Micro-animations** : Hover, transitions
- [x] **Responsive** : Grid adaptable mobile

## 📸 Aperçu Visuel

```
╔════════════════════════════════════════════════╗
║ ⚖️ Assistant Juridique     [✅ Conformité:100%]║
╚════════════════════════════════════════════════╝

┌────────────┬──────────────┬──────────────┐
│ 📄 Baux:12 │ ⏰ Renouv:2 🟠│ ⚠️ Risque:0 │
└────────────┴──────────────┴──────────────┘

╔════════════════════════════════════════════════╗
║         RADAR DES ÉCHÉANCES                    ║
╠════════════════════════════════════════════════╣
║ Mamour Sidibé    │ 30 juin 2026  │ 🟠 J-180   ║
║ 58 Rue Mouzaïa   │               │ [Générer]  ║
╟────────────────────────────────────────────────╢
║ Khardiatou Sy    │ 15 mars 2026  │ 🔵 J-90    ║
║ 15 allée Senghor │               │ Mail ✅    ║
╚════════════════════════════════════════════════╝

[📄 Générer Quittance]  [🛡️ Nouveau Contrat]

📚 Cadre Juridique de Référence
🔴 6 mois | 🟡 3 mois | 🔵 2 mois | 🟣 1 mois
```

---

**Statut** : ✅ UX Professionnelle Implémentée - Prête pour Production
**Design** : Conforme au "Luxe & Teranga" Dark Mode
**Vocabulaire** : 100% Sénégal (COCC, OHADA, Préavis, Tacite Reconduction)
