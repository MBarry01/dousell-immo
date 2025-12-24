---
description: Vérifie la santé du projet avant déploiement (Lint + Build)
---

# Production Health Check

Lance cette commande avant tout commit important ou déploiement Vercel.

1.  Étape 1 : Lance `npm run lint`. S'il y a des erreurs, arrête-toi et liste les fichiers à corriger.
2.  Étape 2 : Lance `npm run build` (pour vérifier les types TypeScript strictes de Next.js 16).
3.  Si tout est vert : Affiche "✅ Doussel Immo est prêt pour la Prod".