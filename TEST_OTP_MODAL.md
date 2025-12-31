# Test du Modal OTP - Instructions

## Problème potentiel

Le modal OTP ne s'affiche peut-être pas après l'inscription.

## Solution de test rapide

### Option 1: Forcer l'affichage du modal (test)

Modifiez temporairement la ligne 45 de `app/register/page.tsx`:

```typescript
// AVANT
const [showOtpModal, setShowOtpModal] = useState(false);

// APRÈS (temporaire pour test)
const [showOtpModal, setShowOtpModal] = useState(true);
const [registeredEmail, setRegisteredEmail] = useState<string>("test@example.com");
```

Rafraîchissez la page `/register`. Le modal devrait s'afficher immédiatement.

**Si le modal s'affiche**: Le problème est dans le déclencheur (ligne 355)
**Si le modal ne s'affiche pas**: Le problème est dans le composant Dialog

### Option 2: Vérifier que signup retourne bien emailSent

Ajoutez un log plus explicite après le signup. Modifiez la ligne 312:

```typescript
// AVANT
console.log("📋 Résultat signup:", result);

// APRÈS
console.log("📋 Résultat signup:", result);
console.log("🔍 emailSent?", result?.emailSent);
console.log("🔍 Type de result:", typeof result);
console.log("🔍 Clés de result:", result ? Object.keys(result) : "null");
```

Testez l'inscription et regardez les logs. Vous devriez voir:

```
📋 Résultat signup: { success: true, emailSent: true }
🔍 emailSent? true
🔍 Type de result: object
🔍 Clés de result: ["success", "emailSent"]
```

Si `emailSent` est `false` ou `undefined`, le problème est côté serveur (dans `signup()`).

### Option 3: Vérifier la fonction signup

Ouvrez `app/auth/actions.ts` et vérifiez la ligne ~130 (après signInWithOtp):

```typescript
return {
  success: true,
  emailSent: true, // ← Cette ligne doit être présente
  message: "Vérifiez votre email pour le code de confirmation.",
};
```

### Option 4: Ajouter un log dans le if

Modifiez la ligne 348-355:

```typescript
else if (result.emailSent) {
  console.log("🎯 DÉCLENCHEMENT DU MODAL OTP");
  // Afficher le modal OTP
  setError(null);
  setSuccessMessage(null);
  setRegisteredEmail(formData.get("email") as string);
  setOtpValue("");
  setOtpError(null);
  setShowOtpModal(true);
  console.log("🎯 showOtpModal devrait être true maintenant");

  toast.success("Code envoyé !", {
    description: "Vérifiez votre email pour obtenir le code à 6 chiffres.",
    duration: 5000,
  });
}
```

Si vous voyez `🎯 DÉCLENCHEMENT DU MODAL OTP` dans les logs mais pas le modal, c'est un problème de rendu React.

---

## Résumé des tests

Faites ces tests dans l'ordre et donnez-moi les résultats:

1. ✅ Test 1: Modal s'affiche avec `useState(true)` ?
2. ✅ Test 2: `emailSent` est bien `true` dans les logs ?
3. ✅ Test 3: Le `console.log("🎯 DÉCLENCHEMENT DU MODAL OTP")` s'affiche ?
4. ✅ Test 4: Le composant `Dialog` est bien importé ?

Une fois que vous avez fait ces tests, donnez-moi les résultats et je vous dirai exactement où est le problème et comment le corriger.
