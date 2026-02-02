# Audit de Cohésion - Gestion Locative (Janvier 2026)

Cet audit examine la cohérence logique et la communication entre les différents modules du dashboard de Gestion Locative.

## 🏁 Résumé de l'état actuel
| Module | État | Observations |
| :--- | :--- | :--- |
| **Dashboard** | 🟡 | Logique de stats potentiellement déconnectée du moteur unifié. |
| **Comptabilité** | ✅ | Utilise le moteur unifié et le cache Redis. |
| **Biens / Baux** | ⚪ | À vérifier (Actions de création/modification). |
| **États des Lieux** | ⚪ | À vérifier (Intégration avec les baux). |
| **Interventions** | ⚪ | À vérifier (Communication avec les biens). |
| **Documents** | ⚪ | À vérifier (Génération auto vs stockage). |
| **Messagerie** | ⚪ | À vérifier (Notifications temps réel). |
| **Juridique** | ⚪ | À vérifier (Génération de contrats). |
| **Équipe** | ⚪ | À vérifier (Awareness de l'équipe partout). |

## 📊 1. Cohérence des calculs (Compta vs Dashboard)
- **Fragmentation Critique** : La logique de calcul des statistiques est dupliquée et incohérente.
    - `(webapp)/gestion-locative/actions.ts` : `getRentalStats` calcule manuellement.
    - `(workspace)/gestion/actions.ts` : `getRentalStats` recalcule avec une autre logique.
    - `lib/finance-service.ts` : Utilise `calculateYearlyFinancials` (moteur unifié) mais **ignore les dépenses**.
- [ ] **Action** : Déplacer `calculateFinancials` dans `lib/finance-service.ts` et l'utiliser comme source unique pour tous les dashboards.
- [ ] **Profitabilité** : Intégrer la table `expenses` dans le moteur de calcul pour afficher le bénéfice réel.

## 🔗 2. Flux de données entre modules
- [x] **Interventions -> Compta** : `completeIntervention` crée bien une dépense dans la table `expenses`.
- [ ] **États des Lieux -> Biens** : **ALERTE - Silo**. La signature d'un état des lieux de sortie ne déclenche pas la clôture du bail. L'utilisateur doit le faire manuellement, ce qui est source d'erreur.
- [ ] **Problème Finance** : Les statistiques financières actuelles (`calculateFinancials`) ne prennent en compte que les revenus (`rental_transactions`) et ignorent les dépenses (`expenses`). Les KPIs de "Profit" sont donc absents ou incomplets.
- [ ] **Team Awareness** : La création de dépense dans `completeIntervention` n'inclut pas le `team_id`, ce qui peut causer des problèmes de visibilité pour les équipes de gestion.

## 👥 3. Awareness de l'Équipe
- [ ] Vérifier que tous les modules filtrent bien par `team_id` ou `owner_id` de manière consistante.
