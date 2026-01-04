# Configuration du Webhook KKiaPay - Guide Pas à Pas

## ✅ État Actuel du Setup

- ✅ **Next.js** lancé sur `http://localhost:3000`
- ✅ **Ngrok** exposant le webhook sur `https://1c77592afb3d.ngrok-free.app`
- ✅ **`.env.local`** mis à jour avec l'URL Ngrok
- ⏳ **Dashboard KKiaPay** à configurer (suivre les étapes ci-dessous)

---

## 📋 Étape-par-Étape : Configuration Dashboard KKiaPay

### Étape 1 : Accéder au Dashboard KKiaPay

1. **Aller sur** : https://kkiapay.me/dashboard
2. **Se connecter** avec ton compte (celui où tu as les clés sandbox)

---

### Étape 2 : Naviguer vers les Webhooks

1. Dans le menu latéral gauche, chercher **"Settings"** ou **"Paramètres"**
2. Cliquer sur **"Webhooks"** ou **"API Settings"**

*(Si tu ne trouves pas, cherche "Developer Settings" ou "API & Webhooks")*

---

### Étape 3 : Configurer l'URL du Webhook

1. **Chercher le champ** : "Webhook URL" ou "Callback URL"

2. **Coller cette URL exacte** :
   ```
   https://1c77592afb3d.ngrok-free.app/api/kkiapay/webhook
   ```

3. **Important** : Vérifier que l'URL :
   - ✅ Commence par `https://` (pas `http://`)
   - ✅ Se termine par `/api/kkiapay/webhook`
   - ✅ Ne contient pas d'espaces ou de caractères spéciaux

4. **Sauvegarder** la configuration

---

### Étape 4 : Vérifier la Configuration

Certains dashboards KKiaPay permettent de **tester le webhook** :

1. Chercher un bouton **"Test Webhook"** ou **"Send Test"**
2. Si disponible, cliquer dessus
3. **Vérifier dans les logs Next.js** (dans ton terminal) :
   ```
   ✅ Webhook KKiaPay validé: { transactionId: 'test', status: 'SUCCESS' }
   ```

Si ce message apparaît, le webhook fonctionne ! ✅

---

## 🧪 Test Complet du Flow de Paiement

Maintenant que tout est configuré, testons un paiement complet :

### Préparation

1. **Vérifier que les serveurs tournent** :
   - Next.js : `http://localhost:3000`
   - Ngrok : `https://1c77592afb3d.ngrok-free.app`

2. **Ouvrir 2 fenêtres de terminal** pour surveiller les logs :
   - **Terminal 1** : Logs Next.js (déjà ouvert)
   - **Terminal 2** : Ngrok Web Interface → `http://127.0.0.1:4040`

---

### Test 1 : Accès au Portail Locataire

1. **Ouvrir le navigateur** : `http://localhost:3000/portal`

2. **Se connecter** avec un email de locataire :
   - Vérifier dans Supabase : table `leases`, colonne `tenant_email`
   - Exemple : `amadou.diallo@example.com`

3. **Vérifier l'affichage** :
   - ✅ Nom du locataire affiché
   - ✅ Adresse du bien affichée
   - ✅ Montant mensuel pré-rempli
   - ✅ Texte **"Paiement sécurisé via KKiaPay"** (pas PayDunya)

---

### Test 2 : Lancer un Paiement

1. **Cliquer sur "Payer maintenant"**
   - ✅ Modal s'ouvre avec design or (#F4C430)
   - ✅ Récapitulatif affiché

2. **Cliquer sur le bouton de paiement**
   - ✅ Modal KKiaPay s'ouvre (popup, pas de redirection)
   - ✅ Options : Wave Sénégal, Orange Money

3. **Saisir les infos de test** :
   - **Numéro** : `+221770000000` (ou le numéro fourni par KKiaPay)
   - **Code OTP** : `123456` (ou celui envoyé par SMS)

4. **Valider**

---

### Test 3 : Vérifier les Logs

**Dans le Terminal Next.js**, tu devrais voir :

```
🔍 Vérification transaction KKiaPay: kkiapay_txn_abc123
✅ Transaction KKiaPay validée: { transactionId: 'xxx', amount: 150000, status: 'SUCCESS' }
✅ Loyer payé via KKiaPay: Bail xxxx-xxxx-xxxx
✅ Cache invalidé: tenant_dashboard:email@example.com
✅ Email envoyé: Reçu de paiement - Loyer 1/2026
```

**Dans Ngrok Web Interface** (`http://127.0.0.1:4040`) :

1. Aller dans l'onglet **"Requests"**
2. Chercher une requête `POST /api/kkiapay/webhook`
3. **Vérifier** :
   - Status Code : `200 OK`
   - Request Body : Contient `transactionId`, `status: "SUCCESS"`
   - Response : `{ "success": true }`

