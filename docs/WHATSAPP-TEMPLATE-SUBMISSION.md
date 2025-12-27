# 📱 Template WhatsApp Business - Quittance de Loyer

## Template à soumettre sur Meta Business Manager

### Informations du Template

**Nom du template** : `quittance_loyer`
**Langue** : Français (fr)
**Catégorie** : **UTILITY** (service utilitaire)
**Type** : Transactionnel (envoi de documents officiels)

---

## 📋 Structure du Template

### HEADER (En-tête)
**Type** : IMAGE
**Variable** : `{{1}}` (URL de l'image de la quittance)

---

### BODY (Corps du message)

```
Bonjour {{1}},

Votre quittance de loyer pour {{2}} est disponible.

💰 Montant réglé : {{3}}
🏠 Propriété : {{4}}
📝 N° de quittance : {{5}}

✅ Paiement confirmé

Merci pour votre ponctualité !

Conservez ce document comme justificatif de paiement.
```

**Variables** :
1. `{{1}}` → Nom du locataire
2. `{{2}}` → Période (ex: "Janvier 2025")
3. `{{3}}` → Montant formaté (ex: "350 000 FCFA")
4. `{{4}}` → Adresse de la propriété
5. `{{5}}` → Numéro de quittance (ex: "BARAKA-2025-001")

---

### FOOTER (Pied de page)

```
Généré par Baraka Immo
```

---

### BUTTONS (Boutons) - OPTIONNEL

**Type** : Quick Reply
**Texte** : "Besoin d'aide ?"

OU

**Type** : URL
**Texte** : "Voir mon espace"
**URL** : `https://doussel.immo/compte/gestion-locative`

---

## 🎨 Exemple de Rendu Final

```
[IMAGE DE LA QUITTANCE]

Bonjour Amadou Diallo,

Votre quittance de loyer pour Janvier 2025 est disponible.

💰 Montant réglé : 350 000 FCFA
🏠 Propriété : Villa Almadies, Dakar
📝 N° de quittance : BARAKA-2025-001

✅ Paiement confirmé

Merci pour votre ponctualité !

Conservez ce document comme justificatif de paiement.

---
Généré par Baraka Immo

[Besoin d'aide ?]
```

---

## 📝 Étapes de Soumission sur Meta

### 1. Accéder au gestionnaire de templates

1. Allez sur https://business.facebook.com
2. Sélectionnez votre **Business Manager**
3. Menu → **WhatsApp Manager**
4. Onglet **Message Templates**

### 2. Créer un nouveau template

1. Cliquez sur **"Create Template"**
2. Remplissez les champs :

   **Name** : `quittance_loyer`
   **Category** : `UTILITY`
   **Languages** : `French`

### 3. Configurer le Header

1. Sélectionnez **"Media"** → **"Image"**
2. Uploadez une **image d'exemple** de quittance (pour validation)
3. Cochez **"Add sample image"**

### 4. Configurer le Body

1. Collez le texte du body ci-dessus
2. Utilisez `{{1}}`, `{{2}}`, etc. pour les variables
3. Ajoutez des **exemples** pour chaque variable :
   - `{{1}}` → Amadou Diallo
   - `{{2}}` → Janvier 2025
   - `{{3}}` → 350 000 FCFA
   - `{{4}}` → Villa Almadies, Dakar
   - `{{5}}` → BARAKA-2025-001

### 5. Configurer le Footer (optionnel)

1. Texte : `Généré par Baraka Immo`

### 6. Ajouter des boutons (optionnel)

1. Type : **Quick Reply**
2. Texte : `Besoin d'aide ?`

### 7. Soumettre pour approbation

1. Vérifiez tous les champs
2. Cliquez sur **"Submit"**
3. **Temps d'approbation** : 1-48h (généralement quelques heures)

---

## ✅ Critères d'Approbation Meta

### ✓ Ce qui est accepté :
- Messages transactionnels (factures, quittances, confirmations)
- Variables clairement définies
- Pas de contenu promotionnel dans UTILITY
- Pas de langage commercial agressif

### ✗ Ce qui est refusé :
- Contenu promotionnel/marketing dans catégorie UTILITY
- Variables non expliquées dans les exemples
- Liens raccourcis (bit.ly, etc.)
- Fautes d'orthographe ou grammaire

---

## 🔄 Alternative : Envoi Direct (sans template)

Si vous ne voulez pas attendre l'approbation Meta, utilisez l'**envoi direct** configuré dans le workflow n8n (nœud "Send WhatsApp (Direct)").

**Limitations** :
- Message formaté mais sans template pré-approuvé
- Nécessite que le locataire ait déjà interagi avec votre numéro WhatsApp Business
- Fenêtre de 24h après le dernier message du client

**Avantages** :
- Pas d'approbation nécessaire
- Modification instantanée du message
- Plus de flexibilité

---

## 🌍 Templates pour autres langues

### Version Wolof (optionnel pour Sénégal)

```
Nanga def {{1}},

Sa reçu loyer bi pour {{2}} dafa am.

💰 Xaalis : {{3}}
🏠 Kër : {{4}}
📝 Numéro : {{5}}

✅ Xaalis bi defee na

Jërëjëf ngir sa ponctualité !
```

### Version Anglais (pour clients internationaux)

```
Hello {{1}},

Your rent receipt for {{2}} is available.

💰 Amount paid: {{3}}
🏠 Property: {{4}}
📝 Receipt #: {{5}}

✅ Payment confirmed

Thank you for your punctuality!
```

---

## 📊 Statistiques d'Utilisation

Une fois le template approuvé, vous aurez accès à :
- Nombre de messages envoyés
- Taux de délivrabilité
- Taux de lecture
- Taux de réponse

---

## 🔗 Ressources

- **Guide officiel Meta** : https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- **Template Gallery** : https://business.facebook.com/wa/manage/message-templates/
- **WhatsApp Business Policy** : https://www.whatsapp.com/legal/business-policy

---

## ⚡ Mise en Production

### Dans le workflow n8n :

1. **Une fois le template approuvé**, activez le nœud **"Send WhatsApp (Template)"**
2. Remplacez `template_name` par `quittance_loyer`
3. Désactivez le nœud **"Send WhatsApp (Direct)"**
4. Testez l'envoi

### Avantages du template approuvé :
- ✅ Taux de délivrabilité supérieur
- ✅ Pas de limite de 24h
- ✅ Envoi possible même sans interaction préalable
- ✅ Statistiques détaillées
- ✅ Professionnel et conforme

---

**🎯 Prêt à soumettre votre template WhatsApp Business !**
