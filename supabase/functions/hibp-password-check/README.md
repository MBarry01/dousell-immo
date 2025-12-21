# Fonction Edge : hibp-password-check

## Description

Cette fonction Edge Supabase vérifie si un mot de passe a été compromis en utilisant l'API [Have I Been Pwned (HIBP)](https://haveibeenpwned.com/).

Elle utilise le **k-anonymity model** de HIBP pour garantir que le mot de passe n'est jamais envoyé en clair à l'API HIBP.

## Fonctionnement

1. Hash le mot de passe avec SHA-1
2. Envoie uniquement les 5 premiers caractères du hash à HIBP
3. Vérifie si le reste du hash figure dans la liste des mots de passe compromis

## Déploiement

### 1. Installer Supabase CLI

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier votre projet

```bash
supabase link --project-ref VOTRE_PROJECT_ID
```

Trouvez votre `PROJECT_ID` dans l'URL de votre dashboard Supabase :
`https://supabase.com/dashboard/project/VOTRE_PROJECT_ID`

### 4. Déployer la fonction

```bash
supabase functions deploy hibp-password-check
```

### 5. Vérifier le déploiement

```bash
supabase functions list
```

## Test

### Tester localement

```bash
# Terminal 1 : Démarrer Supabase local
supabase start

# Terminal 2 : Servir la fonction
supabase functions serve hibp-password-check

# Terminal 3 : Tester
curl -i --location --request POST 'http://localhost:54321/functions/v1/hibp-password-check' \
  --header 'Content-Type: application/json' \
  --data '{"password":"password123"}'
```

### Tester en production

```bash
curl -i --location --request POST 'https://VOTRE_PROJECT_ID.functions.supabase.co/hibp-password-check' \
  --header 'Content-Type: application/json' \
  --data '{"password":"password123"}'
```

## Réponse

### Mot de passe compromis

```json
{
  "breached": true,
  "count": 123456
}
```

### Mot de passe sûr

```json
{
  "breached": false
}
```

### Erreur

```json
{
  "error": "Password is required"
}
```

## CORS

La fonction autorise les requêtes depuis :
- `localhost` (développement)
- Tous les domaines (`*`)

Pour restreindre à votre domaine uniquement, modifiez dans `index.ts` :

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://votre-domaine.com",
  // ...
};
```

## Logs

Pour voir les logs de la fonction :

```bash
supabase functions logs hibp-password-check
```

## Notes

- La fonction ne stocke JAMAIS les mots de passe
- Elle n'envoie que les 5 premiers caractères du hash SHA-1 à HIBP
- L'API HIBP est gratuite et publique


## Description

Cette fonction Edge Supabase vérifie si un mot de passe a été compromis en utilisant l'API [Have I Been Pwned (HIBP)](https://haveibeenpwned.com/).

Elle utilise le **k-anonymity model** de HIBP pour garantir que le mot de passe n'est jamais envoyé en clair à l'API HIBP.

## Fonctionnement

1. Hash le mot de passe avec SHA-1
2. Envoie uniquement les 5 premiers caractères du hash à HIBP
3. Vérifie si le reste du hash figure dans la liste des mots de passe compromis

## Déploiement

### 1. Installer Supabase CLI

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier votre projet

```bash
supabase link --project-ref VOTRE_PROJECT_ID
```

Trouvez votre `PROJECT_ID` dans l'URL de votre dashboard Supabase :
`https://supabase.com/dashboard/project/VOTRE_PROJECT_ID`

### 4. Déployer la fonction

```bash
supabase functions deploy hibp-password-check
```

### 5. Vérifier le déploiement

```bash
supabase functions list
```

## Test

### Tester localement

```bash
# Terminal 1 : Démarrer Supabase local
supabase start

# Terminal 2 : Servir la fonction
supabase functions serve hibp-password-check

# Terminal 3 : Tester
curl -i --location --request POST 'http://localhost:54321/functions/v1/hibp-password-check' \
  --header 'Content-Type: application/json' \
  --data '{"password":"password123"}'
```

### Tester en production

```bash
curl -i --location --request POST 'https://VOTRE_PROJECT_ID.functions.supabase.co/hibp-password-check' \
  --header 'Content-Type: application/json' \
  --data '{"password":"password123"}'
```

## Réponse

### Mot de passe compromis

```json
{
  "breached": true,
  "count": 123456
}
```

### Mot de passe sûr

```json
{
  "breached": false
}
```

### Erreur

```json
{
  "error": "Password is required"
}
```

## CORS

La fonction autorise les requêtes depuis :
- `localhost` (développement)
- Tous les domaines (`*`)

Pour restreindre à votre domaine uniquement, modifiez dans `index.ts` :

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://votre-domaine.com",
  // ...
};
```

## Logs

Pour voir les logs de la fonction :

```bash
supabase functions logs hibp-password-check
```

## Notes

- La fonction ne stocke JAMAIS les mots de passe
- Elle n'envoie que les 5 premiers caractères du hash SHA-1 à HIBP
- L'API HIBP est gratuite et publique












