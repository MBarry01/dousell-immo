# 🔍 Déboguer l'accès Admin

## ❓ Problème : "Je ne vois pas" les pages admin

Voici comment vérifier et résoudre le problème.

## ✅ Checklist de vérification

### 1. Êtes-vous connecté ?

1. Allez sur `http://localhost:3000/compte`
2. Vérifiez que vous voyez vos informations de profil
3. Si vous êtes redirigé vers `/login`, vous n'êtes pas connecté

### 2. Quel email utilisez-vous ?

1. Sur la page `/compte`, regardez l'email affiché
2. L'email doit être **exactement** : `barrymohamadou98@gmail.com`
3. Si c'est un autre email, vous n'aurez pas accès à l'admin

### 3. Testez l'accès direct

Essayez d'aller directement sur :
- `http://localhost:3000/admin/dashboard`

**Comportement attendu** :
- Si connecté avec `barrymohamadou98@gmail.com` → ✅ Vous voyez le dashboard
- Si connecté avec un autre email → ❌ Redirection vers `/compte`
- Si non connecté → ❌ Redirection vers `/login`

## 🔧 Solutions

### Solution 1 : Vérifier votre email de connexion

1. **Déconnectez-vous** : Allez sur `/compte` → Cliquez sur "Déconnexion"
2. **Reconnectez-vous** avec `barrymohamadou98@gmail.com`
3. Essayez d'aller sur `/admin/dashboard`

### Solution 2 : Créer un compte avec le bon email

Si vous n'avez pas encore de compte avec cet email :

1. Allez sur `http://localhost:3000/register`
2. Créez un compte avec l'email : `barrymohamadou98@gmail.com`
3. Connectez-vous
4. Allez sur `/admin/dashboard`

### Solution 3 : Vérifier dans Supabase

1. Allez dans **Supabase Dashboard**
2. **Authentication** → **Users**
3. Cherchez `barrymohamadou98@gmail.com`
4. Vérifiez que le compte existe et est confirmé

### Solution 4 : Vérifier la console du navigateur

1. Ouvrez DevTools (F12) → Console
2. Allez sur `/admin/dashboard`
3. Regardez les erreurs éventuelles
4. Regardez les redirections dans l'onglet Network

## 🧪 Test rapide

Exécutez ces commandes dans la console du navigateur (F12) :

```javascript
// Vérifier votre email actuel
fetch('/api/auth/user')
  .then(r => r.json())
  .then(console.log)
```

Ou allez sur `/compte` et regardez l'email affiché.

## 📋 Vérification du code

Le middleware vérifie :
```typescript
const authorizedAdminEmail = "barrymohamadou98@gmail.com";
if (user.email?.toLowerCase() !== authorizedAdminEmail.toLowerCase()) {
  // Redirection vers /compte
}
```

**Important** :
- L'email est comparé en **minuscules**
- L'email doit être **exactement** `barrymohamadou98@gmail.com`
- Pas d'espaces, pas de majuscules

## 🐛 Si ça ne marche toujours pas

### Vérifier les logs serveur

Regardez la console où tourne `npm run dev` pour voir les erreurs.

### Vérifier le middleware

Le fichier `middleware.ts` doit appeler `updateSession` :

```typescript
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### Vérifier les cookies

1. Ouvrez DevTools (F12) → Application → Cookies
2. Vérifiez qu'il y a des cookies Supabase
3. Si pas de cookies → Vous n'êtes pas connecté

## 💡 Astuce

Pour tester rapidement, vous pouvez temporairement modifier le middleware pour accepter votre email actuel :

Dans `utils/supabase/middleware.ts`, ligne 77 :
```typescript
const authorizedAdminEmail = "VOTRE-EMAIL-ACTUEL@gmail.com";
```

Puis testez, et remettez `barrymohamadou98@gmail.com` après.


