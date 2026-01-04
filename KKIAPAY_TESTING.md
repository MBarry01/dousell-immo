# Guide de Test KKiaPay - Doussel Immo

## 🧪 Tests en Sandbox (Mode Test)

### Prérequis

1. ✅ Variables d'environnement configurées dans `.env.local`
2. ✅ TypeScript compile sans erreur (`npx tsc --noEmit`)
3. ✅ Serveur de développement démarré (`npm run dev`)

---

## Test 1 : Paiement de Loyer Complet

### Étapes

1. **Accéder au portail locataire**
   ```
   URL: http://localhost:3000/portal
   ```

2. **Se connecter avec un email de locataire existant**
   - Vérifier dans Supabase : table `leases`, colonne `tenant_email`
   - Exemple : `amadou.diallo@example.com`

3. **Vérifier l'affichage**
   - ✅ Informations du locataire affichées (nom, adresse)
   - ✅ Dates de bail visibles
   - ✅ Montant mensuel pré-rempli
   - ✅ Texte "Paiement sécurisé via KKiaPay" (au lieu de PayDunya)

4. **Cliquer sur "Payer maintenant"**
   - ✅ Modal s'ouvre avec design "Luxe & Teranga" (or #F4C430)
   - ✅ Récapitulatif du paiement affiché
   - ✅ Bouton "Payer XXX FCFA" apparaît

5. **Cliquer sur le bouton de paiement**
   - ✅ Modal KKiaPay s'ouvre (popup sur place, PAS de redirection)
   - ✅ Options visibles : Wave Sénégal, Orange Money Sénégal
   - ✅ Champ numéro de téléphone visible

6. **Saisir les informations de test**
   - **Numéro de test** : Vérifier dans la doc KKiaPay ou utiliser `+221770000000`
   - **Code OTP** : `123456` (ou celui fourni par KKiaPay en sandbox)

7. **Valider le paiement**
   - ✅ Toast "Paiement validé avec succès !" apparaît
   - ✅ Modal se ferme
   - ✅ Page se rafraîchit automatiquement

8. **Vérifier les logs serveur**
   ```
   ✅ Transaction KKiaPay validée: { transactionId: 'xxx', amount: 150000, status: 'SUCCESS' }
   ✅ Loyer payé via KKiaPay: Bail xxxx-xxxx-xxxx
   ✅ Cache invalidé: tenant_dashboard:email@example.com
   ✅ Email envoyé: Reçu de paiement - Loyer 1/2026
   ```

9. **Vérifier dans Supabase**
   - Table `rental_transactions`
   - Chercher la transaction pour le bail et la période
   - ✅ `status = 'paid'`
   - ✅ `payment_ref = 'kkiapay_txn_xxx'`
   - ✅ `payment_method = 'kkiapay'`
   - ✅ `paid_at` renseigné

10. **Vérifier les emails**
    - ✅ Email reçu par le locataire
    - ✅ Email reçu par le propriétaire (si configuré)

---

## Test 2 : Paiement Annulé

### Étapes

1. Suivre les étapes 1-5 du Test 1
2. Dans la modal KKiaPay, **fermer la fenêtre** ou cliquer sur "Annuler"
3. **Vérifier** :
   - ⚠️ Aucun paiement créé dans Supabase
   - ⚠️ Aucun email envoyé

---

## Test 3 : Paiement Échoué (Fonds Insuffisants)

### Étapes

1. Suivre les étapes 1-5 du Test 1
2. Utiliser un numéro de test avec solde insuffisant (si fourni par KKiaPay)
3. **Vérifier** :
   - ❌ Toast d'erreur affiché
   - ⚠️ Transaction non créée dans Supabase

---

## Test 4 : Vérification du Widget SDK

### Vérifier le chargement du script

1. Ouvrir DevTools (F12) → **Console**
2. Chercher le message : `✅ KKiaPay SDK chargé`
3. Si absent, vérifier :
   - Aucune erreur de chargement de `https://cdn.kkiapay.me/k.js`
   - Aucun blocage par AdBlock ou pare-feu

