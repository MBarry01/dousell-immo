# Configuration HIBP (Have I Been Pwned)

## 🚨 Problème CORS en développement

Si vous voyez l'erreur :
```
Access to fetch at 'https://xxx.functions.supabase.co/hibp-password-check' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**C'est normal !** La fonction Edge n'est pas encore déployée.

---

## ✅ Solution Rapide (Développement)

La vérification HIBP est **automatiquement désactivée en développement** si la fonction Edge n'est pas déployée.

➡️ **Vous pouvez continuer à tester l'inscription sans déployer la fonction.**

---

## 🚀 Déploiement en Production

### Prérequis

1. Installer Supabase CLI :
   ```bash
   npm install -g supabase
   ```

2. Se connecter :
   ```bash
   supabase login
   ```

3. Lier votre projet :
   ```bash
   supabase link --project-ref VOTRE_PROJECT_ID
   ```
   
   Trouvez votre `PROJECT_ID` ici : `https://supabase.com/dashboard/project/VOTRE_PROJECT_ID`

### Déploiement

```bash
supabase functions deploy hibp-password-check
```

### Vérification

```bash
# Voir les fonctions déployées
supabase functions list

# Voir les logs
supabase functions logs hibp-password-check
```

### Test

```bash
curl -X POST https://VOTRE_PROJECT_ID.functions.supabase.co/hibp-password-check \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'
```

**Réponse attendue :**
```json
{
  "breached": true,
  "count": 123456
}
```

---

## 🔒 Sécurité

- ✅ Le mot de passe n'est **jamais stocké**
- ✅ Seuls les 5 premiers caractères du hash SHA-1 sont envoyés à HIBP
- ✅ Utilise le k-anonymity model
- ✅ HTTPS obligatoire

---

## 📝 Fonctionnement

1. **Utilisateur saisit un mot de passe** → `Password123`
2. **Hash SHA-1** → `CBFDA...` (40 caractères)
3. **Envoi à HIBP** → Seulement `CBFDA` (5 premiers caractères)
4. **HIBP retourne** → Liste de tous les hashs commençant par `CBFDA`
5. **Vérification locale** → Recherche du hash complet dans la liste

➡️ **HIBP ne connaît jamais le mot de passe complet !**

---

## ❓ FAQ

### La vérification HIBP est-elle obligatoire ?

**Non en développement**, elle est désactivée automatiquement.

**Recommandé en production** pour la sécurité des utilisateurs.

### Que se passe-t-il si HIBP est indisponible ?

L'inscription continue normalement avec un message d'avertissement.

### Puis-je désactiver HIBP en production ?

Oui, dans `app/register/page.tsx`, commentez :
```typescript
// const hibpResult = await checkPasswordHIBP(password, true);
```

**⚠️ Non recommandé** : les utilisateurs pourraient utiliser des mots de passe compromis.

---

## 📚 Ressources

- [Documentation HIBP](https://haveibeenpwned.com/API/v3)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [k-anonymity model](https://haveibeenpwned.com/API/v3#PwnedPasswords)


## 🚨 Problème CORS en développement

Si vous voyez l'erreur :
```
Access to fetch at 'https://xxx.functions.supabase.co/hibp-password-check' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**C'est normal !** La fonction Edge n'est pas encore déployée.

---

## ✅ Solution Rapide (Développement)

La vérification HIBP est **automatiquement désactivée en développement** si la fonction Edge n'est pas déployée.

➡️ **Vous pouvez continuer à tester l'inscription sans déployer la fonction.**

---

## 🚀 Déploiement en Production

### Prérequis

1. Installer Supabase CLI :
   ```bash
   npm install -g supabase
   ```

2. Se connecter :
   ```bash
   supabase login
   ```

3. Lier votre projet :
   ```bash
   supabase link --project-ref VOTRE_PROJECT_ID
   ```
   
   Trouvez votre `PROJECT_ID` ici : `https://supabase.com/dashboard/project/VOTRE_PROJECT_ID`

### Déploiement

```bash
supabase functions deploy hibp-password-check
```

### Vérification

```bash
# Voir les fonctions déployées
supabase functions list

# Voir les logs
supabase functions logs hibp-password-check
```

### Test

```bash
curl -X POST https://VOTRE_PROJECT_ID.functions.supabase.co/hibp-password-check \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'
```

**Réponse attendue :**
```json
{
  "breached": true,
  "count": 123456
}
```

---

## 🔒 Sécurité

- ✅ Le mot de passe n'est **jamais stocké**
- ✅ Seuls les 5 premiers caractères du hash SHA-1 sont envoyés à HIBP
- ✅ Utilise le k-anonymity model
- ✅ HTTPS obligatoire

---

## 📝 Fonctionnement

1. **Utilisateur saisit un mot de passe** → `Password123`
2. **Hash SHA-1** → `CBFDA...` (40 caractères)
3. **Envoi à HIBP** → Seulement `CBFDA` (5 premiers caractères)
4. **HIBP retourne** → Liste de tous les hashs commençant par `CBFDA`
5. **Vérification locale** → Recherche du hash complet dans la liste

➡️ **HIBP ne connaît jamais le mot de passe complet !**

---

## ❓ FAQ

### La vérification HIBP est-elle obligatoire ?

**Non en développement**, elle est désactivée automatiquement.

**Recommandé en production** pour la sécurité des utilisateurs.

### Que se passe-t-il si HIBP est indisponible ?

L'inscription continue normalement avec un message d'avertissement.

### Puis-je désactiver HIBP en production ?

Oui, dans `app/register/page.tsx`, commentez :
```typescript
// const hibpResult = await checkPasswordHIBP(password, true);
```

**⚠️ Non recommandé** : les utilisateurs pourraient utiliser des mots de passe compromis.

---

## 📚 Ressources

- [Documentation HIBP](https://haveibeenpwned.com/API/v3)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [k-anonymity model](https://haveibeenpwned.com/API/v3#PwnedPasswords)










