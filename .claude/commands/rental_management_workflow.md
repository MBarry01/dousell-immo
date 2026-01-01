---
description: Workflow complet du Dashboard de Gestion Locative (Profil, Baux, Contrats, Maintenance)
---

# Architecture & Workflow : Gestion Locative

Ce document définit la source de vérité pour le module de Gestion Locative. Il garantit que tout développement futur respecte la hiérarchie **Propriétaire > Locataire** et l'intégrité des données juridiques.

## 1. Hiérarchie & Rôles

Le système est **Propriétaire-Centric**.

*   **Le Propriétaire (`auth.user`)** : C'est l'utilisateur connecté. Il est l'entité légale qui émet les contrats et reçoit les paiements. Ses informations (profil, branding) sont la base de tous les documents.
*   **Le Locataire** : N'est PAS un utilisateur système (`auth.users`) dans ce module. C'est une entité de données gérée par le propriétaire dans la table `leases`. Le propriétaire "possède" la donnée locataire.

**Flux de Création :**
1.  Propriétaire se connecte.
2.  Propriétaire crée un **Bien** (`properties`).
3.  Propriétaire crée un **Bail** (`leases`) en liant ce Bien et en saisissant manuellement les infos du Locataire.

---

## 2. Modèle de Données (Source de Vérité)

### A. Propriétaire (Table `profiles`)
Les informations légales de l'émetteur du contrat.
*Data Source : Page "Configuration Premium" (`config/actions.ts`)*

| Champ Code | Colonne DB | Description |
| :--- | :--- | :--- |
| **Nom Complet** | `full_name` | Utilisé pour générer Prénom/Nom (Split). *`first_name`/`last_name` n'existent pas.* |
| **Société** | `company_name` | Nom de la structure (SCI, Agence). |
| **Adresse** | `company_address` | **Adresse Légale** affichée sur le contrat. |
| **Branding** | `logo_url`, `signature_url` | URLs publiques (Bucket `branding`). |

### B. Bien Immobilier (Table `properties`)
Le bien objet du contrat.

| Champ Code | Colonne DB | Description |
| :--- | :--- | :--- |
| **Titre** | `title` | Désignation du bien (ex: "Appart T3 Dakar"). *`name` n'existe pas.* |
| **Adresse** | `location` (JSONB) | Accessible via `location->>'address'` ou `location->>'city'`. *`address` n'existe pas à la racine.* |
| **Description** | `description` | Description courte du bien. |

### C. Contrat & Juridique (Assistant Juridique)
L'intelligence juridique est centralisée dans `compte/(gestion)/legal`.

*   **Génération de Contrat** :
    *   Utilise les données **Propriétaire** (A) + **Bien** (B) + **Bail** (C).
    *   Le PDF généré est **immuable** une fois signé/stocké.
    *   Stockage : Bucket `lease-contracts` chemin `{owner_id}/contract-{lease_id}.pdf`. **Sécurité RLS stricte.**

---

## 3. Écosystème & Pages Connexes

Le module de contrats ne vit pas en vase clos. Il est connecté aux autres briques du Dashboard :

### A. Signalements & Maintenance (`MaintenanceHub`)
*   **Lien :** Un signalement est lié à une `property_id` et un `lease_id`.
*   **Flux :** Le propriétaire consigne un incident pour un locataire donné.
*   **Impact Juridique :** Les incidents ouverts peuvent bloquer le renouvellement (Alerte Juridique).

### B. Radar des Échéances (Legal)
*   **Lien :** Surveille les dates de fin de bail (`leases.end_date`).
*   **Flux :**
    1.  Le système détecte une fin de bail proche (ex: J-180).
    2.  Une "Alerte" est affichée dans le Radar.
    3.  Le propriétaire peut générer un "Avis de Congé" ou un "Renouvellement" depuis cette alerte.

## 4. Checklist Technique (Pour les Devs)

*   [ ] **Respecter la hiérarchie** : Tout part de `auth.user` (Propriétaire). Ne jamais supposer que le locataire a un `user_id`.
*   [ ] **Adresses** : Toujours vérifier `company_address` (Profile) puis `location` (Property JSON). Ne jamais utiliser `profiles.address` (inexistant).
*   [ ] **Sécurité** : Les documents générés sont privés. Toujours utiliser `createSignedUrl` pour l'affichage.
