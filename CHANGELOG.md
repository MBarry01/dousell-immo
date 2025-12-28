# Changelog - Dousell Immo

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.5.0] - 2025-12-28

### 🎉 Ajouté

#### Système de Relances Automatiques J+5
- **Cron Job automatique** : Exécution quotidienne à 9h GMT via Vercel Cron (`/api/cron`)
- **Envoi d'emails** : Relances automatiques pour les loyers en retard ≥ 5 jours
- **Bouton manuel** : Nouveau bouton "Relances J+5" dans l'UI pour déclencher manuellement
- **Configuration** : `vercel.json` avec 2 crons (génération mensuelle + relances quotidiennes)
- **Sécurité** : Protection par `CRON_SECRET` en production
- **Documentation** : Guide complet dans `docs/CRON_SETUP.md`

#### Création Automatique de Transactions
- **Nouveau comportement** : Lors de l'ajout d'un locataire, une transaction est créée automatiquement pour le mois en cours
- **Dynamique** : S'adapte automatiquement au mois et à l'année actuels (pas de hardcoding)
- **Champs créés** :
  - `period_month` : Mois actuel (1-12)
  - `period_year` : Année actuelle
  - `period_start` : 1er du mois
  - `period_end` : Dernier jour du mois
  - `reminder_sent: false` : Prêt pour les relances

#### Envoi Automatique des Quittances
- **Trigger** : Quand un paiement est marqué comme "Payé"
- **Destinataires** : Email locataire (TO) + Email propriétaire (CC)
- **Transport** : Gmail SMTP direct (pas de n8n)
- **Données utilisées** : `company_email` du profil ou `user.email` en fallback

#### Synchronisation UI ↔ Backend ↔ KPIs
- **Source unique de vérité** : `billing_day` utilisé partout (UI, finance.ts, reminders-service.ts)
- **Finance Guard v2.0** :
  - Fonction `calculateDisplayStatus()` pour cohérence
  - Fallback robuste : `amount_paid || amount_due || 0`
  - Documentation complète des règles de calcul
- **Affichage statuts** :
  - 🟢 Payé : `status === 'paid'`
  - 🟡 En attente : `status !== 'paid' && currentDay <= billing_day`
  - 🔴 Retard : `status !== 'paid' && currentDay > billing_day`

#### Documentation
- **`docs/FINANCE_SYSTEM.md`** : Architecture complète du système financier
- **`docs/ROADMAP_PANELS_AUTOMATION.md`** : Plan des panels d'automatisation futurs (8 panels détaillés)
- **`docs/CRON_SETUP.md`** : Guide de configuration et tests des cron jobs

#### Endpoints de Debug (Développement)
- **`/api/test-reminders`** : Diagnostic détaillé du système de relances
- **`/api/reset-reminders`** : Reset des flags `reminder_sent` pour tests

### 🔧 Modifié

#### Layout & UX Mobile
- **Scroll horizontal** : Corrigé via `overflow-x-hidden` sur tous les conteneurs (AppShell, page, composants)
- **Sélecteur de mois** : Centré sur mobile avec `w-fit mx-auto`
- **Bouton CSV** : Repositionné à droite du sélecteur avec `justify-between`
- **MaintenanceHub** : Déplacé sous le tableau (layout vertical au lieu de grille)

#### Fichiers Modifiés
- `app/compte/gestion-locative/actions.ts` : Ajout création transaction + envoi quittance
- `app/compte/gestion-locative/components/GestionLocativeClient.tsx` : Calcul statut avec `billing_day`
- `app/compte/gestion-locative/page.tsx` : Layout MaintenanceHub + overflow fix
- `lib/finance.ts` : Finance Guard v2.0 avec utilities
- `lib/reminders-service.ts` : Logique J+5 basée sur `billing_day`
- `components/layout/app-shell.tsx` : Ajout `overflow-x-hidden`

### 🗄️ Base de Données

#### Migrations Créées
```sql
-- 20251228120000_add_reminder_sent.sql
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- 20251228130000_add_amount_paid.sql
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;
```

⚠️ **Action requise** : Exécuter ces migrations via Supabase Dashboard

### 📦 Dépendances
- Aucune nouvelle dépendance ajoutée (utilise l'existant : date-fns, nodemailer, etc.)

### 🐛 Corrections

#### Problème : Cron retournait 0 relances malgré retards visibles
- **Cause** : Flag `reminder_sent` déjà à `true` dans la base
- **Solution** : Endpoint `/api/reset-reminders` pour tests + documentation du comportement

#### Problème : Nouveaux locataires invisibles pour le cron
- **Cause** : Pas de transaction créée lors de l'ajout du bail
- **Solution** : Création automatique de la transaction du mois actuel

---

## [1.4.0] - 2025-12-27

### Ajouté
- Gestion locative basique
- Tableau des locataires
- Export CSV des loyers

---

## Notes de Version

### Configuration Requise pour Production

#### Variables d'environnement Vercel
```bash
CRON_SECRET=<générer_secret_aléatoire>
GMAIL_USER=<votre_email@gmail.com>
GMAIL_APP_PASSWORD=<mot_de_passe_app>
SUPABASE_URL=<url_supabase>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

#### Plan Vercel
⚠️ **Cron jobs nécessitent Vercel Pro** ($20/mois)

#### Tests Recommandés
1. Tester `/api/cron` en local
2. Tester `/api/test-reminders` pour diagnostic
3. Vérifier les emails dans Gmail
4. Vérifier les logs Vercel après déploiement

---

**Dernière mise à jour** : 2025-12-28
**Version** : 1.5.0
**Équipe** : Dousell Immo Team
