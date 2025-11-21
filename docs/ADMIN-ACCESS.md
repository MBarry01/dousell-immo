# 🔐 Configuration d'accès Admin

## ✅ Configuration actuelle

L'accès aux pages admin (`/admin/*`) est **restreint** à l'email suivant :

**Email autorisé** : `barrymohamadou98@gmail.com`

## 🔒 Protection mise en place

### 1. Middleware (Protection principale)

Le fichier `utils/supabase/middleware.ts` vérifie :
- ✅ L'utilisateur est connecté
- ✅ L'email de l'utilisateur correspond à `barrymohamadou98@gmail.com`

**Comportement** :
- Si non connecté → Redirection vers `/login`
- Si connecté mais email différent → Redirection vers `/compte`
- Si email autorisé → Accès autorisé

### 2. Pages serveur (Protection supplémentaire)

Les pages admin serveur utilisent `requireAdmin()` depuis `lib/admin-auth.ts` :

```typescript
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  await requireAdmin(); // Vérifie et redirige si non autorisé
  // ... reste du code
}
```

### 3. Pages client (Protection supplémentaire)

Les pages admin client vérifient l'email avec `useAuth()` :

```typescript
const { user } = useAuth();
if (user.email !== "barrymohamadou98@gmail.com") {
  router.push("/compte");
}
```

## 📋 Routes protégées

- `/admin/dashboard` - Tableau de bord admin
- `/admin/biens/nouveau` - Ajouter un bien
- `/admin/biens/[id]` - Éditer un bien (si existant)

## 🔧 Modifier l'email admin

Pour changer l'email autorisé, modifiez dans **3 fichiers** :

### 1. `utils/supabase/middleware.ts`

```typescript
const authorizedAdminEmail = "nouveau-email@example.com";
```

### 2. `lib/admin-auth.ts`

```typescript
const AUTHORIZED_ADMIN_EMAIL = "nouveau-email@example.com";
```

### 3. `app/admin/biens/nouveau/page.tsx`

```typescript
const AUTHORIZED_ADMIN_EMAIL = "nouveau-email@example.com";
```

## 🧪 Tester l'accès admin

### Avec l'email autorisé

1. Connectez-vous avec `barrymohamadou98@gmail.com`
2. Allez sur `http://localhost:3000/admin/dashboard`
3. ✅ Vous devriez voir le tableau de bord admin

### Avec un autre email

1. Connectez-vous avec un autre email
2. Essayez d'aller sur `http://localhost:3000/admin/dashboard`
3. ❌ Vous serez redirigé vers `/compte`

### Sans être connecté

1. Déconnectez-vous
2. Essayez d'aller sur `http://localhost:3000/admin/dashboard`
3. ❌ Vous serez redirigé vers `/login`

## 🔐 Sécurité

**Triple protection** :
1. **Middleware** : Bloque au niveau du serveur avant même le rendu
2. **Pages serveur** : Vérification supplémentaire avec `requireAdmin()`
3. **Pages client** : Vérification côté client pour une meilleure UX

Cette approche garantit que même si une couche est contournée, les autres protègent toujours l'accès.

## 📝 Notes

- L'email est comparé en **minuscules** (case-insensitive)
- Les redirections préservent l'URL d'origine dans le paramètre `redirect`
- Les utilisateurs non autorisés voient une redirection silencieuse (pas d'erreur visible)

