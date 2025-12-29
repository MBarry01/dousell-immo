# Configuration Email de Vérification Supabase

## 🎯 Problème résolu
Le lien de vérification d'email était cliqué mais la page ne changeait pas. Le flux de callback a été amélioré.

## ✅ Changements effectués

### 1. Amélioration du callback ([app/auth/callback/route.ts](../app/auth/callback/route.ts:58-77))
- **Détection intelligente** : Le callback détecte automatiquement qu'il s'agit d'une vérification d'email
- **3 méthodes de détection** :
  - Paramètre `type=signup` ou `type=email` dans l'URL
  - Email confirmé récemment (dans les 10 dernières secondes)
  - Redirection par défaut vers `/` (cas typique de confirmation)
- **Redirection** : Redirige vers `/auth/verified` au lieu de `/`

### 2. Page de succès ([app/auth/verified/page.tsx](../app/auth/verified/page.tsx))
- ✨ Belle page avec animation de succès
- ⏱️ Compte à rebours de 3 secondes avant redirection automatique
- 🎨 Design cohérent avec le thème Dousell Immo (Or #F4C430 sur fond noir)
- 🔘 Bouton pour accéder immédiatement au compte

### 3. Page d'attente ([app/auth/check-email/page.tsx](../app/auth/check-email/page.tsx))
- Page affichée après l'inscription
- Instruction claire pour vérifier l'email
- Bouton pour renvoyer l'email si besoin

## 📧 Configuration dans Supabase Dashboard

### Étape 1 : Configurer l'URL de redirection
1. Aller sur **Supabase Dashboard** → Votre projet → **Authentication** → **URL Configuration**
2. Ajouter l'URL de callback dans **Redirect URLs** :
   ```
   http://localhost:3000/auth/callback
   https://votre-domaine.com/auth/callback
   ```

### Étape 2 : Configurer le template d'email
1. Aller sur **Authentication** → **Email Templates** → **Confirm signup**
2. Remplacer le contenu par le template dans [emails/confirm-signup-template.html](../emails/confirm-signup-template.html)
3. **IMPORTANT** : Vérifier que le lien utilise bien :
   ```html
   <a href="{{ .ConfirmationURL }}">Confirmer mon inscription</a>
   ```

### Étape 3 : Vérifier la configuration SMTP (optionnel)
Si vous utilisez un serveur SMTP personnalisé (Gmail, etc.) :
1. **Authentication** → **Email Settings** → **SMTP Settings**
2. Configurer les paramètres SMTP

## 🔄 Flux complet

```
1. Utilisateur s'inscrit sur /register
   ↓
2. Supabase envoie un email avec lien de confirmation
   ↓
3. Affichage de /auth/check-email (page d'attente)
   ↓
4. Utilisateur clique sur le lien dans l'email
   ↓
5. Supabase redirige vers /auth/callback?code=...
   ↓
6. Le callback échange le code pour une session
   ↓
7. Détection automatique : "C'est une vérification d'email"
   ↓
8. Redirection vers /auth/verified (page de succès)
   ↓
9. Compte à rebours de 3s puis redirection vers /compte
```

## 🧪 Test du flux

Pour tester le flux complet :

```bash
# 1. Démarrer le serveur
npm run dev

# 2. Aller sur http://localhost:3000/register

# 3. S'inscrire avec un email valide

# 4. Vérifier l'email reçu

# 5. Cliquer sur le lien de confirmation

# 6. Vérifier que vous arrivez sur /auth/verified

# 7. Vérifier la redirection automatique vers /compte
```

## 🐛 Debugging

Si le lien ne fonctionne toujours pas, vérifier :

1. **Les logs du callback** (voir la console serveur) :
   ```
   🔍 Auth Callback Debug: { code: '✓ présent', ... }
   ✅ Session créée avec succès
   ✅ Email vérifié - redirection vers la page de succès
   ```

2. **L'URL du lien dans l'email** doit contenir :
   - `http://localhost:3000/auth/callback`
   - Paramètre `code=...` (le token de confirmation)

3. **Les cookies** :
   - Vérifier que les cookies ne sont pas bloqués
   - Vérifier que le navigateur accepte les cookies tiers si nécessaire

4. **La configuration Supabase** :
   - L'URL de callback est bien dans les Redirect URLs autorisées
   - Le template d'email utilise `{{ .ConfirmationURL }}`

## ⚠️ Notes importantes

- **Navigateurs différents** : Le lien fonctionne même si cliqué dans un autre navigateur (Chrome vs Firefox)
- **Sessions** : Une nouvelle session est créée lors de la confirmation, pas besoin d'être déjà connecté
- **Sécurité** : Le code de confirmation est à usage unique et expire après utilisation
- **Expiration** : Par défaut, le lien expire après 24h (configurable dans Supabase)
