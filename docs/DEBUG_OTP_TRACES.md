# Système de traçabilité OTP - Debug

## 🎯 Objectif

Tracer **chaque appel** à `signInWithOtp` pour détecter les duplications qui invalideraient les codes OTP.

## 🔍 Logs ajoutés

### 1. Côté serveur - Signup (`app/auth/actions.ts`)

Chaque appel à `signInWithOtp` lors du signup génère un **ID unique**:

```
🚀 Exemple de logs attendus:

📧 Envoi d'un OTP séparé pour la vérification...
🔍 [OTP-1735484280123-abc123] Timestamp: 2024-12-29T15:18:00.123Z
🔍 [OTP-1735484280123-abc123] Email: user@example.com
🔍 [OTP-1735484280123-abc123] User ID: 550e8400-e29b-41d4-a716-446655440000
✅ [OTP-1735484280123-abc123] OTP envoyé avec succès via signInWithOtp (847ms)
```

**Format de l'ID**: `OTP-{timestamp}-{random}`

### 2. Côté serveur - Resend (`app/auth/actions.ts`)

Chaque renvoi de code génère un **ID unique**:

```
🚀 Exemple de logs attendus:

🔄 Tentative de renvoi du code OTP pour: user@example.com
🔍 [RESEND-1735484345678-def456] Timestamp: 2024-12-29T15:19:05.678Z
✅ [RESEND-1735484345678-def456] Nouveau code OTP envoyé avec succès à: user@example.com (654ms)
```

**Format de l'ID**: `RESEND-{timestamp}-{random}`

### 3. Côté client - Signup (`app/register/page.tsx`)

```
🚀 Exemple de logs attendus:

🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup à 2024-12-29T15:18:00.000Z
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Email: user@example.com
📋 [CLIENT-SIGNUP-1735484280000-xyz789] Résultat signup: { success: true, emailSent: true }
🎯 [CLIENT-SIGNUP-1735484280000-xyz789] Affichage du modal OTP à 2024-12-29T15:18:01.123Z
🎯 [CLIENT-SIGNUP-1735484280000-xyz789] Email enregistré: user@example.com
⏱️ [CLIENT-SIGNUP-1735484280000-xyz789] Cooldown démarré à 1735484281123
```

**Format de l'ID**: `CLIENT-SIGNUP-{timestamp}-{random}`

### 4. Côté client - Resend (`app/register/page.tsx`)

```
🚀 Exemple de logs attendus:

🔄 [CLIENT-RESEND-1735484346000-uvw012] Clic sur "Renvoyer le code" à 2024-12-29T15:19:06.000Z
⏱️ [CLIENT-RESEND-1735484346000-uvw012] Temps écoulé depuis dernier envoi: 64877ms (65s)
✅ [CLIENT-RESEND-1735484346000-uvw012] Cooldown OK - Appel API en cours...
```

**Format de l'ID**: `CLIENT-RESEND-{timestamp}-{random}`

## 🐛 Détection des problèmes

### ❌ Double appel signup

Si vous voyez **deux IDs différents** avec `OTP-` dans un court laps de temps:

```
📧 Envoi d'un OTP séparé pour la vérification...
🔍 [OTP-1735484280123-abc123] Timestamp: 2024-12-29T15:18:00.123Z
✅ [OTP-1735484280123-abc123] OTP envoyé avec succès (847ms)

📧 Envoi d'un OTP séparé pour la vérification...
🔍 [OTP-1735484280456-def456] Timestamp: 2024-12-29T15:18:00.456Z  ❌ DEUXIÈME APPEL!
✅ [OTP-1735484280456-def456] OTP envoyé avec succès (654ms)
```

**Problème**: Le formulaire est soumis **deux fois** (double-clic ou re-render).

**Solution**: Le deuxième code **invalide le premier**. L'utilisateur reçoit deux emails, mais seul le dernier est valide.

### ❌ Appel resend automatique

Si vous voyez `RESEND-` juste après `OTP-` sans action utilisateur:

```
✅ [OTP-1735484280123-abc123] OTP envoyé avec succès (847ms)
🔄 [RESEND-1735484280500-def456] Tentative de renvoi... ❌ AUTOMATIQUE!
```

**Problème**: `handleResendOtp` est appelé automatiquement (useEffect mal configuré?).

### ❌ Cooldown contourné

Si vous voyez `CLIENT-RESEND-` avec un temps écoulé < 65s:

```
⏱️ [CLIENT-RESEND-1735484346000-uvw012] Temps écoulé: 30000ms (30s)
⛔ [CLIENT-RESEND-1735484346000-uvw012] Cooldown actif - 35s restants
```

**Attendu**: Le cooldown bloque l'appel côté client.

Si malgré ça vous voyez `RESEND-` côté serveur → **contournement du cooldown** (appel API direct?).

### ❌ Appels multiples clients

Si vous voyez plusieurs `CLIENT-SIGNUP-` avec des IDs différents:

```
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup...
🚀 [CLIENT-SIGNUP-1735484280100-abc123] Démarrage signup... ❌ DOUBLON!
```

**Problème**: Le composant React se re-rend et soumet le formulaire plusieurs fois.

## 📊 Scénario de test avec logs attendus

### Test 1: Inscription normale ✅

