# ✅ Test du Système de Décision des Baux

**Date:** 2025-12-28
**Status:** Prêt pour test

---

## 📋 Checklist de Validation

### 1. Base de Données ✅

**Table `lease_decisions` créée** ✅
```
Error: relation "lease_decisions" already exists
→ La table existe déjà dans Supabase
```

**Vérifications à faire dans Supabase SQL Editor:**

```sql
-- 1. Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lease_decisions'
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'lease_decisions';

-- 3. Tester une insertion (devrait échouer si non authentifié)
INSERT INTO lease_decisions (
    lease_id,
    decision_type,
    decided_by
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'renew',
    auth.uid()
);
```

---

### 2. Build Application ✅

```bash
npm run build
```

**Résultat:**
```
✓ Compiled successfully in 26.4s
✓ Generating static pages using 11 workers (59/59)
```

**Status:** ✅ Build réussi

---

### 3. Interface Utilisateur

#### Test 1: Affichage de la Page Legal

**URL:** `http://localhost:3000/compte/legal`

**Vérifications:**
- [ ] Page se charge sans erreur
- [ ] Statistiques s'affichent (Baux Actifs, Renouvellements, Risques)
- [ ] Tableau "Radar des Échéances" visible
- [ ] Bouton "⚠️ Action Requise" visible sur chaque alerte

#### Test 2: Modal de Décision - Renouvellement

**Actions:**
1. Cliquer sur "⚠️ Action Requise" sur une alerte
2. Modal s'ouvre
3. Vérifier l'onglet "✅ Renouveler" (actif par défaut)
4. Remplir le formulaire:
   - Nouvelle date de fin: `2027-06-01`
   - Nouveau loyer: `175000`
   - Notes: `Test renouvellement +5%`
5. Cliquer "Valider le renouvellement"

**Résultat attendu:**
- [ ] Toast de succès: "Bail renouvelé jusqu'au 01/06/2027"
- [ ] Modal se ferme
- [ ] Alerte disparaît du tableau (ou status change)
- [ ] Page se recharge avec nouvelles données

**Vérification en base:**
```sql
SELECT * FROM lease_decisions
ORDER BY created_at DESC
LIMIT 1;

-- Devrait montrer:
-- decision_type = 'renew'
-- new_end_date = '2027-06-01'
-- new_rent_amount = 175000
-- notes = 'Test renouvellement +5%'
```

#### Test 3: Modal de Décision - Résiliation

**Actions:**
1. Cliquer sur "⚠️ Action Requise" sur une alerte
2. Modal s'ouvre
3. Cliquer sur l'onglet "❌ Donner Congé"
4. Remplir le formulaire:
   - Motif: `Reprise pour habiter (Moi ou famille proche)`
   - Détails: `Test résiliation - Logement pour mon fils`
5. Cliquer "Générer et Envoyer le Préavis"

**Résultat attendu:**
- [ ] Toast de succès: "Préavis J-180 envoyé avec succès à [Locataire]"
- [ ] Modal se ferme
- [ ] Email reçu par le locataire (vérifier boîte mail)
- [ ] Email CC reçu par le propriétaire
- [ ] PDF joint nommé `Preavis_J-180_PREV-2025-XXXX.pdf`

**Vérification en base:**
```sql
SELECT * FROM lease_decisions
ORDER BY created_at DESC
LIMIT 1;

-- Devrait montrer:
-- decision_type = 'terminate'
-- termination_reason = 'reprise'
-- notice_type = 'J-180'
-- notice_sent_at = [timestamp actuel]
-- notice_number = 'PREV-2025-XXXX'
```

**Vérification bail:**
```sql
SELECT id, tenant_name, status, end_date
FROM leases
WHERE id = '[lease_id_testé]';

-- Status devrait être: 'pending_termination'
```

---

### 4. Logs de Débogage

**Dans la console du serveur (terminal `npm run dev`):**

```
📋 Données préavis: {
  locataire: 'Samba Barry',
  emailLocataire: 'samba@example.com',
  proprietaire: 'Baraka Immo',
  emailProprietaire: 'owner@example.com'
}

📧 Destinataires email:
   → TO (Locataire): samba@example.com
   → CC (Propriétaire): owner@example.com

📤 Envoi de l'email...
✅ Email envoyé avec succès à: samba@example.com
```

**Vérifier que:**
- [ ] `emailLocataire` contient l'email du locataire (PAS du propriétaire)
- [ ] `TO (Locataire)` est différent de `CC (Propriétaire)`

---

### 5. Email Reçu

**Vérifier le contenu de l'email:**

```
From: Baraka Immo <votre.email@gmail.com>
To: samba@example.com
CC: owner@example.com
Subject: ⚠️ Préavis de Congé - Échéance 01/06/2026
Attachments: Preavis_J-180_PREV-2025-XXXX.pdf

───────────────────────────────────────

Bonjour Samba Barry,

Veuillez trouver ci-joint un préavis juridique J-180
concernant votre bail de location.

INFORMATION IMPORTANTE
Il vous reste environ 6 mois avant l'échéance du bail.

Détails du préavis :
- N° Préavis : PREV-2025-XXXX
- Type : Congé pour reprise (6 mois)
- Bien concerné : 15 allé marc
- Date d'échéance : 01/06/2026

Action requise :
Vous devrez libérer les lieux à la date d'échéance
mentionnée dans le document ci-joint.

Cordialement,
Baraka Immo
58 Rue de Mouzaïa

---
Cadre Juridique Sénégalais
Loi n° 2014-22 & COCC

Email généré automatiquement par Dousell Immo
```

**Vérifier:**
- [ ] Email reçu sur la bonne adresse (locataire)
- [ ] CC reçu (propriétaire)
- [ ] PDF joint et téléchargeable
- [ ] Format texte simple (pas de HTML)