### Vérifier les événements

1. Dans DevTools → **Console**, observer les logs :
   ```
   ✅ Paiement KKiaPay réussi: kkiapay_txn_xxx
   ```

2. Vérifier l'appel à `/api/kkiapay/confirm` :
   - DevTools → **Network** → Chercher `confirm`
   - Status Code : `200`
   - Response : `{ "success": true, "transactionId": "xxx" }`

---

## Test 5 : Webhook (Optionnel, requiert Ngrok)

### Setup Ngrok

1. **Installer Ngrok** : https://ngrok.com/download

2. **Lancer Ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Copier l'URL** (ex: `https://abc123.ngrok-free.app`)

4. **Configurer dans KKiaPay Dashboard**
   - Aller dans Settings → Webhooks
   - URL : `https://abc123.ngrok-free.app/api/kkiapay/webhook`
   - Sauvegarder

5. **Effectuer un paiement** (Test 1)

6. **Vérifier les logs**
   ```
   ✅ Webhook KKiaPay validé: { transactionId: 'xxx', status: 'SUCCESS' }
   ✅ Loyer payé via KKiaPay webhook: Bail xxxx-xxxx-xxxx
   ```

---

## 🔍 Débogage

### Problème : Modal KKiaPay ne s'ouvre pas

**Causes possibles** :
1. Script KKiaPay bloqué par AdBlock
2. Clé publique incorrecte dans `.env.local`
3. Mode sandbox mal configuré

**Solution** :
```bash
# Vérifier la console pour les erreurs
# Tester manuellement le chargement du script
curl https://cdn.kkiapay.me/k.js
```

---

### Problème : "Transaction non confirmée"

**Causes possibles** :
1. Numéro de test incorrect
2. Transaction KKiaPay échouée côté serveur
3. API KKiaPay indisponible

**Solution** :
```bash
# Vérifier les logs serveur
# Tester l'API KKiaPay manuellement
curl -X GET https://api.kkiapay.me/api/v1/transactions/kkiapay_txn_xxx \
  -H "x-api-key: tpk_xxxxxx"
```

---

### Problème : Emails non reçus

**Causes possibles** :
1. Configuration Gmail/Supabase incorrecte
2. Email bloqué par anti-spam
3. Erreur dans `sendEmail()`

**Solution** :
```bash
# Tester l'envoi d'email indépendamment
npm run test:email
```

---

## ✅ Checklist de Validation

Avant de passer en production, s'assurer que :

- [ ] ✅ Test 1 (Paiement réussi) passe
- [ ] ✅ Transaction créée dans Supabase avec `payment_method = 'kkiapay'`
- [ ] ✅ Emails envoyés (locataire + propriétaire)
- [ ] ✅ Cache invalidé (vérifier logs Redis)
- [ ] ✅ Aucune erreur TypeScript (`npx tsc --noEmit`)
- [ ] ✅ Design "Luxe & Teranga" respecté (or #F4C430)
- [ ] ✅ Responsive mobile (tester sur smartphone)
- [ ] ✅ Logs serveur propres (pas d'erreurs 500)

---

## 🚀 Passage en Production

Une fois tous les tests validés en sandbox :

1. **Récupérer les clés Production** depuis KKiaPay Dashboard
2. **Mettre à jour `.env.production`**
   ```env
   KKIAPAY_MODE=production
   NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=pk_prod_xxxxxxxxx
   KKIAPAY_PRIVATE_KEY=sk_prod_xxxxxxxxx
   KKIAPAY_SECRET=secret_prod_xxxxxxxxx
   ```
3. **Déployer sur Vercel**
4. **Tester avec un paiement réel de 100 FCFA**
5. **Monitorer les logs Vercel** pendant 24h

---

**Date** : 2 Janvier 2026
**Statut** : ✅ Prêt pour tests Sandbox
