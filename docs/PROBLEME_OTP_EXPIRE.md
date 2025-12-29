# Problème : Codes OTP qui expirent immédiatement

## 🔴 Symptôme observé

Lorsqu'un utilisateur s'inscrit :
1. Le code OTP est bien reçu par email ✅
2. Mais le code est déjà **expiré** au moment de le saisir ❌
3. Même en renvoyant le code, le problème persiste

## 🔍 Diagnostic

Le problème vient de la configuration Supabase qui génère des codes OTP avec une durée de validité trop courte ou déjà expirée.

### Causes possibles

1. **Décalage horaire serveur** : L'horloge du serveur Supabase n'est pas synchronisée
2. **Configuration TTL trop courte** : Le Time-To-Live (TTL) des codes OTP est configuré à 0 ou une valeur négative
3. **Bug Supabase** : Problème connu avec certaines versions de Supabase Auth

## ✅ Solution temporaire appliquée

Nous avons désactivé le mode OTP et sommes revenus au **système de lien de confirmation par email** qui fonctionne correctement.

### Ce qui a été modifié

**Fichier : `app/auth/actions.ts`**

```typescript
// AVANT (OTP - codes qui expirent)
const { data, error } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password,
  options: {
    data: { full_name, phone },
    emailRedirectTo: undefined, // Mode OTP
  },
});

// APRÈS (Lien email - fonctionne)
const { data, error } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password,
  options: {
    data: { full_name, phone },
    emailRedirectTo, // Lien de confirmation
  },
});
```

## 🔧 Solution permanente (à implémenter plus tard)

Pour réactiver le mode OTP à l'avenir, vous devrez :

### 1. Contacter le support Supabase

Ouvrez un ticket sur [Supabase Support](https://supabase.com/support) en expliquant :
- Les codes OTP expirent immédiatement
- Le renvoi du code ne résout pas le problème
- Demandez la vérification de la configuration TTL des codes OTP

### 2. Vérifier la configuration dans Supabase Dashboard

1. **Authentication → Settings → Auth**
2. Cherchez le paramètre **"OTP Expiry"** ou **"Token Expiry"**
3. La valeur devrait être au minimum **600 secondes (10 minutes)**
4. Valeur recommandée : **3600 secondes (1 heure)**

### 3. Vérifier via l'API Admin

Vous pouvez vérifier la configuration actuelle avec ce script :

```typescript
// scripts/check-otp-config.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOtpConfig() {
  // Vérifier la configuration des settings
  const { data, error } = await supabaseAdmin.auth.admin.getSettings();

  if (error) {
    console.error("Erreur:", error);
    return;
  }

  console.log("Configuration OTP:", {
    otp_expiry: data.otp_expiry,
    token_expiry: data.token_expiry,
  });
}

checkOtpConfig();
```

## 🎯 Réactiver le mode OTP quand le problème sera résolu

Quand Supabase aura corrigé le problème de TTL :

1. **Retournez dans `app/auth/actions.ts`**

2. **Remplacez** :
   ```typescript
   emailRedirectTo,
   ```

   **Par** :
   ```typescript
   emailRedirectTo: undefined, // Mode OTP
   ```

3. **Testez** en créant un nouveau compte

4. **Vérifiez** que le code reçu est valide pendant au moins 10 minutes

## 📊 Comparaison des deux modes

| Critère | Lien Email (actuel) | Code OTP |
|---------|---------------------|----------|
| UX | ⚠️ Redirection requise | ✅ Reste sur le site |
| Fiabilité | ✅ Fonctionne | ❌ Codes expirent |
| Mobile-friendly | ⚠️ Moyen | ✅ Excellent |
| Erreurs PKCE | ⚠️ Possibles | ✅ Aucune |

## 📝 Historique

- **29/12/2024** : Codes OTP expirent immédiatement
- **29/12/2024** : Retour au système de lien email
- **À venir** : Réactivation OTP après correction Supabase

## 🔗 Ressources

- [Supabase Auth OTP Documentation](https://supabase.com/docs/guides/auth/auth-email-otp)
- [Issue GitHub similaire](https://github.com/supabase/auth/issues)
- [Configuration TTL](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr)
