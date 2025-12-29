# Guide de débogage rapide - Codes OTP qui expirent

## 🎯 Problème

Les codes OTP expirent immédiatement après réception.

## 🔍 Diagnostic en 3 étapes

### Étape 1: Activer les logs de débogage ✅

Les logs sont **déjà activés** dans le code. Vous n'avez rien à faire.

### Étape 2: Tester une inscription

1. Ouvrez le navigateur en **mode navigation privée** (Ctrl+Shift+N)
2. Appuyez sur **F12** pour ouvrir la console
3. Allez sur `/register`
4. Remplissez le formulaire
5. **Cliquez UNE SEULE FOIS** sur "Créer mon compte"
6. **NE PAS** rafraîchir la page
7. **NE PAS** cliquer plusieurs fois

### Étape 3: Analyser les logs

Dans la console, vous devriez voir:

#### ✅ CAS NORMAL (un seul envoi)

```
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup...
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Email: user@example.com

📧 Envoi d'un OTP séparé pour la vérification...
🔍 [OTP-1735484280123-abc123] Timestamp: 2024-12-29T15:18:00.123Z
🔍 [OTP-1735484280123-abc123] Email: user@example.com
✅ [OTP-1735484280123-abc123] OTP envoyé avec succès (847ms)

📋 [CLIENT-SIGNUP-1735484280000-xyz789] Résultat signup: { success: true, emailSent: true }
🎯 [CLIENT-SIGNUP-1735484280000-xyz789] Affichage du modal OTP...
⏱️ [CLIENT-SIGNUP-1735484280000-xyz789] Cooldown démarré à 1735484281123
```

**Ce qu'on cherche**:
- **1 seul** ID qui commence par `CLIENT-SIGNUP-`
- **1 seul** ID qui commence par `OTP-`
- Le code reçu par email fonctionne ✅

---

#### ❌ CAS PROBLÉMATIQUE (double envoi)

```
🚀 [CLIENT-SIGNUP-1735484280000-xyz789] Démarrage signup...
🚀 [CLIENT-SIGNUP-1735484280100-abc123] Démarrage signup... ❌ DEUXIÈME APPEL!

📧 Envoi d'un OTP séparé...
🔍 [OTP-1735484280123-aaa111] Timestamp: 2024-12-29T15:18:00.123Z
✅ [OTP-1735484280123-aaa111] OTP envoyé (847ms)

📧 Envoi d'un OTP séparé... ❌ DEUXIÈME ENVOI!
🔍 [OTP-1735484280223-bbb222] Timestamp: 2024-12-29T15:18:00.223Z
✅ [OTP-1735484280223-bbb222] OTP envoyé (654ms)
```

**Problème détecté**:
- **2 IDs différents** `CLIENT-SIGNUP-`
- **2 IDs différents** `OTP-`
- Le deuxième code **invalide le premier**
- L'utilisateur reçoit le premier code mais il est déjà expiré ❌

---

## 🛠️ Solutions selon le diagnostic

### Si vous voyez UN SEUL envoi ✅

Le problème ne vient **PAS** d'un double-submit.

**Actions**:
1. Vérifiez l'heure serveur vs client:
   ```javascript
   console.log("Client:", new Date().toString());
   console.log("Serveur:", new Date().toISOString());
   ```
2. Allez dans **Supabase Dashboard → Logs → Auth Logs**
3. Cherchez l'événement `auth.otp.send`
4. Vérifiez qu'il n'y en a qu'**un seul**

### Si vous voyez DEUX envois ou plus ❌

Le problème vient d'un **double-submit**.

**Causes possibles**:
1. **Double-clic** sur le bouton "Créer mon compte"
2. **Re-render React** qui soumet le formulaire plusieurs fois
3. **Rechargement de la page** qui relance le signup

**Solution immédiate**:

Le code a déjà une protection avec `isPending`:

```typescript
<Button
  type="submit"
  disabled={isPending || !captchaToken}
  // ...
>
```

Mais si le problème persiste, ajoutez un **flag de soumission**:

```typescript
// En haut du composant
const [isSubmitting, setIsSubmitting] = useState(false);

// Dans la fonction de soumission
if (isSubmitting) {
  console.log("⛔ Soumission déjà en cours - ignoré");
  return;
}

setIsSubmitting(true);
try {
  const result = await signup(formData);
  // ...
} finally {
  setIsSubmitting(false);
}
```

