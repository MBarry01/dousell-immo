# Guide de test complet - Système OTP

## 🎯 Objectif

Tester le système OTP avec toutes les corrections appliquées:
1. Cooldown de 65 secondes
2. Compte à rebours visuel
3. Gestion des codes expirés
4. Protection contre les appels multiples

## 📋 Prérequis

### 1. Nettoyer les utilisateurs de test

```bash
# Via Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Authentication → Users
4. Supprimez tous les utilisateurs non confirmés (email_confirmed_at = null)
5. Attendez 5 minutes (rate limiting)
```

### 2. Vérifier la configuration Supabase

- ✅ Authentication → Providers → Email : **Enable email provider = ON**
- ✅ Authentication → Providers → Email : **Confirm email = ON**
- ✅ Template "Magic Link" configuré avec code à 6 chiffres

### 3. Lancer le serveur de développement

```bash
npm run dev
```

## 🧪 Scénarios de test

### Test 1: Inscription et réception du code ✅

**Objectif**: Vérifier que le code OTP est bien envoyé

**Étapes**:
1. Ouvrez `/register` dans votre navigateur
2. Ouvrez la console (F12) → onglet Console
3. Remplissez le formulaire:
   - Nom complet: Test User
   - Email: **votre-email@example.com** (utilisez un vrai email que vous pouvez consulter)
   - Téléphone: +221 77 123 45 67
   - Mot de passe: test123456
   - Confirmation: test123456
4. Complétez le Captcha Cloudflare
5. Cliquez sur **"Créer mon compte"**

**Résultats attendus**:

✅ **Dans la console**:
```
📧 Envoi d'un OTP séparé pour la vérification...
✅ OTP envoyé avec succès via signInWithOtp
📋 Résultat signup: { success: true, emailSent: true, ... }
```

✅ **À l'écran**:
- Modal OTP s'affiche immédiatement
- Toast de succès: "Code envoyé !"
- Message: "Un code à 6 chiffres a été envoyé à votre-email@example.com"

✅ **Dans votre email**:
- Email reçu en moins de 2 minutes
- Code à 6 chiffres bien visible (format : `123 456`)

---

### Test 2: Cooldown immédiat ✅

**Objectif**: Vérifier que le cooldown empêche les clics rapides

**Étapes**:
1. Juste après l'inscription (Test 1), le modal OTP est ouvert
2. **Immédiatement**, cliquez sur "Renvoyer le code"

**Résultats attendus**:

✅ **À l'écran**:
- Toast d'erreur: "Veuillez attendre Xs avant de renvoyer le code"
- Le bouton est **désactivé** (grisé)
- Le bouton affiche: **"Renvoyer (65s)"** puis **"Renvoyer (64s)"**, etc.

✅ **Dans la console**:
- Pas de nouveau log `📧 Envoi d'un OTP`
- Pas d'appel API à Supabase

✅ **Comportement**:
- Le compte à rebours diminue de 1 seconde à chaque fois
- Le bouton reste désactivé pendant tout le cooldown

---

### Test 3: Compte à rebours en temps réel ✅

**Objectif**: Vérifier que le compte à rebours se met à jour correctement

**Étapes**:
1. Laissez le modal OTP ouvert
2. Observez le bouton "Renvoyer"

**Résultats attendus**:

✅ **Affichage**:
- **Secondes 0-65**: "Renvoyer (65s)", "Renvoyer (64s)", ..., "Renvoyer (1s)"
- **Seconde 66+**: "Renvoyer le code" (bouton actif, couleur normale)

✅ **Comportement**:
- Le compte à rebours diminue **chaque seconde**
- Pas de saut ou de freeze
- Le bouton devient cliquable immédiatement après 0s

---

### Test 4: Renvoi après cooldown ✅

**Objectif**: Vérifier qu'on peut renvoyer le code après le cooldown

**Étapes**:
1. Attendez que le cooldown soit terminé (65 secondes)
2. Vérifiez que le bouton affiche "Renvoyer le code"
3. Cliquez sur "Renvoyer le code"

**Résultats attendus**:

✅ **Dans la console**:
```
🔄 Tentative de renvoi du code OTP pour: votre-email@example.com
✅ Nouveau code OTP envoyé avec succès à: votre-email@example.com
```

✅ **À l'écran**:
- Toast de succès: "Code renvoyé !"
- Le champ OTP se vide automatiquement
- Le bouton repasse immédiatement à "Renvoyer (65s)"
- Nouveau cooldown de 65s démarre

✅ **Dans votre email**:
- Nouveau code reçu
- Le code est **différent** du précédent

---

### Test 5: Vérification avec code valide ✅

**Objectif**: Vérifier que le code OTP fonctionne

**Étapes**:
1. Consultez votre email (dernier code reçu)
2. Entrez le code à 6 chiffres dans le modal OTP
3. Le code est automatiquement vérifié (pas besoin de cliquer)

**Résultats attendus**:

✅ **Dans la console**:
```
✅ Code OTP vérifié avec succès
```

