# Scripts de maintenance

## 1. Remplacer les images Unsplash par Pexels

Ce script remplace automatiquement toutes les images Unsplash par des images Pexels dans la base de données Supabase.

## 2. Identifier et remplacer les images cassées

Ce script vérifie chaque image pour détecter celles qui sont cassées (404, timeout, etc.) et les remplace par des images Pexels.

### Prérequis

1. Variables d'environnement configurées dans `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

2. Clé API Pexels (déjà intégrée dans le script)

### Utilisation

**Remplacer toutes les images Unsplash :**
```bash
npm run replace-images
```

**Identifier et remplacer uniquement les images cassées :**
```bash
npm run fix-images
```

### Fonctionnement

**Script `replace-images` :**
1. Le script récupère toutes les propriétés de Supabase
2. Identifie celles qui contiennent des URLs Unsplash
3. Génère des requêtes de recherche Pexels basées sur le type de bien (villa, appartement, terrain, etc.)
4. Récupère de nouvelles images depuis l'API Pexels
5. Met à jour les URLs dans Supabase

**Script `fix-images` :**
1. Le script récupère toutes les propriétés de Supabase
2. Pour chaque image, effectue une requête HEAD pour vérifier si elle est accessible
3. Identifie les images qui retournent 404, timeout ou erreur
4. Génère des requêtes de recherche Pexels basées sur le type de bien
5. Remplace uniquement les images cassées par de nouvelles images Pexels
6. Met à jour les URLs dans Supabase

### Mots-clés de recherche

Le script utilise des mots-clés intelligents basés sur le titre et la description :
- **Terrains** → "empty land plot construction"
- **Villas/Maisons** → "modern white villa exterior"
- **Appartements** → "modern apartment interior"
- **Studios** → "studio apartment interior design"
- **Bureaux** → "modern office space"
- **Avec piscine** → "luxury house with pool"

### Notes

- Le script attend 1 seconde entre chaque requête pour éviter de surcharger l'API Pexels
- Les images existantes (non-Unsplash) sont conservées
- Le script affiche un rapport détaillé des propriétés mises à jour

