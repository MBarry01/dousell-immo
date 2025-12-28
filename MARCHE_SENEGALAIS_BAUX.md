# Analyse du Marché Sénégalais & Cadre Légal des Baux 🇸🇳

## 1. Cadre Juridique

Au Sénégal, la gestion des baux est régie par :
- **COCC** (Code des Obligations Civiles et Commerciales)
- **Décret de 2014** sur la baisse des loyers
- **Loi de régulation de 2024**

## 2. Les 3 Règles d'Or

### A. Le Principe de la "Tacite Reconduction"

**C'est le piège n°1.** Au Sénégal, la plupart des contrats sont signés pour 1 an renouvelable.

**La réalité :** Si le propriétaire ne dit rien avant la date limite, le contrat est automatiquement renouvelé pour la même durée.

**Le problème :** Si le propriétaire voulait récupérer son bien ou changer les conditions et qu'il rate la date, il est "coincé" pour un an de plus.

**Notre rôle :** Le système doit être le réveil-matin qui empêche ce renouvellement involontaire.

### B. Les Délais de Préavis (Le "Notice Period")

La loi sénégalaise distingue clairement qui donne congé :

**Le Locataire veut partir :**
- Préavis de **2 mois** à l'avance
- Parfois **1 mois** pour les meublés ou cas de force majeure

**Le Propriétaire veut récupérer son bien :**
- Préavis de **6 mois** (beaucoup plus strict)
- Applicable pour :
  - Congé pour reprise personnelle
  - Travaux majeurs
  - Etc.

### C. L'Usage Commercial (OHADA)

Si l'utilisateur loue un bureau ou un magasin, le droit OHADA (qui s'applique au Sénégal) est très protecteur.

**Le propriétaire doit prévenir 6 mois à l'avance** s'il ne souhaite pas renouveler.

## 3. La Logique du "Cerveau" (Algorithme) 🧠

Pour couvrir tous ces cas sans faire une usine à gaz, nous mettons en place un **système à Double Détente**.

Nous n'allons pas seulement vérifier J-90, mais créer **deux alertes stratégiques** :

### Alerte "Stratégique" (J-180 / 6 Mois)

**Pourquoi ?**
- C'est le délai légal pour un propriétaire qui veut donner congé (récupérer son bien)

**Message :**
> "Attention, si vous souhaitez récupérer votre bien à la fin du bail, vous devez envoyer l'huissier maintenant."

### Alerte "Négociation" (J-90 / 3 Mois)

**Pourquoi ?**
- Avant que la tacite reconduction ne s'active
- C'est le moment de discuter renouvellement ou augmentation (si la loi le permet)

**Message :**
> "Le bail se renouvelle bientôt. Souhaitez-vous le laisser courir ou discuter avec le locataire ?"

## 4. Implémentation Technique

Le système doit générer automatiquement :
1. **J-180** : Alerte stratégique pour décision de congé propriétaire
2. **J-90** : Alerte de négociation avant tacite reconduction
3. Respect des délais légaux selon le type de bail (résidentiel vs commercial)

---

*Document de référence pour le développement des fonctionnalités de gestion locative sur Dousell Immo.*
