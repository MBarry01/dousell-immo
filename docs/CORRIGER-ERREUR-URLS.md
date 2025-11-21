# 🔧 Corriger l'erreur "Redirection non valide"

## ❌ Erreur actuelle

Vous avez mis **deux URLs dans le même champ** :
```
https://Dousell-immo.supabase.co/auth/v1/callback http://localhost:3000/auth/callback
```

Google Cloud Console ne permet **pas d'espaces** dans les URLs. Chaque URL doit être dans **un champ séparé**.

## ✅ Solution : Mettre chaque URL dans un champ séparé

### Dans "URI de redirection autorisés" (Authorized redirect URIs)

1. **Premier champ (URI 1)** :
   - Entrez seulement : `https://Dousell-immo.supabase.co/auth/v1/callback`
   - **Sans espace, sans autre URL**

2. **Cliquez sur le bouton "+ Ajouter un URI"** (en bas du premier champ)

3. **Deuxième champ (URI 2)** apparaît :
   - Entrez seulement : `http://localhost:3000/auth/callback`
   - **Sans espace, sans autre URL**

4. **Résultat** : Vous devriez avoir **2 champs séparés** :
   ```
   URI 1: https://Dousell-immo.supabase.co/auth/v1/callback
   URI 2: http://localhost:3000/auth/callback
   ```

## 📝 Configuration complète

### Origines JavaScript autorisées (Authorized JavaScript origins)

**Un seul champ** :
```
http://localhost:3000
```

### URI de redirection autorisés (Authorized redirect URIs)

**Deux champs séparés** (utilisez "+ Ajouter un URI" pour le deuxième) :

**Champ 1 (URI 1)** :
```
https://Dousell-immo.supabase.co/auth/v1/callback
```

**Champ 2 (URI 2)** :
```
http://localhost:3000/auth/callback
```

## ✅ Vérification

Après avoir ajouté les deux URLs dans des champs séparés :
- ✅ Pas d'erreur rouge
- ✅ Les deux URLs sont visibles dans la liste
- ✅ Vous pouvez cliquer sur **Create** ou **Save**

## 🎯 Résultat attendu

Vous devriez voir quelque chose comme ça :

```
URI de redirection autorisés:
┌─────────────────────────────────────────────────────────┐
│ URI 1: https://Dousell-immo.supabase.co/auth/v1/callback│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ URI 2: http://localhost:3000/auth/callback              │
└─────────────────────────────────────────────────────────┘
[+ Ajouter un URI]
```

**Pas d'erreur rouge = Configuration correcte ! ✅**

