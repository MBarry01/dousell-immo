# 🔧 Correction du Workflow de Paiement - Dépôt d'Annonce

## 🐛 Problème identifié

Lors du retour après paiement PayDunya, l'utilisateur était redirigé vers l'étape précédente (étape 2) au lieu de rester à l'étape 3 (Finalisation).

### Cause racine

**Conflit entre deux `useEffect`** qui géraient le retour après paiement :

1. **Premier `useEffect`** (lignes 183-246) : Restaurait les données du formulaire
   - Vérifiait `isReturningFromPayment` basé sur `searchParams?.get("payment")`
   - Si `payment` n'était pas dans l'URL → remettait l'étape à 1
   - S'exécutait AVANT le deuxième useEffect

2. **Deuxième `useEffect`** (lignes 273-373) : Gestion du retour après paiement
   - Détectait `payment=success` dans l'URL
   - Vérifiait le paiement et mettait l'étape à 3
   - **MAIS** appelait `clearPaymentQuery()` qui supprimait le paramètre `payment` de l'URL
   - Une fois supprimé, le premier useEffect voyait `isReturningFromPayment = false` et remettait l'étape à 1

### Ordre d'exécution problématique

```
1. Utilisateur revient avec ?payment=success
2. Premier useEffect s'exécute → voit payment=success → ne fait rien (return)
3. Deuxième useEffect s'exécute → met step à 3 → vérifie paiement → clearPaymentQuery()
4. URL devient /compte/deposer (sans ?payment=success)
5. Premier useEffect se réexécute (car searchParams a changé) → voit pas de payment → setStep(1) ❌
```

---

## ✅ Solution appliquée

### 1. **Séparation des responsabilités**

- **Premier `useEffect`** : Gère UNIQUEMENT la restauration des données du formulaire
  - Ne gère PAS le retour après paiement
  - Si `payment=success` est détecté → return immédiat (laisse le deuxième gérer)
  - Sinon → restaure les données et l'étape sauvegardée

- **Deuxième `useEffect`** : Gère TOUT le workflow de retour après paiement
  - Détecte `payment=success` ou `payment=canceled`
  - Restaure les données du formulaire
  - Force l'étape à 3 immédiatement
  - Vérifie le paiement
  - Supprime le paramètre `payment` avec un délai de 2 secondes (pour éviter les conflits)

### 2. **Modifications clés**

#### Premier useEffect (restauration des données)
```typescript
// Si on revient d'un paiement, on laisse le useEffect suivant gérer TOUT
const paymentStatus = searchParams?.get("payment");
if (paymentStatus === "success" || paymentStatus === "canceled") {
  return; // Le useEffect suivant va gérer le retour après paiement
}
```

#### Deuxième useEffect (gestion du paiement)
```typescript
// FORCER L'ÉTAPE 3 IMMÉDIATEMENT et restaurer les données
setStep(3);
localStorage.setItem("deposit_form_step", "3");

// Restaurer les données du formulaire immédiatement
// ... restauration des données ...

// Après vérification du paiement
setStep(3); // Forcer une dernière fois pour être sûr

// Supprimer le paramètre payment avec un délai pour éviter les conflits
setTimeout(() => {
  clearPaymentQuery();
}, 2000);
```

### 3. **Gestion du cas "canceled"**

Si l'utilisateur annule le paiement :
- Rester à l'étape 3 (pour permettre de réessayer)
- Nettoyer le token de paiement
- Afficher un message d'erreur

---

## 📊 Workflow corrigé

### Scénario 1 : Nouveau formulaire
```
1. Utilisateur clique sur "Déposer une annonce"
2. Premier useEffect → setStep(1) ✅
3. Utilisateur remplit l'étape 1 → passe à l'étape 2
4. Utilisateur choisit "Diffusion Simple" → passe à l'étape 3
5. Utilisateur clique sur "Payer avec PayDunya"
6. Redirection vers PayDunya
```

### Scénario 2 : Retour après paiement réussi
```
1. PayDunya redirige vers /compte/deposer?payment=success
2. Premier useEffect → détecte payment=success → return (ne fait rien)
3. Deuxième useEffect → détecte payment=success
   → setStep(3) immédiatement ✅
   → Restaure les données du formulaire
   → Vérifie le paiement
   → setStep(3) une dernière fois ✅
   → Supprime ?payment=success après 2 secondes
4. Utilisateur reste à l'étape 3 ✅
5. Utilisateur clique sur "Confirmer le dépôt"
```

### Scénario 3 : Retour après paiement annulé
```
1. PayDunya redirige vers /compte/deposer?payment=canceled
2. Premier useEffect → détecte payment=canceled → return
3. Deuxième useEffect → détecte payment=canceled
   → setStep(3) (rester à l'étape 3 pour réessayer) ✅
   → Nettoie le token
   → Affiche message d'erreur
   → Supprime ?payment=canceled
```

---

## 🔍 Points de vigilance

### 1. **Délai de suppression du paramètre `payment`**
- Délai de 2 secondes avant de supprimer `?payment=success`
- Permet au deuxième useEffect de terminer son travail
- Évite que le premier useEffect ne se réexécute trop tôt

### 2. **Double appel de `setStep(3)`**
- Une fois immédiatement au retour
- Une fois après vérification du paiement
- Garantit que l'étape reste à 3 même si un autre useEffect interfère

### 3. **Restauration des données**
- Les données sont restaurées dans le deuxième useEffect (pas le premier)
- Évite les conflits de timing

---

## 🧪 Tests à effectuer

1. ✅ Nouveau formulaire → démarre à l'étape 1
2. ✅ Retour après paiement réussi → reste à l'étape 3
3. ✅ Retour après paiement annulé → reste à l'étape 3 (pour réessayer)
4. ✅ Refresh de page après paiement confirmé → reste à l'étape 3
5. ✅ Navigation vers une autre page puis retour → démarre à l'étape 1 (nouveau formulaire)

---

## 📝 Fichiers modifiés

- `app/compte/deposer/page.tsx` : Correction des deux useEffect pour éviter les conflits

---

**Date de correction :** 28 novembre 2025










