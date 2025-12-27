# Gestion Locative Automatique

## 📋 Vue d'ensemble

Le système de gestion locative automatique génère automatiquement les échéances de loyer le **1er de chaque mois** pour tous les baux actifs.

## 🔄 Fonctionnement automatique

### Cron Job (Production)
- **Route**: `/api/cron/generate-monthly-rentals`
- **Schedule**: `0 0 1 * *` (1er de chaque mois à minuit UTC)
- **Sécurité**: Bearer token avec `CRON_SECRET`
- **Configuration**: `vercel.json`

### Workflow mensuel automatique
1. **Le 1er du mois à 00:00 UTC**, le Cron Job s'exécute
2. Récupère tous les baux avec `status = 'active'`
3. Pour chaque bail, vérifie si une échéance existe pour le mois en cours
4. Si non → Crée une nouvelle transaction avec `status = 'pending'`
5. Si oui → Ignore (évite les doublons)

## 👤 Workflow propriétaire

### Sur le tableau de bord (`/compte/gestion-locative`)

Le propriétaire voit automatiquement les nouvelles échéances créées par le Cron.

#### Lorsque le locataire paie :
1. Clique sur **"Marquer payé"** (ou "Paiement reçu" si en retard)
2. La transaction passe à `status = 'paid'` dans la DB
3. **Confirmation automatique** apparaît :
   > "Le loyer est marqué comme payé. Souhaitez-vous envoyer immédiatement la quittance par email à [Nom du locataire] ?"

4. **Si OUI** :
   - Vérifie que l'email du locataire existe
   - Vérifie que l'adresse du bien est renseignée
   - Envoie la quittance PDF par email via `/api/send-receipt`
   - Affiche un toast de confirmation

5. **Si NON** :
   - Simple confirmation du paiement
   - Possibilité de voir/envoyer la quittance plus tard

#### Visualisation quittance (status = "paid")
- Bouton **"Voir quittance"** visible uniquement pour les loyers payés
- Ouvre une modale avec prévisualisation PDF
- Utilise les données du profil (branding personnalisé)
- Options : Télécharger ou Envoyer par email

## 🛠️ Scripts utiles

### Scripts de production

```bash
# Tester le Cron manuellement (sans attendre le 1er du mois)
npm run test:cron-rentals

# Restaurer les transactions de décembre en cas de problème
npm run restore:december-rentals

# Nettoyer les données de test (si créées)
npm run clean:test-data
```

## 📊 Base de données

### Table: `leases`
Contrats de location des locataires.

Colonnes clés :
- `status`: 'active' | 'terminated' | 'pending_signature'
- `monthly_amount`: Montant mensuel du loyer
- `billing_day`: Jour du mois pour facturation (ex: 5)
- `owner_id`: Référence au propriétaire

### Table: `rental_transactions`
Échéances de loyer générées automatiquement.

Colonnes clés :
- `lease_id`: Référence au bail
- `period_month`: Mois de l'échéance (1-12)
- `period_year`: Année de l'échéance
- `amount_due`: Montant du loyer
- `status`: 'pending' | 'paid' | 'overdue'
- `paid_at`: Date/heure du paiement
- `notice_url`: Lien vers avis d'échéance PDF
- `receipt_url`: Lien vers quittance PDF

### Contrainte d'unicité
Une seule transaction par bail et par mois :
```sql
UNIQUE (lease_id, period_month, period_year)
```

## 🔐 Variables d'environnement

### Requises pour le Cron
```env
CRON_SECRET=<votre-secret-securise>
NEXT_PUBLIC_SUPABASE_URL=<votre-url-supabase>
SUPABASE_SERVICE_ROLE_KEY=<votre-service-role-key>
```

### Configuration sur Vercel
1. Aller dans **Settings → Environment Variables**
2. Ajouter `CRON_SECRET` (généré de façon sécurisée)
3. S'assurer que `SUPABASE_SERVICE_ROLE_KEY` est défini

## 📅 Exemple de flux mensuel

### Décembre 2025 (données actuelles)
- ✅ 5 échéances créées manuellement ou par Cron précédent
- ✅ Toutes marquées "paid" par le propriétaire
- ✅ Quittances envoyées automatiquement

### Janvier 2026 (automatique le 1er janvier)
- 🤖 Le Cron s'exécute le 01/01/2026 à 00:00 UTC
- 🤖 Crée 5 nouvelles échéances avec `status = 'pending'`
- 👤 Le propriétaire se connecte et voit les 5 nouvelles lignes
- 👤 Clique "Marquer payé" quand chaque locataire paie
- 📧 Décide d'envoyer ou non la quittance par email

### Février 2026, Mars 2026, etc.
- 🔄 Le cycle se répète automatiquement chaque mois

## 🚨 Dépannage

### Le Cron ne crée pas d'échéances
1. Vérifier les logs Vercel : **Deployments → Cron Jobs → View Logs**
2. Vérifier que `CRON_SECRET` est correct
3. Tester manuellement : `npm run test:cron-rentals`
4. Vérifier qu'il existe des baux avec `status = 'active'`

### Échéances dupliquées
Le système empêche les doublons via la contrainte UNIQUE en base de données.
Si une échéance existe déjà pour un mois donné, elle est ignorée.

### Email de quittance non reçu
1. Vérifier que l'email du locataire est renseigné
2. Vérifier que l'adresse du bien est renseignée
3. Vérifier la configuration email dans `/compte/gestion-locative/config`
4. Consulter les logs de l'API `/api/send-receipt`

## 📝 Notes importantes

- Le Cron utilise **Service Role Key** pour bypasser RLS (Row Level Security)
- Les échéances sont créées avec `status = 'pending'` par défaut
- Le statut passe à `'overdue'` dynamiquement côté client si la date limite est dépassée
- Les quittances utilisent le branding du profil propriétaire (logo, signature, NINEA)

## 🎯 Prochaines évolutions possibles

- [ ] Notifications push lors de la création d'échéances
- [ ] Rappels automatiques avant échéance (J-3, J-1)
- [ ] Relances automatiques pour loyers en retard
- [ ] Tableau de bord analytics (taux de paiement, délais moyens)
- [ ] Export comptable mensuel/annuel
- [ ] Gestion des charges locatives
