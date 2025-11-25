# Configuration PayDunya

## Vue d'ensemble

PayDunya est un agrégateur de paiement au Sénégal qui permet d'accepter Wave, Orange Money et Free Money via une seule intégration.

## Configuration

### 1. Créer un compte PayDunya Business

1. Inscrivez-vous sur [PayDunya](https://paydunya.com/)
2. Créez un compte Business
3. Complétez la vérification de votre compte

### 2. Générer les clés API

1. Connectez-vous à votre dashboard PayDunya
2. Allez dans "Intégrez notre API" → "Configurer une nouvelle application"
3. Remplissez le formulaire :
   - Nom de l'application : "Dousell Immo"
   - Mode : **TEST** (pour commencer)
   - URL de callback : `https://votre-domaine.com/api/paydunya/webhook`
4. Copiez les clés générées :
   - **Master Key**
   - **Private Key**
   - **Token**

### 3. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# PayDunya Configuration
PAYDUNYA_MASTER_KEY=votre_master_key_ici
PAYDUNYA_PRIVATE_KEY=votre_private_key_ici
PAYDUNYA_TOKEN=votre_token_ici
PAYDUNYA_MODE=test  # ou "live" pour la production
```

### 4. URL de callback (Webhook)

Dans votre dashboard PayDunya, configurez l'URL de callback :

**En développement :**
```
http://localhost:3000/api/paydunya/webhook
```

**En production :**
```
https://votre-domaine.com/api/paydunya/webhook
```

⚠️ **Important** : Cette URL doit être accessible publiquement pour que PayDunya puisse envoyer les notifications de paiement.

## Flux de paiement

1. **Création de facture** : L'utilisateur clique sur "Payer avec PayDunya"
2. **Redirection** : L'utilisateur est redirigé vers PayDunya
3. **Paiement** : L'utilisateur choisit son moyen de paiement (Wave, Orange Money, Free Money)
4. **Retour** : Après paiement, l'utilisateur est redirigé vers votre site
5. **Webhook** : PayDunya envoie une notification à votre serveur pour confirmer le paiement

## Passage en production

1. Dans votre dashboard PayDunya, créez une nouvelle application en mode **LIVE**
2. Copiez les nouvelles clés (Master Key, Private Key, Token)
3. Mettez à jour vos variables d'environnement :
   ```env
   PAYDUNYA_MODE=live
   PAYDUNYA_MASTER_KEY=votre_master_key_live
   PAYDUNYA_PRIVATE_KEY=votre_private_key_live
   PAYDUNYA_TOKEN=votre_token_live
   ```
4. Configurez l'URL de callback en production dans le dashboard PayDunya

## Test

Pour tester l'intégration :

1. Utilisez les clés de **TEST** dans `.env.local`
2. Créez une annonce avec l'offre "Diffusion Simple"
3. Cliquez sur "Payer avec PayDunya"
4. Utilisez les numéros de test PayDunya pour simuler un paiement

## Documentation officielle

- [Documentation PayDunya](https://developers.paydunya.com/doc/FR/http_json)
- [Passage en production](https://developers.paydunya.com/doc/FR/passage_production)

## Support

En cas de problème :
1. Vérifiez les logs du serveur pour les erreurs
2. Vérifiez que les variables d'environnement sont correctement configurées
3. Vérifiez que l'URL de callback est accessible publiquement
4. Contactez le support PayDunya si nécessaire