---

### Test 4 : Vérifier dans Supabase

1. **Aller dans Supabase** → Table `rental_transactions`

2. **Chercher la transaction** :
   - Filtrer par `lease_id` (celui du bail testé)
   - Vérifier que `status = 'paid'`
   - Vérifier que `payment_ref` contient `kkiapay_txn_xxx`
   - Vérifier que `payment_method = 'kkiapay'`
   - Vérifier que `paid_at` est renseigné

---

## 🔍 Debugging en Temps Réel

### Ngrok Web Interface

**URL** : `http://127.0.0.1:4040`

**Fonctionnalités** :
- 📊 Voir toutes les requêtes entrantes
- 🔍 Inspecter les headers, body, response
- 🔄 Rejouer une requête (utile pour tester)
- 📋 Copier les requêtes en cURL

**Exemple d'utilisation** :
1. Effectuer un paiement
2. Aller dans Ngrok → "Requests"
3. Cliquer sur `POST /api/kkiapay/webhook`
4. Vérifier le `Request Body` :
   ```json
   {
     "transactionId": "kkiapay_txn_abc123",
     "amount": 150000,
     "status": "SUCCESS",
     "metadata": {
       "type": "rent",
       "lease_id": "xxxx-xxxx-xxxx",
       "period_month": 1,
       "period_year": 2026
     }
   }
   ```

---

## ⚠️ Troubleshooting

### Problème : Webhook ne reçoit rien

**Causes possibles** :
1. URL mal configurée dans KKiaPay
2. Ngrok non démarré ou crash
3. Firewall bloquant Ngrok

**Solution** :
```bash
# Vérifier que Ngrok tourne
curl https://1c77592afb3d.ngrok-free.app/api/kkiapay/webhook

# Devrait retourner : Method Not Allowed (normal en GET)
```

---

### Problème : Erreur 401 "Signature invalide"

**Cause** : Le secret KKiaPay ne correspond pas.

**Solution** :
1. Vérifier dans `.env.local` :
   ```
   KKIAPAY_SECRET=tsk_595c5601e7f611f0837fadc53c00280f
   ```
2. Redémarrer Next.js pour recharger les variables

---

### Problème : Ngrok change d'URL à chaque redémarrage

**Cause** : Version gratuite de Ngrok génère une nouvelle URL aléatoire.

**Solutions** :
1. **Option A** : Mettre à jour `.env.local` et KKiaPay dashboard à chaque redémarrage
2. **Option B** : Upgrader vers Ngrok Pro pour avoir une URL fixe
3. **Option C** : Utiliser `ngrok http --domain=VOTRE_DOMAINE.ngrok-free.app 3000` (si domaine réservé)

---

## 📊 Métriques de Succès

Après un paiement réussi, tu devrais avoir :

- ✅ Toast "Paiement validé avec succès !" dans le navigateur
- ✅ Log `✅ Transaction KKiaPay validée` dans Next.js
- ✅ Requête `POST /api/kkiapay/webhook` avec status 200 dans Ngrok
- ✅ Transaction marquée `paid` dans Supabase
- ✅ Email reçu (si Gmail configuré)
- ✅ Cache invalidé (vérifier logs Redis)

---

## 🚀 Prochaines Étapes

Une fois le test réussi :

1. **Documenter l'URL Ngrok actuelle** (elle changera au prochain redémarrage)
2. **Tester différents scénarios** :
   - Paiement annulé
   - Paiement échoué (fonds insuffisants)
   - Paiement pour plusieurs mois
3. **Préparer la production** :
   - Récupérer les clés production KKiaPay
   - Configurer le webhook avec l'URL de production (ex: `https://doussel.immo`)

---

## 📝 Checklist Finale

Avant de considérer que tout fonctionne :

- [ ] ✅ Dashboard KKiaPay : Webhook URL configurée
- [ ] ✅ Ngrok : Tunnel actif et accessible
- [ ] ✅ Next.js : Serveur démarré sur port 3000
- [ ] ✅ Test paiement : Transaction SUCCESS
- [ ] ✅ Supabase : Transaction créée avec `payment_method = 'kkiapay'`
- [ ] ✅ Ngrok Requests : Requête webhook reçue avec status 200
- [ ] ✅ Logs Next.js : Aucune erreur, validation OK
- [ ] ✅ Emails : Confirmation envoyée (locataire + propriétaire)

---

**URL Ngrok actuelle** : `https://1c77592afb3d.ngrok-free.app`
**Webhook endpoint** : `https://1c77592afb3d.ngrok-free.app/api/kkiapay/webhook`
**Ngrok Web Interface** : `http://127.0.0.1:4040`
**Portail locataire** : `http://localhost:3000/portal`

---

**Date** : 2 Janvier 2026
**Statut** : ✅ Configuration terminée - Prêt pour tests
