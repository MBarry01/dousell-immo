# 🔍 Diagnostic du Flux de Paiement PayDunya

## Problème : "J'ai payé mais rien ne se passe"

### ✅ Vérifications à faire

#### 1. **Vérifier dans la console du navigateur (F12)**

Après avoir payé et être revenu sur la page, ouvrez la console et cherchez :

```javascript
// Ces logs doivent apparaître :
🔍 Vérification du paiement avec token: test_XXXXX
📥 Réponse de vérification PayDunya: {...}
✅ Paiement complété? true Statut: completed
```

**Si vous voyez des erreurs :**
- `❌ Erreur de vérification` → Le token PayDunya n'est pas valide
- `❌ Statut de paiement non confirmé` → PayDunya n'a pas confirmé le paiement
- `❌ Vérification PayDunya échouée` → Problème de connexion ou d'API

#### 2. **Vérifier dans les logs du serveur (Terminal)**

Dans votre terminal où `npm run dev` tourne, cherchez :

```
🔍 Réponse PayDunya complète: {...}
📊 Statut extrait: completed
📊 Response code: 00
```

**Si vous ne voyez pas ces logs :**
- La vérification n'est pas appelée
- Vérifiez que vous êtes bien revenu avec `?payment=success` dans l'URL

#### 3. **Vérifier le localStorage**

Dans la console du navigateur, tapez :

```javascript
// Vérifier le token PayDunya
localStorage.getItem("paydunya_payment_token")

// Vérifier si le paiement est vérifié
localStorage.getItem("paydunya_payment_verified")
```

**Résultats attendus :**
- `paydunya_payment_token` : doit contenir un token (ex: `test_XXXXX`)
- `paydunya_payment_verified` : doit être `"true"` après confirmation

#### 4. **Vérifier dans Supabase**

1. Allez dans Supabase Dashboard → Table Editor → `properties`
2. Cherchez votre annonce récente
3. Vérifiez :
   - `validation_status` : doit être `payment_pending` ou `pending`
   - `payment_ref` : doit contenir le token PayDunya
   - `service_type` : doit être `boost_visibilite`

**Si l'annonce n'existe pas :**
- Le formulaire n'a pas été soumis
- Vérifiez les logs dans la console pour voir l'erreur

#### 5. **Vérifier le statut PayDunya directement**

Dans la console du navigateur, testez :

```javascript
// Remplacer TOKEN par votre token PayDunya
fetch('/api/paydunya/confirm?token=TOKEN')
  .then(r => r.json())
  .then(data => console.log('Réponse:', data))
```

**Résultat attendu :**
```json
{
  "success": true,
  "status": "completed",
  "isCompleted": true,
  "response": {...}
}
```

### 🐛 Problèmes courants et solutions

#### Problème 1 : "Paiement non confirmé" même après avoir payé

**Cause :** PayDunya n'a pas encore confirmé le paiement (délai de traitement)

**Solution :**
1. Attendez 1-2 minutes
2. Rechargez la page
3. Le paiement devrait être vérifié automatiquement

#### Problème 2 : Le token n'est pas dans localStorage

**Cause :** Le token n'a pas été stocké avant la redirection vers PayDunya

**Solution :**
1. Vérifiez que vous avez bien cliqué sur "Payer avec PayDunya"
2. Vérifiez les logs dans la console pour voir si la création de facture a réussi
3. Réessayez le paiement

#### Problème 3 : L'annonce n'est pas créée

**Cause :** Le formulaire n'a pas été soumis ou il y a une erreur

**Solution :**
1. Vérifiez que vous êtes à l'étape 3 du formulaire
2. Vérifiez que le paiement est confirmé (badge vert "Paiement confirmé")
3. Cliquez sur "Déposer l'annonce"
4. Vérifiez les logs dans la console pour voir l'erreur

#### Problème 4 : "La référence de paiement est requise"

**Cause :** Le `payment_ref` n'est pas passé lors de la soumission

**Solution :**
1. Vérifiez que `paymentToken` est bien défini dans l'état React
2. Vérifiez que `paymentVerification === "success"`
3. Le token devrait être automatiquement inclus dans `submitUserListing`

### 📋 Checklist de vérification

- [ ] J'ai payé sur PayDunya et je suis revenu sur la page
- [ ] L'URL contient `?payment=success`
- [ ] Le token est dans localStorage (`paydunya_payment_token`)
- [ ] Le paiement est vérifié (`paydunya_payment_verified = "true"`)
- [ ] Le badge vert "Paiement confirmé" s'affiche
- [ ] Je peux cliquer sur "Déposer l'annonce"
- [ ] L'annonce apparaît dans Supabase avec `payment_pending`
- [ ] Les logs dans la console ne montrent pas d'erreurs

### 🔧 Commandes de diagnostic

```bash
# Vérifier les logs du serveur
npm run dev

# Vérifier le build
npm run build

# Vérifier les variables d'environnement PayDunya
# Dans .env.local, vérifiez :
# PAYDUNYA_MASTER_KEY=...
# PAYDUNYA_PRIVATE_KEY=...
# PAYDUNYA_TOKEN=...
# PAYDUNYA_MODE=test
```

### 📞 Si le problème persiste

1. **Copiez tous les logs** de la console (navigateur + terminal)
2. **Vérifiez le token PayDunya** dans le dashboard PayDunya
3. **Vérifiez les logs Supabase** (Dashboard → Logs → API Logs)
4. **Vérifiez que l'annonce existe** dans Supabase même si elle n'apparaît pas dans l'UI

### 🎯 Test manuel du flux complet

1. Allez sur `/compte/deposer`
2. Remplissez le formulaire jusqu'à l'étape 3
3. Choisissez "Diffusion Simple (Payant)"
4. Cliquez sur "Payer avec PayDunya"
5. **Vérifiez dans la console** : le token doit être stocké
6. Payez sur PayDunya (utilisez un compte test)
7. Revenez sur la page
8. **Vérifiez dans la console** : la vérification doit se faire automatiquement
9. Si le badge vert apparaît, cliquez sur "Déposer l'annonce"
10. **Vérifiez dans Supabase** : l'annonce doit être créée