---

### 6. PDF Généré

**Ouvrir le PDF joint:**

**Page 1 (doit tenir sur 1 page A4):**
```
┌─────────────────────────────────────┐
│ [Logo 60x40]      [Nom Propriétaire]│
│                   [Adresse]         │
│─────────────────────────────────────│
│                                     │
│   PRÉAVIS DE CONGÉ POUR REPRISE    │
│   Notification - 6 mois             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Bien: 15 allé marc              │ │
│ │ Loyer: 150,000 FCFA             │ │
│ │ Échéance: 01/06/2026            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Contenu juridique]                 │
│                                     │
│ ⚠️ ACTION REQUISE                   │
│ Vous devrez libérer les lieux...   │
│                                     │
│ Le Propriétaire    Le Locataire    │
│ [Signature]        [__________]    │
│                                     │
│─────────────────────────────────────│
│ Document généré - Loi 2014 & COCC  │
└─────────────────────────────────────┘
```

**Vérifier:**
- [ ] Tient sur 1 page A4 (pas 2 pages)
- [ ] Logo affiché (si disponible)
- [ ] Toutes les informations présentes
- [ ] Numéro unique du préavis
- [ ] Signature propriétaire (si disponible)
- [ ] Zone signature locataire
- [ ] Mentions légales en pied de page

---

### 7. Gestion des Erreurs

#### Test 7.1: Email Locataire Manquant

**Scénario:**
- Créer un bail SANS email locataire
- Essayer de générer un préavis

**Résultat attendu:**
- [ ] Toast d'erreur: "Email du locataire manquant. Veuillez renseigner l'email..."
- [ ] Modal reste ouvert
- [ ] Pas d'email envoyé
- [ ] Pas de décision enregistrée

#### Test 7.2: Bail Appartenant à un Autre Propriétaire

**Scénario:**
- Se connecter avec Propriétaire A
- Essayer d'accéder au bail du Propriétaire B

**Résultat attendu:**
- [ ] Erreur: "Bail non trouvé"
- [ ] Pas d'action possible (sécurité RLS)

---

## 🎯 Résultat Final Attendu

### Workflow Complet - Renouvellement

```
1. Propriétaire voit alerte J-180 ✅
2. Clique "⚠️ Action Requise" ✅
3. Modal s'ouvre avec onglet "Renouveler" ✅
4. Modifie date/loyer ✅
5. Valide ✅
6. Toast succès ✅
7. Alerte disparaît ✅
8. Base de données mise à jour ✅
   - leases.end_date = nouvelle date
   - leases.monthly_amount = nouveau montant
   - lease_decisions.decision_type = 'renew'
```

### Workflow Complet - Résiliation

```
1. Propriétaire voit alerte J-180 ✅
2. Clique "⚠️ Action Requise" ✅
3. Modal s'ouvre ✅
4. Onglet "Donner Congé" ✅
5. Choisit motif ✅
6. Valide ✅
7. PDF généré ✅
8. Email envoyé au locataire ✅
9. CC au propriétaire ✅
10. Toast succès ✅
11. Base de données mise à jour ✅
    - leases.status = 'pending_termination'
    - lease_decisions.decision_type = 'terminate'
    - lease_decisions.notice_number = 'PREV-2025-XXXX'
```

---

## 🚨 Points de Vigilance

### 1. Email du Locataire
**CRITIQUE:** Vérifier que `tenant_email` est bien rempli dans la table `leases`

```sql
-- Vérifier les baux sans email
SELECT id, tenant_name, property_address, tenant_email
FROM leases
WHERE status = 'active'
AND tenant_email IS NULL;
```

**Si des baux n'ont pas d'email:**
- Remplir manuellement dans Supabase
- Ou bloquer la génération de préavis (déjà fait ✅)

### 2. Destinataires Email
**CRITIQUE:** Vérifier dans les logs que:
- `TO` = email du locataire
- `CC` = email du propriétaire

**Logs à surveiller:**
```
📧 Destinataires email:
   → TO (Locataire): [doit être différent du CC]
   → CC (Propriétaire): [email propriétaire]
```

### 3. Status du Bail
Après résiliation, le status doit être `pending_termination`

```sql
SELECT id, tenant_name, status
FROM leases
WHERE status = 'pending_termination';
```

---

## ✅ Critères de Succès

**Le système fonctionne si:**

1. ✅ Build réussi sans erreur
2. ✅ Page Legal s'affiche correctement
3. ✅ Modal s'ouvre au clic
4. ✅ Renouvellement fonctionne (base mise à jour)
5. ✅ Résiliation génère PDF + envoie email
6. ✅ Email reçu par le LOCATAIRE (pas propriétaire)
7. ✅ CC reçu par le propriétaire
8. ✅ PDF tient sur 1 page
9. ✅ Décisions enregistrées dans `lease_decisions`
10. ✅ Logs de débogage corrects

---

## 📝 Commandes Utiles

**Démarrer le serveur:**
```bash
npm run dev
```

**Vérifier les logs:**
```bash
# Dans le terminal où tourne npm run dev
# Chercher:
# - "📋 Données préavis"
# - "📧 Destinataires email"
# - "✅ Email envoyé"
```

**Nettoyer les données de test:**
```sql
-- Supprimer les décisions de test
DELETE FROM lease_decisions
WHERE notes LIKE '%Test%';

-- Réinitialiser le status des baux
UPDATE leases
SET status = 'active'
WHERE status = 'pending_termination'
AND id IN (SELECT lease_id FROM lease_decisions WHERE notes LIKE '%Test%');
```

---

**Date:** 2025-12-28
**Status:** Prêt pour test manuel
**Système:** Décision Manuel des Baux

🎯 **Commencez par le Test 1 et suivez la checklist !**
