# 🔍 DEBUG : Email Confirmation - Étapes de Vérification

## ❌ Erreur Actuelle

**Message** : "Le lien d'authentification est invalide ou a expiré"

**Cela signifie** :
1. Le template Supabase n'a pas été mis à jour correctement
2. OU le lien dans l'email utilise encore l'ancien format (ConfirmationURL)
3. OU le token a expiré

---

## 🔧 Vérification 1 : Inspecter l'Email Reçu

### Étape 1 : Ouvrir l'Email de Confirmation

1. **Ouvrir l'email** de confirmation que vous avez reçu
2. **Clic droit** sur le bouton "Confirmer mon inscription"
3. **Sélectionner** "Copier l'adresse du lien" (ou "Copy link address")
4. **Coller** le lien dans un éditeur de texte

### Étape 2 : Analyser le Lien

**Le lien doit ressembler à** :
```
https://dousell-immo.vercel.app/auth/callback?token_hash=pkce_abc123...&type=email&next=/
```

**❌ Si le lien ressemble à** :
```
https://dousell-immo.vercel.app/auth/confirm?token_hash=...
https://dousell-immo.vercel.app/auth/callback?code=...
```

→ **Alors le template Supabase n'a PAS été mis à jour correctement**

---

## 🔧 Vérification 2 : Template Supabase

### Étape 1 : Vérifier le Template Actuel

1. **Aller sur** : https://supabase.com/dashboard/project/blyanhulvwpdfpezlaji/auth/templates
2. **Cliquer** sur "Confirm signup"
3. **Vérifier** que le template contient EXACTEMENT :

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/">
  ✓ Confirmer mon inscription
</a>
```

### Étape 2 : Variables Supabase Disponibles

Selon la version de Supabase, les variables peuvent être différentes :

**Option A (Nouveau format)** :
```html
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/
```

**Option B (Ancien format)** :
```html
{{ .SiteURL }}/auth/callback?token_hash={{ .Token }}&type=email&next=/
```

**Option C (Très ancien format)** :
```html
{{ .ConfirmationURL }}
```

### Étape 3 : Tester Quelle Variable Fonctionne

Remplacez temporairement le contenu par ce template de test :

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px;">
    <h1>Test Variables Supabase</h1>

    <h2>Variables disponibles :</h2>
    <ul>
      <li><strong>SiteURL:</strong> {{ .SiteURL }}</li>
      <li><strong>TokenHash:</strong> {{ .TokenHash }}</li>
      <li><strong>Token:</strong> {{ .Token }}</li>
      <li><strong>Email:</strong> {{ .Email }}</li>
    </ul>

    <h2>Liens de test :</h2>

    <h3>Option 1 : TokenHash</h3>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/"
       style="display: block; padding: 10px; background: #4CAF50; color: white; text-decoration: none; margin: 10px 0;">
      Tester avec TokenHash
    </a>

    <h3>Option 2 : Token</h3>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .Token }}&type=email&next=/"
       style="display: block; padding: 10px; background: #2196F3; color: white; text-decoration: none; margin: 10px 0;">
      Tester avec Token
    </a>

    <h3>Option 3 : ConfirmationURL</h3>
    <a href="{{ .ConfirmationURL }}"
       style="display: block; padding: 10px; background: #FF9800; color: white; text-decoration: none; margin: 10px 0;">
      Tester avec ConfirmationURL
    </a>
  </div>
</body>
</html>
```

**Sauvegardez** et **créez un nouveau compte** pour tester.

---

## 🔧 Vérification 3 : Logs Serveur

### Vérifier les Logs du Callback

Quand vous cliquez sur le lien, vérifiez les logs dans le terminal :

```bash
npm run dev
```

**Logs attendus** :
```
🔍 Auth Callback Debug: {
  code: "✗ manquant",
  token_hash: "✓ présent",
  type: "email",
  error: null,
  errorDescription: null,
  next: "/",
  origin: "https://dousell-immo.vercel.app"
}
🔐 Email confirmation flow (token_hash)
✅ Email verified, session created
```

**Si vous voyez** :
```
❌ Error verifying OTP: ...
```

→ Copiez l'erreur complète et envoyez-la moi.

---

## 🔧 Solution Alternative : Vérifier la Configuration Email Supabase

### Vérifier le Type d'Email

1. **Aller sur** : https://supabase.com/dashboard/project/blyanhulvwpdfpezlaji/auth/providers
2. **Cliquer** sur "Email"
3. **Vérifier** que "Enable email confirmation" est **activé**

### Vérifier les Paramètres Avancés

1. Dans la même page, cherchez **"Advanced settings"**
2. Vérifiez :
   - **Email OTP Expiry** : 86400 (24h)
   - **Secure email change enabled** : Peu importe
   - **Auto-confirm email** : ❌ **Désactivé** (sinon pas d'email envoyé)

---

## 🔧 Solution de Secours : Utiliser l'API Directe

Si les templates ne fonctionnent pas, on peut créer une route API custom pour gérer la confirmation.

### Créer une Route API Custom

Fichier : `app/api/auth/confirm/route.ts`

```typescript
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "email";

  if (!token_hash) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=Token manquant`);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (error) {
      console.error("Confirm error:", error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      return NextResponse.redirect(`${origin}/?confirmed=true`);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=No session created`);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=Unexpected error`);
  }
}
```

Puis dans le template Supabase, utiliser :
```html
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirmer
</a>
```

---

## 📋 Checklist de Dépannage

Cochez ce que vous avez vérifié :

- [ ] Email reçu et lien copié
- [ ] Lien contient bien `token_hash=` (pas `code=`)
- [ ] Template Supabase mis à jour avec `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/`
- [ ] Template sauvegardé (bouton "Save" cliqué)
- [ ] Nouveau compte créé APRÈS la modification du template
- [ ] Logs serveur vérifiés (affiche "Email confirmation flow")
- [ ] "Enable email confirmation" activé dans Supabase

---

## 🚨 Erreurs Communes

### Erreur 1 : Template Non Sauvegardé
**Symptôme** : Ancien lien toujours dans l'email
**Solution** : Cliquer sur "Save" en bas du template Supabase

### Erreur 2 : Ancien Compte Utilisé
**Symptôme** : Email envoyé avant modification du template
**Solution** : Créer un **nouveau compte** avec un **nouvel email**

### Erreur 3 : Mauvaise Variable
**Symptôme** : Variable vide dans l'email
**Solution** : Tester avec `{{ .Token }}` au lieu de `{{ .TokenHash }}`

### Erreur 4 : Cache Supabase
**Symptôme** : Template correct mais ancien email envoyé
**Solution** : Attendre 5 minutes ou vider le cache Supabase

---

## 🎯 Prochaines Étapes

1. **Vérifier le lien** dans l'email reçu
2. **M'envoyer** le lien complet (masquez juste le token_hash)
3. **Vérifier les logs** serveur quand vous cliquez sur le lien
4. **Essayer le template de test** ci-dessus

Une fois que je verrai le format exact du lien, je pourrai vous dire exactement quoi corriger !

---

**Format attendu pour me partager le lien** :
```
https://dousell-immo.vercel.app/auth/callback?token_hash=XXXXXX&type=email&next=/
                                              ^^^^^^^^^
                                    (masquez juste cette partie)
```

Ou dites-moi simplement :
- Le lien commence par : `/auth/callback` ou `/auth/confirm` ou autre ?
- Le lien contient : `token_hash=` ou `code=` ou autre ?