```
# CÔTÉ CLIENT
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup à 2024-12-29T15:18:00.000Z
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Email: user@example.com

# CÔTÉ SERVEUR
📧 Envoi d'un OTP séparé pour la vérification...
🔍 [OTP-1735484280123-abc123] Timestamp: 2024-12-29T15:18:00.123Z
🔍 [OTP-1735484280123-abc123] Email: user@example.com
🔍 [OTP-1735484280123-abc123] User ID: 550e8400-e29b-41d4-a716-446655440000
✅ [OTP-1735484280123-abc123] OTP envoyé avec succès via signInWithOtp (847ms)

# CÔTÉ CLIENT
📋 [CLIENT-SIGNUP-1735484280000-xyz789] Résultat signup: { success: true, emailSent: true }
🎯 [CLIENT-SIGNUP-1735484280000-xyz789] Affichage du modal OTP à 2024-12-29T15:18:01.123Z
⏱️ [CLIENT-SIGNUP-1735484280000-xyz789] Cooldown démarré à 1735484281123
```

**✅ Résultat attendu**:
- **1 seul** ID `OTP-`
- **1 seul** ID `CLIENT-SIGNUP-`
- Le code OTP reçu par email est valide

---

### Test 2: Renvoi après cooldown ✅

```
# CÔTÉ CLIENT (après 65 secondes)
🔄 [CLIENT-RESEND-1735484346000-uvw012] Clic sur "Renvoyer le code" à 2024-12-29T15:19:06.000Z
⏱️ [CLIENT-RESEND-1735484346000-uvw012] Temps écoulé depuis dernier envoi: 64877ms (65s)
✅ [CLIENT-RESEND-1735484346000-uvw012] Cooldown OK - Appel API en cours...

# CÔTÉ SERVEUR
🔄 Tentative de renvoi du code OTP pour: user@example.com
🔍 [RESEND-1735484346123-def456] Timestamp: 2024-12-29T15:19:06.123Z
✅ [RESEND-1735484346123-def456] Nouveau code OTP envoyé avec succès à: user@example.com (654ms)
```

**✅ Résultat attendu**:
- Le temps écoulé est >= 65s
- **1 seul** ID `RESEND-`
- Nouveau code reçu par email

---

### Test 3: Tentative de renvoi pendant cooldown ⛔

```
# CÔTÉ CLIENT (après seulement 30 secondes)
🔄 [CLIENT-RESEND-1735484310000-ghi345] Clic sur "Renvoyer le code" à 2024-12-29T15:18:30.000Z
⏱️ [CLIENT-RESEND-1735484310000-ghi345] Temps écoulé depuis dernier envoi: 28877ms (29s)
⛔ [CLIENT-RESEND-1735484310000-ghi345] Cooldown actif - 36s restants

# CÔTÉ SERVEUR
(rien - l'appel API est bloqué côté client)
```

**✅ Résultat attendu**:
- Toast d'erreur: "Veuillez attendre 36s avant de renvoyer le code."
- **Aucun** ID `RESEND-` côté serveur (appel bloqué)

---

### Test 4: Double submit (BUG) ❌

```
# CÔTÉ CLIENT (deux appels rapprochés)
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup à 2024-12-29T15:18:00.000Z
🚀 [CLIENT-SIGNUP-1735484280100-abc123] Démarrage signup à 2024-12-29T15:18:00.100Z ❌

# CÔTÉ SERVEUR (deux OTP envoyés)
🔍 [OTP-1735484280123-aaa111] Timestamp: 2024-12-29T15:18:00.123Z
✅ [OTP-1735484280123-aaa111] OTP envoyé avec succès (847ms)

🔍 [OTP-1735484280223-bbb222] Timestamp: 2024-12-29T15:18:00.223Z ❌
✅ [OTP-1735484280223-bbb222] OTP envoyé avec succès (654ms)
```

**❌ Problème détecté**:
- **Deux** IDs `CLIENT-SIGNUP-` différents
- **Deux** IDs `OTP-` différents
- Le deuxième code **invalide le premier**

**Solution**: Ajouter une protection contre le double-submit dans le formulaire.

## 🛠️ Utilisation du système de logs

### 1. Ouvrir la console

F12 → Console

### 2. Filtrer les logs OTP

Dans la console, tapez:
```javascript
// Filtrer uniquement les logs OTP
console.log = (function(originalLog) {
  return function(...args) {
    const message = args.join(' ');
    if (message.includes('OTP') ||
        message.includes('RESEND') ||
        message.includes('CLIENT-SIGNUP') ||
        message.includes('🔍') ||
        message.includes('✅') ||
        message.includes('⏱️')) {
      originalLog.apply(console, args);
    }
  };
})(console.log);
```

### 3. Tester l'inscription

1. Remplissez le formulaire
2. Cliquez **UNE SEULE FOIS** sur "Créer mon compte"
3. Observez les logs dans la console

### 4. Analyser les IDs

- Comptez le nombre d'IDs `OTP-` différents → **devrait être 1**
- Comptez le nombre d'IDs `CLIENT-SIGNUP-` différents → **devrait être 1**
- Vérifiez que les timestamps sont cohérents

### 5. Copier les logs

Si vous trouvez un problème:
1. Faites un clic droit dans la console
2. "Save as..." → `otp-debug-logs.txt`
3. Partagez les logs pour analyse

## 📋 Checklist de débogage

- [ ] ✅ Un seul ID `OTP-` lors du signup
- [ ] ✅ Un seul ID `CLIENT-SIGNUP-` lors du signup
- [ ] ✅ Le cooldown bloque les appels < 65s
- [ ] ✅ Un seul ID `RESEND-` lors du renvoi
- [ ] ✅ Les timestamps sont cohérents (pas de décalage > 5s)
- [ ] ✅ Aucun appel `RESEND-` sans action utilisateur

## 🎉 Validation

Si tous les points de la checklist sont OK:
- ✅ Le système OTP ne fait **qu'un seul appel** par action
- ✅ Les codes ne s'invalident **pas** entre eux
- ✅ Le cooldown **protège** contre les abus

**Le problème de codes expirés devrait être résolu!**

---

**Note**: Ces logs sont en **mode debug** et peuvent être retirés en production une fois le problème résolu.
