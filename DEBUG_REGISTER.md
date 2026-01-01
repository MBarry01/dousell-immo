# Guide de débogage - Page Register

## Comment déboguer le problème actuel

### 1. Ouvrir la console du navigateur

1. Appuyez sur **F12** dans votre navigateur
2. Allez sur l'onglet **Console**
3. Effacez la console (icône 🚫 ou Ctrl+L)

### 2. Tester l'inscription

1. Allez sur `/register`
2. Remplissez le formulaire avec:
   - Nom complet: Test User
   - Email: votre-email@example.com
   - Téléphone: +221 77 123 45 67
   - Mot de passe: test123
   - Confirmation: test123
3. Complétez le Captcha
4. Cliquez sur **Créer mon compte**

### 3. Vérifier les logs

Dans la console, vous devriez voir ces messages dans l'ordre:

```
✅ Messages attendus:
📧 Envoi d'un OTP séparé pour la vérification...
✅ OTP envoyé avec succès via signInWithOtp
📋 Résultat signup: { emailSent: true, ... }
```

Si vous voyez un message d'erreur, **copiez-le intégralement** ici.

### 4. Erreurs possibles

#### Erreur: "showEmailConfirmModal is not defined"

**Cause**: Ancien code qui n'a pas été mis à jour.

**Solution**: Le code actuel utilise `showOtpModal`, pas `showEmailConfirmModal`. Si vous voyez cette erreur, donnez-moi le numéro de ligne exact.

#### Erreur: "Cannot read property 'success' of undefined"

**Cause**: La fonction `signup()` n'a pas retourné de résultat valide.

**Solution**: Vérifiez les logs côté serveur pour voir l'erreur complète.

#### Le modal ne s'affiche pas

**Vérifications**:

1. Dans la console, tapez:
   ```javascript
   console.log("showOtpModal:", showOtpModal)
   ```

2. Vérifiez que le résultat contient `emailSent: true`:
   ```javascript
   // Dans le code de la page register, après signup
   console.log("📋 Résultat signup:", result);
   ```

3. Vérifiez que le modal Dialog est bien importé:
   ```typescript
   import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
     DialogDescription,
     DialogFooter,
   } from "@/components/ui/dialog";
   ```

### 5. État actuel du code

Le code actuel de la page register utilise:

- **État**: `const [showOtpModal, setShowOtpModal] = useState(false);` (ligne 45)
- **Déclencheur**: `setShowOtpModal(true);` après `result.emailSent` (ligne 327)
- **Modal**: `<Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>` (ligne 557)

### 6. Test rapide

Pour tester si le modal fonctionne, ajoutez temporairement dans la console:

```javascript
// Dans la console du navigateur (F12)
// Trouvez l'élément React et forcez l'état
document.querySelector('[data-state]')?.click()
```

Ou modifiez temporairement la ligne 45:

```typescript
// Avant (normal)
const [showOtpModal, setShowOtpModal] = useState(false);

// Après (test - le modal s'ouvre immédiatement)
const [showOtpModal, setShowOtpModal] = useState(true);
```

Si le modal s'affiche, le problème est dans le déclencheur (`result.emailSent`).
Si le modal ne s'affiche toujours pas, le problème est dans le composant Dialog.

---

## Informations à fournir pour correction

Pour que je corrige le problème efficacement, donnez-moi:

1. **Le message d'erreur exact** de la console (copier-coller)
2. **Le numéro de ligne** où l'erreur se produit
3. **Les logs** que vous voyez dans la console lors du test
4. **Le comportement observé** vs le comportement attendu

Exemple de rapport:

```
ERREUR:
ReferenceError: showEmailConfirmModal is not defined
  at RegisterPage (page.tsx:130)

LOGS CONSOLE:
📧 Envoi d'un OTP séparé pour la vérification...
✅ OTP envoyé avec succès via signInWithOtp
📋 Résultat signup: { emailSent: true }

COMPORTEMENT:
- Attendu: Le modal OTP s'affiche
- Observé: Erreur dans la console, rien ne se passe
```
