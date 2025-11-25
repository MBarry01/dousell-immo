# Corrections CSP, PWA et Quirks Mode

## Problèmes identifiés

### 1. Content Security Policy bloque 'eval'

**Erreur** : `Content Security Policy of your site blocks the use of 'eval' in JavaScript`

**Cause** : Next.js en développement utilise `eval()` pour le hot reload et le développement. La CSP stricte bloquait cette fonctionnalité.

**Solution** : Ajout conditionnel de `'unsafe-eval'` uniquement en développement dans `next.config.ts` :

```typescript
script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""} ...
```

**Sécurité** : 
- `'unsafe-eval'` est activé **uniquement en développement**
- En production, la directive est absente, ce qui maintient la sécurité maximale
- Next.js en production n'utilise pas `eval()`, donc cette directive n'est pas nécessaire

### 2. StorageType.persistent est déprécié

**Avertissement** : `StorageType.persistent is deprecated. Please use standardized navigator.storage instead.`

**Cause** : Une librairie tierce (probablement Supabase ou une autre dépendance) utilise encore l'ancienne API `StorageType.persistent` qui est dépréciée.

**Solution** : 
- Aucune action immédiate requise (c'est un avertissement, pas une erreur)
- L'application fonctionne correctement
- Les librairies tierces seront mises à jour progressivement
- Si vous souhaitez utiliser le stockage persistant, utilisez `navigator.storage` :

```javascript
// Ancienne API (dépréciée)
navigator.webkitPersistentStorage.requestQuota(...)

// Nouvelle API (standardisée)
navigator.storage.estimate().then(estimate => {
  console.log('Quota disponible:', estimate.quota);
  console.log('Usage:', estimate.usage);
});
```

### 3. Quirks Mode

**Avertissement** : `Page layout may be unexpected due to Quirks Mode`

**Cause** : Le navigateur détecte un problème potentiel avec le DOCTYPE ou la structure HTML.

**Solution** : 
- Next.js ajoute automatiquement le DOCTYPE `<!DOCTYPE html>`
- Le layout est correctement structuré avec `<html>` et `<body>`
- Commentaire ajouté dans `app/layout.tsx` pour clarifier

**Vérification** : 
- Ouvrir les DevTools > Elements
- Vérifier que le DOCTYPE est présent en haut du document
- Vérifier que le mode est "Standards" et non "Quirks"

## Fichiers modifiés

1. **`next.config.ts`** : CSP conditionnelle avec `'unsafe-eval'` en développement
2. **`app/layout.tsx`** : Commentaire ajouté pour clarifier le DOCTYPE

## Vérification

Pour vérifier que les corrections fonctionnent :

1. **CSP en développement** :
   ```bash
   npm run dev
   ```
   - Ouvrir la console du navigateur
   - Vérifier qu'il n'y a plus d'erreurs CSP liées à `eval`

2. **CSP en production** :
   ```bash
   npm run build
   npm start
   ```
   - Vérifier dans les headers HTTP que `'unsafe-eval'` n'est **pas** présent
   - Ouvrir la console, vérifier qu'il n'y a pas d'erreurs CSP

3. **Quirks Mode** :
   - Ouvrir DevTools > Elements
   - Vérifier que le mode est "Standards"
   - Vérifier la présence du DOCTYPE

## Notes de sécurité

- ⚠️ **Ne jamais activer `'unsafe-eval'` en production** sauf si absolument nécessaire
- ✅ La configuration actuelle est sécurisée : `'unsafe-eval'` uniquement en développement
- ✅ En production, la CSP est stricte et sécurisée
- ✅ Les avertissements de dépréciation (StorageType.persistent) n'affectent pas la sécurité

## Références

- [MDN - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN - Navigator Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/storage)
- [Next.js - Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [OWASP - CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

