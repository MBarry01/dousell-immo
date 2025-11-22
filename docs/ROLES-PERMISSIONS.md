# Système de Rôles et Permissions

## Rôles disponibles

- **superadmin** : Accès total à toutes les fonctionnalités
- **admin** : Accès presque total (sauf gestion des superadmins)
- **moderateur** : Modération des biens, consultation des leads, dashboard
- **agent** : Consultation des leads, dashboard, création de biens

## Permissions par page

### Dashboard (`/admin`)
- **Accès** : admin, moderateur, agent, superadmin

### Biens (`/admin/dashboard`)
- **Voir** : admin, moderateur, agent, superadmin
- **Créer** : admin, agent, superadmin
- **Modifier** : admin, moderateur, agent, superadmin
- **Supprimer** : admin, superadmin

### Modération (`/admin/moderation`)
- **Voir** : admin, moderateur, superadmin
- **Approuver** : admin, moderateur, superadmin
- **Rejeter** : admin, moderateur, superadmin

### Leads/Messages (`/admin/leads`)
- **Voir** : admin, moderateur, agent, superadmin
- **Gérer** : admin, moderateur, agent, superadmin

### Utilisateurs (`/admin/users`)
- **Voir** : admin, superadmin
- **Gérer** : admin, superadmin

### Rôles (`/admin/roles`)
- **Voir** : admin, superadmin
- **Gérer** : admin, superadmin
- **Gérer superadmin** : superadmin uniquement

## Utilisation dans le code

### Vérifier un rôle
```typescript
import { hasRole } from "@/lib/permissions";

const isAdmin = await hasRole("admin");
```

### Vérifier une permission
```typescript
import { hasPermission } from "@/lib/permissions";

const canModerate = await hasPermission("admin.moderation.view");
```

### Protéger une page
```typescript
import { requireAnyRole } from "@/lib/permissions";

export default async function MyPage() {
  await requireAnyRole(["admin", "moderateur"]);
  // ...
}
```

### Protéger avec une permission spécifique
```typescript
import { requirePermission } from "@/lib/permissions";

export default async function MyPage() {
  await requirePermission("admin.roles.manage");
  // ...
}
```

## Menu Admin

Le menu admin (`AdminSidebar`) affiche automatiquement les liens selon les rôles de l'utilisateur :
- Les utilisateurs ne voient que les pages auxquelles ils ont accès
- Le menu se met à jour automatiquement selon les rôles

## Fallback

L'email `barrymohamadou98@gmail.com` a toujours tous les droits, même sans rôle assigné (pour compatibilité).

