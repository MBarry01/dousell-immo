---
description: Vérifie et répare les images cassées ou les placeholders
---

# Fix Assets & Images

Cette commande lance les scripts de maintenance des médias.

1.  Demande d'abord à l'utilisateur : "Voulez-vous vérifier la Homepage ou réparer les liens cassés ?"
2.  **Si Homepage :** Lance `npx tsx scripts/check-homepage-images.ts`
3.  **Si Réparation :** Lance `npx tsx scripts/fix-broken-images.ts`
4.  Analyse la sortie. Si des images manquent, suggère de vérifier le Bucket Supabase Storage.