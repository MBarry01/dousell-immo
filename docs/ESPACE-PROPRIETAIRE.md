# 🏠 Module "Espace Propriétaire"

## 📋 Vue d'ensemble

Module complet permettant aux particuliers de déposer leurs annonces immobilières avec modération et gestion de paiement (Wave/OM).

## 🗄️ Base de données

### Migration SQL (`supabase/migrations/add_owner_features.sql`)

Nouvelles colonnes ajoutées à la table `properties` :

- `owner_id` (uuid) : Lien vers `auth.users` pour identifier le propriétaire
- `is_agency_listing` (boolean, default true) : `false` = annonce de particulier
- `validation_status` (enum) : `pending`, `payment_pending`, `approved`, `rejected`
- `service_type` (enum) : `mandat_confort` (gratuit) ou `boost_visibilite` (payant)
- `payment_ref` (text) : Référence de transaction Wave/OM
- `views_count` (integer, default 0) : Compteur de vues

**Pour appliquer la migration :**
1. Allez dans Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `supabase/migrations/add_owner_features.sql`
3. Exécutez la requête

## 📄 Pages créées

### 1. Formulaire de dépôt (`app/compte/deposer/page.tsx`)

**3 étapes avec navigation :**

#### Step 1 : Le Bien
- Type de bien (Villa, Appartement, Terrain, Immeuble)
- Catégorie (Vente/Location)
- Titre, Prix, Localisation
- Surface, Pièces, Chambres, SDB (masqués pour Terrain)
- Description
- Upload de photos

#### Step 2 : L'Offre
- **Mandat Agence (Gratuit)** : "On s'occupe de tout. Commission au succès."
- **Diffusion Simple (Payant - 5000 FCFA)** : "Vous gérez vos visites. Votre annonce visible 30 jours."

#### Step 3 : Paiement (si Option B)
- QR Code placeholder
- Numéro Wave/OM de l'agence
- Champ pour saisir l'ID de transaction
- Bouton "Confirmer le dépôt"

**Fonctionnalités :**
- Validation conditionnelle selon le type de bien
- Labels dynamiques (Prix de Vente / Loyer Mensuel)
- Animations fluides entre les étapes
- Responsive mobile

### 2. Dashboard Propriétaire (`app/compte/mes-biens/page.tsx`)

**Affichage :**
- Liste des annonces du propriétaire connecté
- Badges de statut colorés :
  - 🟡 **Jaune** : "Vérification en cours" (pending)
  - 🔵 **Bleu** : "Paiement en attente" (payment_pending)
  - 🟢 **Vert** : "En ligne" (approved)
  - 🔴 **Rouge** : "Refusé" (rejected)
- Compteur de vues (si approved)
- Bouton "Déposer une annonce"

### 3. Modération Admin (`app/admin/moderation/page.tsx`)

**Fonctionnalités :**
- Liste des annonces en attente (`is_agency_listing = false` et `validation_status != approved`)
- Affichage des informations :
  - Photo, Titre, Prix, Localisation
  - Type de service (Mandat / Diffusion)
  - Référence de paiement (si applicable)
- Actions :
  - **Valider** : Passe en `approved`
  - **Refuser** : Passe en `rejected`
  - **Voir Preuve Paiement** : Affiche la référence Wave/OM
  - **Voir l'annonce** : Lien vers la page détail

## 🔧 Server Actions

### `submitUserListing` (`app/compte/deposer/actions.ts`)

**Logique :**
1. Vérifie que l'utilisateur est connecté
2. Détermine le statut selon le service :
   - `mandat_confort` → `pending`
   - `boost_visibilite` avec `payment_ref` → `payment_pending`
   - `boost_visibilite` sans `payment_ref` → Erreur
3. Insère le bien avec `is_agency_listing = false`
4. Log une notification pour l'admin (console)
5. Revalide les pages concernées

### `moderateProperty` (`app/admin/moderation/actions.ts`)

**Logique :**
1. Met à jour le `validation_status` (approved/rejected)
2. Revalide les pages concernées
3. TODO : Envoyer un email au propriétaire

## 🔗 Intégration

### Page Compte (`app/compte/page.tsx`)

Ajout d'une section "Mes annonces" avec :
- Lien vers "Mes biens"
- Bouton "Déposer une annonce"

### Dashboard Admin (`app/admin/dashboard/page.tsx`)

Ajout d'un bouton "Modération" dans le header pour accéder à `/admin/moderation`

## 📱 Navigation

**Pour les propriétaires :**
- `/compte` → Section "Mes annonces"
- `/compte/deposer` → Formulaire de dépôt
- `/compte/mes-biens` → Liste des annonces

**Pour les admins :**
- `/admin/dashboard` → Bouton "Modération"
- `/admin/moderation` → Page de modération

## 🎨 Design

- **Mobile First** : Toutes les pages sont optimisées pour mobile
- **Animations** : Transitions fluides avec Framer Motion
- **Badges** : Statuts visuels avec couleurs et icônes
- **Cards** : Design moderne avec bordures et backgrounds glassmorphism

## 🚀 Prochaines étapes (TODO)

1. **Upload réel vers Supabase Storage** : Actuellement mock dans le formulaire
2. **Email notifications** : Envoyer des emails aux propriétaires lors de la modération
3. **Géolocalisation** : Ajouter les coordonnées GPS automatiquement
4. **Compteur de vues réel** : Tracker les vues avec analytics
5. **Intégration Wave API** : Vérifier automatiquement les paiements
6. **Dashboard propriétaire avancé** : Statistiques, modifications, etc.

## ✅ Checklist de déploiement

- [ ] Exécuter la migration SQL dans Supabase
- [ ] Vérifier que les colonnes sont bien créées
- [ ] Tester le formulaire de dépôt
- [ ] Tester la modération admin
- [ ] Configurer les emails (optionnel)
- [ ] Ajouter le vrai numéro Wave/OM
- [ ] Tester le flux complet : Dépôt → Modération → Publication

