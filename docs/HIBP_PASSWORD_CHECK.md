# 🔐 Vérification HIBP (Have I Been Pwned) pour les mots de passe

## 📋 Vue d'ensemble

Dousell Immo intègre la vérification **HIBP (Have I Been Pwned)** pour s'assurer que les utilisateurs n'utilisent pas de mots de passe compromis lors de l'inscription.

## 🏗️ Architecture

### Edge Function Supabase

L'application utilise une **Edge Function Supabase** `hibp-password-check` qui :
- Reçoit le mot de passe en clair (via HTTPS)
- Vérifie contre la base de données HIBP
- Retourne si le mot de passe a été compromis et combien de fois

**URL de l'Edge Function** :
```
https://<project-id>.functions.supabase.co/hibp-password-check
```

### Client-side (Frontend)

La vérification se fait **côté client** avant l'appel à `supabase.auth.signUp()` :
1. ✅ L'utilisateur remplit le formulaire d'inscription
2. ✅ Vérification Turnstile (Captcha)
3. ✅ **Vérification HIBP** (nouveau)
4. ✅ Si mot de passe OK → Inscription Supabase
5. ✅ Si mot de passe compromis → Erreur affichée, inscription bloquée

## 📁 Fichiers

### `lib/hibp.ts`

Fonction utilitaire pour vérifier les mots de passe via l'Edge Function :

```typescript
import { checkPasswordHIBP } from "@/lib/hibp";

const result = await checkPasswordHIBP(password, true); // true = utiliser retry

if (result.breached) {
  // Mot de passe compromis
  console.error(result.error);
} else if (!result.success) {
  // Erreur technique
  console.error(result.error);
} else {
  // Mot de passe OK, continuer avec l'inscription
}
```

**Fonctionnalités** :
- ✅ Retry avec exponential backoff (3 essais par défaut)
- ✅ Gestion d'erreurs complète
- ✅ Messages d'erreur en français
- ✅ Ne logge jamais le mot de passe

### `app/register/page.tsx`

Intégration dans le formulaire d'inscription :
- Vérification HIBP **avant** l'appel à `signup()`
- Affichage d'un spinner "Vérification du mot de passe..." pendant la vérification
- Toast d'erreur si le mot de passe est compromis
- Blocage de l'inscription si le mot de passe est compromis

## 🔒 Sécurité

### ✅ Bonnes pratiques implémentées

1. **HTTPS uniquement** : L'appel à l'Edge Function se fait toujours via HTTPS
2. **Pas de logging** : Le mot de passe n'est jamais loggé
3. **Retry intelligent** : Retry uniquement pour les erreurs 5xx (serveur), pas pour les 4xx (client)
4. **Rate limiting** : À implémenter côté Edge Function si nécessaire
5. **Validation côté client ET serveur** : Double vérification

### ⚠️ Remarques importantes

- Le mot de passe est envoyé **en clair** à l'Edge Function (mais via HTTPS)
- L'Edge Function ne stocke **jamais** le mot de passe
- La vérification se fait **avant** l'inscription, donc aucun compte n'est créé avec un mot de passe compromis

## 🧪 Tests

### Tester avec un mot de passe compromis

Utilisez un mot de passe connu compromis :
- `password123`
- `123456`
- `password`
- `qwerty`

**Résultat attendu** :
```
❌ Ce mot de passe a déjà été compromis (X fois). Choisissez un autre mot de passe plus sécurisé.
```

### Tester avec un mot de passe fort

Utilisez un mot de passe fort et unique :
- `MySecureP@ssw0rd!2024`
- `Tr0ub4dor&3`

**Résultat attendu** :
```
✅ Vérification OK → Inscription continue
```

### Tester l'erreur réseau

Simulez une erreur réseau (arrêtez l'Edge Function) :

**Résultat attendu** :
```
⚠️ Service temporairement indisponible. Veuillez réessayer dans quelques instants.
```

## 🚀 Déploiement

### Prérequis

1. ✅ Edge Function `hibp-password-check` déployée sur Supabase
2. ✅ Variable d'environnement `NEXT_PUBLIC_SUPABASE_URL` configurée
3. ✅ L'URL de l'Edge Function est construite automatiquement à partir de `NEXT_PUBLIC_SUPABASE_URL`

### Configuration

Aucune configuration supplémentaire nécessaire ! L'URL de l'Edge Function est construite automatiquement :

```typescript
// lib/hibp.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// https://blyanhulvwpdfpezlaji.supabase.co

// → https://blyanhulvwpdfpezlaji.functions.supabase.co/hibp-password-check
```

## 📊 Flux utilisateur

```
┌─────────────────────────────────────────────────────────┐
│ 1. Utilisateur remplit le formulaire d'inscription     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Validation côté client (email, téléphone, etc.)      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Vérification Turnstile (Captcha)                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Vérification HIBP (nouveau)                          │
│    → Appel Edge Function                                │
│    → Retry si erreur 5xx                                │
└─────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
   ❌ Compromis                    ✅ OK
        │                               │
        ↓                               ↓
┌───────────────┐            ┌──────────────────────┐
│ Erreur affichée│            │ Inscription Supabase│
│ Inscription    │            │ → Email de conf.     │
│ bloquée        │            │ → Compte créé        │
└───────────────┘            └──────────────────────┘
```

## 🔧 Dépannage

### L'Edge Function ne répond pas

1. Vérifiez que l'Edge Function est déployée :
   - Supabase Dashboard → **Edge Functions** → `hibp-password-check`
2. Vérifiez les logs :
   - Supabase Dashboard → **Logs** → **Edge Functions**
3. Vérifiez l'URL :
   - Console navigateur → Network → Cherchez `hibp-password-check`

### Erreur "HIBP Edge Function URL not configured"

Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est défini dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://blyanhulvwpdfpezlaji.supabase.co
```

### Le retry ne fonctionne pas

Le retry est automatique pour les erreurs 5xx. Pour les erreurs 4xx (client), pas de retry (comportement normal).

## 📚 Ressources

- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

