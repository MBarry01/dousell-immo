# 🔐 Documentation Authentification - Dousell Immo

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Inscription](#inscription)
4. [Connexion](#connexion)
5. [OAuth Google](#oauth-google)
6. [Gestion des sessions](#gestion-des-sessions)
7. [Protection des routes](#protection-des-routes)
8. [Configuration](#configuration)
9. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Dousell Immo utilise **Supabase Auth** pour gérer l'authentification des utilisateurs avec plusieurs couches de sécurité :

- ✅ **Inscription** : Email/Mot de passe avec vérifications multiples
- ✅ **Connexion** : Email/Mot de passe ou OAuth Google
- ✅ **Protection anti-robot** : Cloudflare Turnstile
- ✅ **Vérification HIBP** : Détection des mots de passe compromis
- ✅ **Sessions sécurisées** : Gestion automatique via cookies HTTP-only
- ✅ **Protection des routes** : Middleware Next.js + vérifications serveur

---

## 🏗️ Architecture

### Composants principaux

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Client)                    │
├─────────────────────────────────────────────────────────┤
│  • app/register/page.tsx  → Formulaire d'inscription  │
│  • app/login/page.tsx      → Formulaire de connexion   │
│  • hooks/use-auth.ts       → Hook React pour l'auth    │
│  • components/ui/captcha.tsx → Widget Turnstile        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Server Actions (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  • app/auth/actions.ts    → signup(), login(), etc.    │
│  • lib/hibp.ts            → Vérification HIBP         │
│  • lib/turnstile.ts        → Vérification Turnstile    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Middleware (Protection routes)             │
├─────────────────────────────────────────────────────────┤
│  • middleware.ts          → Protection globale         │
│  • utils/supabase/middleware.ts → Gestion sessions     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase Auth                          │
├─────────────────────────────────────────────────────────┤
│  • Authentication         → Gestion utilisateurs        │
│  • SMTP (Resend)          → Emails de confirmation     │
│  • OAuth Google           → Connexion sociale          │
└─────────────────────────────────────────────────────────┘
```

### Flux de données

```
Client → Server Action → Supabase Auth → Database
   ↑                                              ↓
   └─────────── Session Cookie ──────────────────┘
```

---

## 📝 Inscription

### Flux complet

```
1. Utilisateur remplit le formulaire (/register)
   ├─ Nom complet (min 2 caractères)
   ├─ Email (format valide)
   ├─ Téléphone (9 chiffres, format +221)
   └─ Mot de passe (min 6 caractères)
   ↓
2. Validation côté client
   ├─ Format email
   ├─ Longueur mot de passe
   ├─ Format téléphone
   └─ Nom complet
   ↓
3. Vérification Turnstile (Captcha)
   ├─ Widget Cloudflare Turnstile
   ├─ Token généré
   └─ Vérification serveur
   ↓
4. 🔐 Vérification HIBP (NOUVEAU)
   ├─ Appel Edge Function: hibp-password-check
   ├─ Vérification contre base HIBP
   ├─ Retry automatique si erreur 5xx
   └─ Si compromis → Erreur, inscription bloquée
   ↓
5. Inscription Supabase
   ├─ Création compte auth.users
   ├─ Stockage metadata (full_name, phone)
   └─ Envoi email de confirmation (si activé)
   ↓
6. Résultat
   ├─ Auto-confirmé → Connexion immédiate + Redirection
   └─ Confirmation requise → Toast + Pas de redirection
```

### Fichiers impliqués

- **`app/register/page.tsx`** : Formulaire d'inscription
- **`app/auth/actions.ts`** : Server action `signup()`
- **`lib/hibp.ts`** : Vérification HIBP
- **`lib/turnstile.ts`** : Vérification Turnstile
- **`components/ui/captcha.tsx`** : Widget Turnstile

### Validation des champs

```typescript
// Validation côté client ET serveur
- Email : Format valide (regex)
- Mot de passe : Minimum 6 caractères
- Téléphone : 9 chiffres (format Sénégal +221)
- Nom complet : Minimum 2 caractères
```

### Vérifications de sécurité

#### 1. Cloudflare Turnstile

**Objectif** : Protection anti-robot

**Implémentation** :
- Widget affiché sur le formulaire
- Token généré côté client
- Vérification serveur avant inscription

**Configuration** :
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACCuVzo4E-zQP1Z9
TURNSTILE_SECRET_KEY=votre-secret-key
```

**Fichiers** :
- `components/ui/captcha.tsx` : Widget React
- `lib/turnstile.ts` : Vérification serveur

#### 2. HIBP (Have I Been Pwned)

**Objectif** : Détecter les mots de passe compromis

**Implémentation** :
- Vérification via Edge Function Supabase
- Retry avec exponential backoff (3 essais)
- Blocage de l'inscription si compromis

**Edge Function** :
```
https://<project-id>.functions.supabase.co/hibp-password-check
```

**Fichiers** :
- `lib/hibp.ts` : Fonction utilitaire
- `app/register/page.tsx` : Intégration

**Voir** : `docs/HIBP_PASSWORD_CHECK.md` pour plus de détails

### Résultats possibles

#### ✅ Inscription réussie (Auto-confirmé)

```typescript
{
  success: true,
  autoConfirmed: true,
  emailSent: false,
  session: { ... }
}
```

**Comportement** :
- Toast : "Compte créé avec succès ! Vous êtes maintenant connecté."
- Redirection automatique vers `/` après 1.5s

#### ✅ Inscription réussie (Confirmation requise)

```typescript
{
  success: true,
  autoConfirmed: false,
  emailSent: true
}
```

**Comportement** :
- Toast : "Compte créé ! Un lien de confirmation a été envoyé..."
- **Aucune redirection** (l'utilisateur reste sur `/register`)
- L'utilisateur doit cliquer sur le lien dans l'email

#### ❌ Erreur

```typescript
{
  error: "Message d'erreur en français"
}
```

**Messages d'erreur courants** :
- "Cet email est déjà enregistré"
- "Trop de tentatives de connexion. Attendez 5 minutes"
- "Ce mot de passe a été compromis"
- "Vérification anti-robot échouée"

---

## 🔑 Connexion

### Flux complet

```
1. Utilisateur remplit le formulaire (/login)
   ├─ Email
   └─ Mot de passe
   ↓
2. Validation côté client
   ├─ Email et mot de passe requis
   └─ Format email
   ↓
3. Vérification Turnstile (Captcha)
   ├─ Widget Cloudflare Turnstile
   ├─ Token généré
   └─ Vérification serveur
   ↓
4. Connexion Supabase
   ├─ supabase.auth.signInWithPassword()
   ├─ Vérification credentials
   └─ Création session
   ↓
5. Résultat
   ├─ Succès → Redirection vers "/"
   └─ Erreur → Message affiché
```

### Fichiers impliqués

- **`app/login/page.tsx`** : Formulaire de connexion
- **`app/auth/actions.ts`** : Server action `login()`
- **`lib/turnstile.ts`** : Vérification Turnstile

### Messages d'erreur

- **"Email ou mot de passe incorrect"** : Credentials invalides
- **"Veuillez confirmer votre email avant de vous connecter"** : Email non confirmé
- **"Trop de tentatives. Attendez 5 minutes"** : Rate limiting Supabase

### Protection rate limiting

Supabase limite automatiquement les tentatives de connexion :
- **Après 5 tentatives échouées** : Blocage temporaire (5 minutes)
- **Message affiché** : "Trop de tentatives. Pour votre sécurité, veuillez attendre 5 minutes avant de réessayer."

---

## 🌐 OAuth Google

### Flux complet

```
1. Utilisateur clique sur "Continuer avec Google"
   ↓
2. Redirection vers Google OAuth
   ├─ Sélection compte Google
   └─ Autorisation
   ↓
3. Callback Supabase
   ├─ /auth/callback?next=/
   ├─ Échange code OAuth → Session
   └─ Création compte si nouveau
   ↓
4. Redirection vers l'app
   └─ Utilisateur connecté
```

### Configuration

#### 1. Google Cloud Console

**OAuth Client ID** :
- Type : Web application
- **Authorized JavaScript origins** :
  ```
  http://localhost:3000
  https://votre-domaine.com
  ```
- **Authorized redirect URIs** :
  ```
  https://<project-id>.supabase.co/auth/v1/callback
  http://localhost:3000/auth/callback
  https://votre-domaine.com/auth/callback
  ```

#### 2. Supabase Dashboard

**Authentication → Providers → Google** :
- ✅ Toggle activé
- **Client ID** : Votre Google Client ID
- **Client Secret** : Votre Google Client Secret
- **Save**

**Authentication → URL Configuration** :
- **Site URL** : `http://localhost:3000` (dev) ou `https://votre-domaine.com` (prod)
- **Redirect URLs** :
  ```
  http://localhost:3000/**
  http://localhost:3000/auth/callback
  https://votre-domaine.com/**
  https://votre-domaine.com/auth/callback
  ```

### Fichiers impliqués

- **`app/auth/actions.ts`** : `signInWithGoogle()`
- **`app/auth/callback/route.ts`** : Gestion du callback OAuth

### Gestion du téléphone manquant

Si un utilisateur se connecte via Google **sans numéro de téléphone** :

1. **`components/auth/phone-missing-dialog.tsx`** s'affiche automatiquement
2. Dialog **non fermable** (bloquant)
3. L'utilisateur doit entrer son numéro
4. Sauvegarde via `supabase.auth.updateUser()`
5. Dialog se ferme automatiquement

**Intégration** : `app/layout.tsx` (monitoring global)

---

## 🔄 Gestion des sessions

### Architecture

Dousell Immo utilise **Supabase SSR** (`@supabase/ssr`) pour gérer les sessions :

- ✅ **Cookies HTTP-only** : Sécurité renforcée
- ✅ **Refresh automatique** : Tokens rafraîchis automatiquement
- ✅ **Synchronisation** : Sessions synchronisées entre onglets

### Clients Supabase

#### 1. Client serveur (`utils/supabase/server.ts`)

```typescript
// Pour Server Actions et Server Components
import { createClient } from "@/utils/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Usage** :
- Server Actions (`app/auth/actions.ts`)
- Server Components
- API Routes

#### 2. Client navigateur (`utils/supabase/client.ts`)

```typescript
// Pour Client Components
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
```

**Usage** :
- Client Components
- Hooks React (`useAuth`)

### Hook `useAuth`

**Fichier** : `hooks/use-auth.ts`

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Non connecté</div>;
  
  return <div>Bonjour {user.email}!</div>;
}
```

**Fonctionnalités** :
- ✅ État de chargement automatique
- ✅ Écoute des changements d'auth (connexion/déconnexion)
- ✅ Synchronisation entre onglets

### Middleware

**Fichier** : `middleware.ts` + `utils/supabase/middleware.ts`

**Fonctions** :
1. **Mise à jour des sessions** : Refresh automatique des tokens
2. **Protection des routes** : Redirection vers `/login` si non connecté
3. **Gestion des redirections** : Retour après connexion

**Routes protégées** :
- `/compte/**` : Requiert authentification
- `/admin/**` : Requiert authentification + rôle admin

**Routes publiques** :
- `/login` : Redirige vers `/compte` si déjà connecté
- `/register` : Redirige vers `/compte` si déjà connecté
- `/` : Accessible à tous

---

## 🛡️ Protection des routes

### Niveaux de protection

#### 1. Middleware (Protection globale)

**Fichier** : `middleware.ts`

```typescript
// Protection automatique des routes /compte et /admin
if (!user && pathname.startsWith("/compte")) {
  redirect("/login?redirect=" + pathname);
}
```

#### 2. Server Components (Vérification serveur)

**Exemple** : `app/compte/page.tsx`

```typescript
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return <div>Mon compte</div>;
}
```

#### 3. Rôles (Protection admin)

**Fichier** : `lib/permissions.ts`

```typescript
import { requireAnyRole } from "@/lib/permissions";

export async function AdminPage() {
  await requireAnyRole(["admin", "moderateur"]);
  // Code de la page admin
}
```

**Rôles disponibles** :
- `admin` : Administrateur
- `moderateur` : Modérateur
- `superadmin` : Super administrateur

---

## ⚙️ Configuration

### Variables d'environnement

**`.env.local`** (Développement) :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACCuVzo4E-zQP1Z9
TURNSTILE_SECRET_KEY=votre-secret-key

# Resend (pour emails)
RESEND_API_KEY=re_xxx...
```

**Production** (Vercel/Netlify) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACCuVzo4E-zQP1Z9
TURNSTILE_SECRET_KEY=votre-secret-key
RESEND_API_KEY=re_xxx...
```

### Configuration Supabase

#### 1. Authentication → Providers → Email

- ✅ **Confirm email** : Activé (production) ou Désactivé (développement)
- ✅ **Secure email change** : Activé

#### 2. Authentication → SMTP Settings

**Pour les emails de confirmation** :

- ✅ **Enable custom SMTP** : Activé
- **Host** : `smtp.resend.com`
- **Port** : `587` (TLS)
- **Username** : `resend`
- **Password** : Votre clé API Resend (`re_xxx...`)
- **Sender email** : `onboarding@resend.dev` (ou votre domaine vérifié)
- **Sender name** : `Dousell Immo`

**Voir** : `docs/supabase-setup.md` pour plus de détails

#### 3. Authentication → Providers → Google

- ✅ **Toggle activé**
- **Client ID** : Votre Google OAuth Client ID
- **Client Secret** : Votre Google OAuth Client Secret

**Voir** : `docs/supabase-oauth-setup.md` pour plus de détails

---

## 🔧 Dépannage

### Problèmes courants

#### 1. "Erreur lors de l'inscription"

**Causes possibles** :
- Email déjà utilisé
- Rate limiting Supabase (trop de tentatives)
- SMTP non configuré (si "Confirm email" activé)
- Erreur de validation

**Solutions** :
1. Vérifiez les logs dans la console navigateur
2. Vérifiez les **Auth Logs** dans Supabase Dashboard
3. Désactivez temporairement "Confirm email" pour le développement
4. Attendez 5 minutes si rate limiting

#### 2. "Trop de tentatives de connexion"

**Cause** : Rate limiting Supabase (protection anti-brute force)

**Solution** :
- ⏰ **Attendre 5 minutes** avant de réessayer
- 🔄 **Changer d'IP** (VPN ou 4G mobile)
- 🔧 **Désactiver rate limiting** dans Supabase Dashboard (développement uniquement)

#### 3. Email de confirmation non reçu

**Causes possibles** :
- SMTP non configuré
- Email dans les spams
- "Confirm email" désactivé

**Solutions** :
1. Vérifiez **SMTP Settings** dans Supabase Dashboard
2. Testez avec "Send test email"
3. Vérifiez votre dossier spam
4. Vérifiez que "Confirm email" est activé

#### 4. OAuth Google ne fonctionne pas

**Causes possibles** :
- URLs non configurées dans Google Cloud Console
- Client ID/Secret incorrects
- Redirect URI mismatch

**Solutions** :
1. Vérifiez les **Authorized redirect URIs** dans Google Cloud Console
2. Vérifiez **URL Configuration** dans Supabase Dashboard
3. Vérifiez les logs dans la console navigateur
4. **Voir** : `docs/CORRIGER-REDIRECT-URI-MISMATCH.md`

#### 5. "Vérification anti-robot échouée"

**Causes possibles** :
- Turnstile non configuré
- Token expiré
- Erreur réseau

**Solutions** :
1. Vérifiez `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dans `.env.local`
2. Vérifiez `TURNSTILE_SECRET_KEY` dans `.env.local`
3. Rechargez la page et réessayez
4. Vérifiez la console navigateur pour les erreurs

#### 6. "Ce mot de passe a été compromis"

**Cause** : Le mot de passe a été trouvé dans une fuite de données (HIBP)

**Solution** :
- Choisissez un **autre mot de passe** plus sécurisé
- Utilisez un gestionnaire de mots de passe (1Password, Bitwarden, etc.)

#### 7. Session perdue après refresh

**Causes possibles** :
- Cookies bloqués par le navigateur
- Configuration Supabase incorrecte
- Middleware non configuré

**Solutions** :
1. Vérifiez que les cookies ne sont pas bloqués
2. Vérifiez `middleware.ts` est présent
3. Vérifiez les logs dans la console navigateur
4. Vérifiez **Auth Logs** dans Supabase Dashboard

### Logs utiles

#### Console navigateur

```javascript
// Logs d'inscription
📋 Résultat signup: { success: true, ... }

// Logs de connexion
✅ OAuth URL générée avec succès

// Erreurs
❌ Signup error détaillé: { message, code, ... }
```

#### Supabase Dashboard

- **Logs → Auth Logs** : Toutes les tentatives d'authentification
- **Logs → Edge Functions** : Logs de l'Edge Function HIBP
- **Authentication → Users** : Liste des utilisateurs

### Tests de vérification

#### Test inscription

1. Va sur `/register`
2. Remplis le formulaire avec un **nouvel email**
3. Utilise un **mot de passe fort** (pas compromis)
4. Complète le Captcha Turnstile
5. Soumets le formulaire
6. ✅ Vérifie le résultat (toast + redirection ou message)

#### Test connexion

1. Va sur `/login`
2. Entre email et mot de passe
3. Complète le Captcha Turnstile
4. Soumets
5. ✅ Vérifie la redirection vers `/`

#### Test OAuth Google

1. Va sur `/login` ou `/register`
2. Clique sur "Continuer avec Google"
3. Sélectionne un compte Google
4. Autorise l'application
5. ✅ Vérifie la redirection vers `/`

#### Test HIBP

1. Va sur `/register`
2. Utilise un mot de passe compromis : `password123`
3. Remplis le formulaire
4. ✅ Vérifie que l'inscription est bloquée avec message d'erreur

---

## 📚 Ressources

### Documentation Supabase

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)

### Documentation externe

- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Have I Been Pwned](https://haveibeenpwned.com/API/v3)

### Documentation interne

- `docs/supabase-setup.md` : Configuration Supabase complète
- `docs/HIBP_PASSWORD_CHECK.md` : Détails sur la vérification HIBP
- `docs/supabase-oauth-setup.md` : Configuration OAuth Google

---

## 🔐 Bonnes pratiques de sécurité

### ✅ Implémentées

1. **HTTPS uniquement** : Toutes les communications sont chiffrées
2. **Cookies HTTP-only** : Protection contre XSS
3. **Rate limiting** : Protection anti-brute force (Supabase)
4. **Captcha Turnstile** : Protection anti-robot
5. **Vérification HIBP** : Détection mots de passe compromis
6. **Validation côté client ET serveur** : Double vérification
7. **Messages d'erreur génériques** : Pas d'information sensible exposée

### ⚠️ À ne jamais faire

- ❌ Logger les mots de passe
- ❌ Exposer les clés secrètes côté client
- ❌ Désactiver le rate limiting en production
- ❌ Stocker les mots de passe en clair
- ❌ Autoriser des mots de passe faibles

---

## 📝 Changelog

### Version actuelle

- ✅ Intégration HIBP pour vérification mots de passe compromis
- ✅ Cloudflare Turnstile pour protection anti-robot
- ✅ OAuth Google fonctionnel
- ✅ Gestion sessions avec Supabase SSR
- ✅ Protection routes avec middleware
- ✅ Dialog téléphone manquant pour OAuth

---

**Dernière mise à jour** : Janvier 2025