---

## 📊 Tests complémentaires

### Test 1: Vérifier le cooldown

1. Après l'inscription, le modal OTP s'affiche
2. Cliquez **immédiatement** sur "Renvoyer le code"
3. Vous devriez voir:

```
🔄 [CLIENT-RESEND-...] Clic sur "Renvoyer le code"...
⏱️ [CLIENT-RESEND-...] Temps écoulé: 5000ms (5s)
⛔ [CLIENT-RESEND-...] Cooldown actif - 60s restants
```

✅ **Attendu**: Toast d'erreur "Veuillez attendre 60s..."
✅ **Attendu**: Aucun appel API `RESEND-` côté serveur

### Test 2: Vérifier le renvoi après cooldown

1. Attendez **65 secondes** (le bouton affiche le compte à rebours)
2. Cliquez sur "Renvoyer le code"
3. Vous devriez voir:

```
🔄 [CLIENT-RESEND-...] Clic sur "Renvoyer le code"...
⏱️ [CLIENT-RESEND-...] Temps écoulé: 65123ms (66s)
✅ [CLIENT-RESEND-...] Cooldown OK - Appel API en cours...

🔄 Tentative de renvoi du code OTP...
🔍 [RESEND-...] Timestamp: ...
✅ [RESEND-...] Nouveau code OTP envoyé (654ms)
```

✅ **Attendu**: Toast de succès "Code renvoyé !"
✅ **Attendu**: Nouveau code reçu par email

---

## 🚨 Si le problème persiste

### Cas 1: Logs normaux mais code expiré quand même

**Hypothèse**: Problème d'horloge serveur/client

**Test**:
```javascript
// Dans la console navigateur
const now = Date.now();
console.log("Timestamp client:", now);
console.log("Date client:", new Date(now).toISOString());
```

Comparez avec le timestamp du log serveur `🔍 [OTP-...] Timestamp: ...`

Si différence > **5 minutes** → Problème d'horloge

**Solution**: Synchroniser l'heure du serveur

---

### Cas 2: Plusieurs OTP envoyés mais depuis des sources différentes

**Hypothèse**: Un autre système envoie aussi des OTP (webhook? cron?)

**Test**:
```bash
# Chercher tous les appels à signInWithOtp dans le code
grep -r "signInWithOtp" app/ --include="*.ts" --include="*.tsx"
```

**Attendu**: Seulement **2 occurrences**:
1. `app/auth/actions.ts` ligne ~123 (signup)
2. `app/auth/actions.ts` ligne ~509 (resend)

---

### Cas 3: Le code fonctionne mais arrive en retard

**Hypothèse**: L'email met > 1 heure à arriver (les codes expirent après 1h)

**Test**: Vérifiez l'heure de réception de l'email

Si > **1 heure** après l'envoi → Problème SMTP

**Solution**: Configurez un SMTP rapide (Gmail, SendGrid)

---

## 📝 Rapport de bug

Si le problème persiste après tous ces tests, créez un rapport avec:

```
1. Logs complets de la console (copier-coller)
2. Nombre d'IDs CLIENT-SIGNUP: ___
3. Nombre d'IDs OTP: ___
4. Temps entre les envois (si multiple): ___ ms
5. Heure client: ___
6. Heure serveur (depuis logs): ___
7. Différence d'horloge: ___ minutes
8. Temps de réception email: ___ secondes
9. Le code fonctionne si utilisé immédiatement?: Oui / Non
```

---

## ✅ Checklist finale

Avant de conclure que c'est un bug:

- [ ] ✅ Testé en navigation privée (pas de cache)
- [ ] ✅ Cliqué UNE SEULE FOIS sur "Créer mon compte"
- [ ] ✅ Vérifié qu'il n'y a qu'UN SEUL ID `OTP-`
- [ ] ✅ Vérifié qu'il n'y a qu'UN SEUL ID `CLIENT-SIGNUP-`
- [ ] ✅ Vérifié la différence d'horloge client/serveur (< 5 min)
- [ ] ✅ Testé le code immédiatement après réception
- [ ] ✅ Vérifié que l'email arrive en < 5 minutes

---

**Documentation complète**: [DEBUG_OTP_TRACES.md](./DEBUG_OTP_TRACES.md)
