# 🔍 Vérifier si le bucket 'properties' existe

## Méthode 1 : Via Supabase Dashboard

1. Allez dans **Supabase Dashboard** → **Storage**
2. Regardez la liste des buckets
3. Si vous voyez un bucket nommé **"properties"** → ✅ Il existe
4. Si vous ne le voyez pas → ❌ Il faut le créer

## Méthode 2 : Créer le bucket (si absent)

### Via l'interface

1. Dans **Storage**, cliquez sur **"New bucket"**
2. **Nom** : `properties` (exactement, en minuscules)
3. **Public bucket** : ✅ **COCHEZ** cette case (très important !)
4. Cliquez sur **"Create bucket"**

### Via SQL (alternative)

Allez dans **SQL Editor** et exécutez :

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;
```

## Méthode 3 : Vérifier via la page de test

1. Visitez : `http://localhost:3000/test-supabase`
2. Regardez le test "Storage 'properties'"
3. Si c'est ✅ vert → Le bucket existe et est accessible
4. Si c'est ❌ rouge → Suivez les instructions affichées

## Problèmes courants

### Le bucket existe mais le test échoue

**Causes possibles** :
- Le bucket n'est pas public (vérifiez la case "Public bucket")
- Les politiques RLS bloquent l'accès
- Le nom du bucket est différent (vérifiez l'orthographe exacte)

**Solution** :
1. Vérifiez que le bucket est **public** dans les paramètres
2. Vérifiez les politiques RLS dans l'onglet "Policies"
3. Assurez-vous que le nom est exactement `properties` (pas `Properties` ou `PROPERTIES`)

### Erreur "permission denied"

**Solution** :
- Vérifiez que vous avez créé les politiques RLS pour :
  - SELECT (lecture publique)
  - INSERT (upload authentifié)

Voir `docs/CREER-BUCKET-STORAGE.md` pour les politiques complètes.

## ✅ Checklist

- [ ] Le bucket `properties` existe dans Storage
- [ ] Le bucket est marqué comme **public**
- [ ] Les politiques RLS sont configurées
- [ ] Le test sur `/test-supabase` est vert

Une fois tous ces points cochés, le bucket est opérationnel ! 🎉


