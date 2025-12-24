---
description: Diagnostique les problèmes d'inscription (Signup Flow) via le script TS
---

# Diagnostic Inscription

Cette commande lance le script de diagnostic critique pour l'authentification Doussel Immo.

1.  Exécute la commande : `npx tsx scripts/check-signup-issues.ts`
2.  Analyse la sortie du terminal.
3.  Si le script détecte une erreur (ex: problème Supabase, RLS manquant), explique la cause probable en français.
4.  Propose un correctif mais ne l'applique PAS sans confirmation.