✅ **À l'écran**:
- Toast de succès: "Email vérifié ! Vous êtes maintenant connecté. Bienvenue !"
- Le modal OTP se ferme automatiquement
- Redirection vers `/` (page d'accueil)

✅ **Dans Supabase Dashboard**:
- Authentication → Users
- Votre utilisateur apparaît avec `email_confirmed_at` rempli
- Statut: ✅ Confirmé

---

### Test 6: Code expiré ✅

**Objectif**: Vérifier la gestion des codes expirés

**Étapes**:
1. Créez un nouveau compte (ou attendez 1 heure)
2. Entrez un **ancien code** (du Test 1) dans le modal OTP

**Résultats attendus**:

✅ **À l'écran**:
- Message d'erreur sous le champ OTP: "Le code a expiré. Demandez un nouveau code en cliquant sur Renvoyer."
- Toast d'erreur: "Code expiré - Cliquez sur 'Renvoyer le code' pour en obtenir un nouveau."
- Le champ OTP se vide automatiquement

✅ **Comportement**:
- Le modal reste ouvert
- L'utilisateur peut cliquer sur "Renvoyer le code" (après le cooldown)

---

### Test 7: Code invalide ✅

**Objectif**: Vérifier la gestion des codes incorrects

**Étapes**:
1. Entrez un code aléatoire: `999999`

**Résultats attendus**:

✅ **À l'écran**:
- Message d'erreur: "Code incorrect. Vérifiez le code reçu par email."
- Toast d'erreur
- Le champ OTP se vide automatiquement

---

### Test 8: Tentatives multiples rapides (Rate Limiting) ⚠️

**Objectif**: Vérifier que le système gère le rate limiting Supabase

**Étapes** (pour tester le rate limit API):
1. Ouvrez la console navigateur
2. Exécutez ce code pour forcer les appels malgré le cooldown:
```javascript
// HACK pour test uniquement - contourne le cooldown client
fetch('/api/auth/resend-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'votre-email@example.com' })
})
```
3. Exécutez cette commande **4 fois** rapidement

**Résultats attendus**:

✅ **À l'écran** (après 3-4 tentatives):
- Toast d'erreur: "Trop de demandes - Veuillez attendre 65 secondes avant de réessayer."

✅ **Dans la console**:
- Erreur API: `over_email_send_rate_limit` ou code `429`

---

## 📊 Checklist complète

Cochez chaque test après validation:

### Tests fonctionnels
- [ ] ✅ Test 1: Code OTP bien reçu par email
- [ ] ✅ Test 2: Cooldown empêche les clics rapides
- [ ] ✅ Test 3: Compte à rebours se met à jour en temps réel
- [ ] ✅ Test 4: Renvoi fonctionne après le cooldown
- [ ] ✅ Test 5: Code valide connecte l'utilisateur
- [ ] ✅ Test 6: Code expiré affiche message clair
- [ ] ✅ Test 7: Code invalide affiche erreur
- [ ] ✅ Test 8: Rate limiting géré correctement

### Tests UX
- [ ] ✅ Modal OTP s'affiche immédiatement après inscription
- [ ] ✅ Focus automatique sur le premier champ OTP
- [ ] ✅ Copier-coller d'un code fonctionne
- [ ] ✅ Navigation avec flèches fonctionne
- [ ] ✅ Backspace efface et revient au champ précédent
- [ ] ✅ Messages d'erreur clairs et en français
- [ ] ✅ Bouton désactivé pendant cooldown

### Tests de sécurité
- [ ] ✅ Impossible d'envoyer plusieurs codes rapidement
- [ ] ✅ Codes expirés sont rejetés
- [ ] ✅ Codes invalides sont rejetés
- [ ] ✅ Rate limiting respecté

## 🐛 Problèmes connus et solutions

### Le code expire immédiatement

**Cause**: Plusieurs appels à `signInWithOtp` invalidant les codes précédents

**Solution**: ✅ Corrigé avec le cooldown de 65 secondes

### Le bouton reste désactivé après 65 secondes

**Cause**: Le `useEffect` ne se déclenche pas

**Solution**: Vérifiez que vous avez bien la correction:
```typescript
const [, setTick] = useState(0);

useEffect(() => {
  if (cooldownRemainingMs > 0) {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }
}, [cooldownRemainingMs > 0]);
```

### Le compte à rebours ne se met pas à jour

**Cause**: Manque de re-render

**Solution**: Vérifiez que le `setTick` est bien appelé dans le `useEffect`

### Erreur "over_email_send_rate_limit"

**Cause**: Trop de tentatives malgré le cooldown

**Solution**: ✅ Géré avec messages d'erreur clairs

## 📝 Rapport de test

Après avoir effectué tous les tests, remplissez ce rapport:

```
Date du test: _____________
Navigateur: _____________
Version de l'app: _____________

Tests réussis: __ / 8
Tests échoués: __

Problèmes rencontrés:
-
-

Notes additionnelles:
-
-
```

## 🎉 Validation finale

Si tous les tests passent:
1. ✅ Le système OTP est fonctionnel
2. ✅ Le cooldown empêche les abus
3. ✅ L'UX est claire et intuitive
4. ✅ Les erreurs sont bien gérées

**Le système est prêt pour la production!** 🚀

---

**Documentation associée**:
- [COOLDOWN_OTP_FIX.md](./COOLDOWN_OTP_FIX.md) - Détails de la correction
- [CHANGEMENTS_OTP_FIX.md](./CHANGEMENTS_OTP_FIX.md) - Historique des changements
- [SOLUTION_OTP_SIGNWITHOTP.md](./SOLUTION_OTP_SIGNWITHOTP.md) - Solution technique
