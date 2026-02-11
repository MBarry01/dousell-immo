# Guide Configuration Stripe (Production & Local)

Ce guide explique comment configurer vos webhooks pour **deux environnements** distincts :
1.  **Local (Développement)** : Pour tester sur votre ordinateur.
2.  **Production (Vercel)** : Pour votre site en ligne (même sans domaine personnalisé).

---

## 1. Créer le Prix Metered (Pour `STRIPE_METERED_PRICE_ID`)
*Ceci est nécessaire pour facturer les commissions sur les paiements Mobile Money (Option B).*

1.  Allez sur le **Dashboard Stripe** > **Produits**.
2.  Cliquez sur **+ Ajouter un produit**.
3.  **Nom** : "Frais Transaction Mobile Money" (ou similaire).
4.  **Information sur le prix** :
    *   **Modèle de tarification** : Standard.
    *   **Prix** : 200 (montant de votre commission fixe en XOF).
    *   **Devise** : XOF (ou EUR si votre compte est en EUR, ex: 0.30€).
    *   **Récurrence** : **Récurrent**.
    *   **Facturation** : **Usage-based** (À l'usage).
    *   **Agrégation** : Somme des valeurs d'usage pendant la période.
5.  Cliquez sur **Enregistrer le produit**.
6.  Dans la page du produit créé, regardez la section "Tarification".
7.  Copiez l'**ID du prix** (commence par `price_...`).
8.  Ajoutez-le dans votre `.env` :
    ```env
    STRIPE_METERED_PRICE_ID=price_1Pxyz...
    ```

---

## 2. Configuration Webhook : La Stratégie "Double Clé"

Vous avez besoin de **deux** configurations différentes. Ne mélangez pas les clés !

### A. Pour le Local (Test sur votre PC)
*Stripe ne peut pas envoyer de messages directement à "localhost". Il faut utiliser le CLI.*

1.  Ouvrez un terminal dans VS Code.
2.  Lancez la commande (si Stripe CLI est installé) :
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe/connect
    ```
3.  Le terminal va afficher : `> Ready! Your webhook signing secret is whsec_test_123xyz...`
4.  Copiez cette clé `whsec_test_...`.
5.  Mettez-la dans votre fichier `.env.local` sur votre PC :
    ```env
    STRIPE_CONNECT_WEBHOOK_SECRET=whsec_test_123xyz...
    ```

### B. Pour la Production (Vercel)
*C'est la configuration pour votre site en ligne (ex: dousell-immo.vercel.app).*

1.  Allez sur le **Dashboard Stripe** > **Developers** > **Webhooks**.
2.  Vérifiez que vous êtes en mode **Live** (ou Test si vous testez une version stagng).
3.  Cliquez sur **+ Ajouter un endpoint**.
4.  **URL du endpoint** : Utilisez votre URL Vercel fournie par le déploiement.
    *   Exemple : `https://dousell-immo-gamma.vercel.app/api/webhooks/stripe/connect`
5.  **Événements à écouter** :
    *   `account.updated`
    *   `account.application.deauthorized`
    *   `payment_intent.succeeded`
    *   `payment_intent.payment_failed`
    *   `payout.failed`
6.  Cliquez sur **Ajouter un endpoint**.
7.  Révélez le **Secret de signature** (`whsec_live_...`).
8.  Allez sur **Vercel Dashboard** > Settings > Environment Variables.
9.  Ajoutez la variable `STRIPE_CONNECT_WEBHOOK_SECRET` avec cette clé de production.

---

## Résumé

| Environnement | URL Webhook | Où trouver la clé (`whsec_...`) | Où mettre la clé |
| :--- | :--- | :--- | :--- |
| **Local** | `localhost:3000/...` | Terminal (`stripe listen`) | Fichier `.env.local` |
| **Vercel** | `https://votre-app.vercel.app/...` | Dashboard Stripe | Vercel Env Vars |

⚠️ **Important** : Ne mettez jamais la clé de production dans votre `.env.local` et vice-versa.
