# Configuration Cloudflare Turnstile

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACCuVzo4E-zQP1Z9
TURNSTILE_SECRET_KEY=0x4AAAAAACCuV22bPFteKOnq4RUxatZxTOc
```

## Clés fournies

- **Site Key (publique)** : `0x4AAAAAACCuVzo4E-zQP1Z9`
- **Secret Key (privée)** : `0x4AAAAAACCuV22bPFteKOnq4RUxatZxTOc`

⚠️ **Important** : La Secret Key ne doit **jamais** être exposée côté client. Elle est uniquement utilisée dans les Server Actions.

## Pages protégées

Le widget Turnstile est intégré sur :
- `/login` - Formulaire de connexion
- `/register` - Formulaire d'inscription
- `/planifier-visite` - Formulaire de demande de visite

## Fonctionnement

1. **Côté client** : Le widget Turnstile s'affiche automatiquement et génère un token lors de la validation
2. **Côté serveur** : Le token est vérifié auprès de l'API Cloudflare avant d'accepter les données du formulaire
3. **Sécurité** : Si la vérification échoue, la soumission est rejetée avec un message d'erreur

## Test en développement

Les clés fournies sont des clés de **test** de Cloudflare. Elles fonctionnent toujours en mode test et ne bloquent pas les requêtes.

Pour la production, créez de nouvelles clés dans le [dashboard Cloudflare](https://dash.cloudflare.com/) et remplacez-les dans les variables d'environnement.

