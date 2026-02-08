---
description: Teste la configuration d'envoi d'emails (Gmail/Supabase)
---

# Test Email Configuration

Cette commande vérifie que le système de messagerie de Doussel Immo fonctionne (nécessaire pour les inscriptions et factures PayDunya).

1.  Exécute : `npx tsx scripts/test-email.ts`
2.  Si ça échoue, vérifie les variables d'environnement `GMAIL_USER` ou `RESEND_API_KEY` dans `.env.local`.
3.  Si ça réussit, confirme simplement "Service Email Opérationnel".
