# 📬 Logique des Notifications - Dousell Immo

## Vue d'ensemble

Ce document décrit la logique complète des notifications dans l'application Dousell Immo.

## 🎯 Qui reçoit quoi ?

### 1. **Dépôt d'annonce** (`app/compte/deposer/actions.ts`)
- **Qui** : Tous les admins, modérateurs et superadmins
- **Quand** : Quand un utilisateur dépose une nouvelle annonce
- **Type** : `info`
- **Message** : "Nouvelle annonce en attente"
- **Action** : Utilise `notifyModeratorsAndAdmins()`

### 2. **Validation d'annonce** (`app/admin/moderation/actions.ts`)
- **Qui** : Le propriétaire de l'annonce
- **Quand** : Quand un admin/moderateur approuve une annonce
- **Type** : `success`
- **Message** : "✅ Votre annonce est en ligne !"
- **Action** : Utilise `notifyUser()`

### 3. **Refus d'annonce** (`app/admin/moderation/actions.ts`)
- **Qui** : Le propriétaire de l'annonce
- **Quand** : Quand un admin/moderateur refuse une annonce avec motif
- **Type** : `warning`
- **Message** : "⚠️ Annonce refusée"
- **Action** : Utilise `notifyUser()`

### 4. **Nouveau lead** (`app/planifier-visite/actions.tsx`)
- **Qui** : Tous les admins, modérateurs et superadmins
- **Quand** : Quand un visiteur soumet une demande de contact/visite
- **Type** : `info`
- **Message** : "Nouveau lead"
- **Action** : Utilise `notifyModeratorsAndAdmins()`

### 5. **Attribution de rôle** (`app/admin/roles/actions.ts`)
- **Qui** : L'utilisateur qui reçoit le rôle
- **Quand** : Quand un admin accorde un rôle (admin, moderateur, agent, superadmin)
- **Type** : `success`
- **Message** : "Vous avez reçu le rôle [ROLE]"
- **Action** : Utilise `createRoleNotification()`

### 6. **Retrait de rôle** (`app/admin/roles/actions.ts`)
- **Qui** : L'utilisateur qui perd le rôle
- **Quand** : Quand un admin retire un rôle
- **Type** : `warning`
- **Message** : "Rôle retiré"
- **Action** : Utilise `createRoleRevokedNotification()`

## 🔧 Fonctions utilitaires

### `notifyUser(userId, type, title, message, resourcePath)`
Notifie un utilisateur spécifique.

### `notifyAdmin(type, title, message, resourcePath)`
Notifie uniquement l'admin principal (email configuré).

### `notifyModeratorsAndAdmins(type, title, message, resourcePath)`
Notifie tous les utilisateurs avec les rôles : admin, moderateur, superadmin.

## 📋 Checklist de vérification

- [x] Dépôt d'annonce → Notifie admins/moderateurs
- [x] Validation d'annonce → Notifie propriétaire
- [x] Refus d'annonce → Notifie propriétaire
- [x] Nouveau lead → Notifie admins/moderateurs
- [x] Attribution de rôle → Notifie utilisateur
- [ ] Retrait de rôle → À implémenter
- [ ] Mise à jour de statut de lead → À considérer

## 🐛 Problèmes connus

1. **Badge ne s'affiche pas** : Vérifier que Realtime est activé pour la table `notifications`
2. **Notifications non créées** : Vérifier les RLS policies et que `SUPABASE_SERVICE_ROLE_KEY` est défini
3. **Badge ne se met pas à jour** : Vérifier que le hook `useNotifications` est bien utilisé

## 📝 Scripts SQL à exécuter

1. `docs/fix-notifications-rls.sql` - Corriger les RLS policies
2. `docs/enable-realtime-notifications.sql` - Activer Realtime

