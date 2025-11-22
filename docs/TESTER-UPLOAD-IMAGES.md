# 🧪 Tester l'upload d'images

## ✅ Vérification rapide

Maintenant que les politiques RLS sont configurées, testons l'upload d'images :

### Test 1 : Via la page de test Supabase

1. Visitez : `http://localhost:3000/test-supabase`
2. Vérifiez que le test "Storage 'properties'" est maintenant ✅ vert

### Test 2 : Upload réel d'une image

#### Option A : Via le formulaire de dépôt (Utilisateur)

1. **Connectez-vous** à votre compte
2. Allez sur : `http://localhost:3000/compte/deposer`
3. Remplissez le formulaire
4. **Dans la section "Photos"**, glissez-déposez une image ou cliquez pour sélectionner
5. L'image devrait s'afficher dans la grille de prévisualisation
6. Soumettez le formulaire

#### Option B : Via le formulaire admin

1. **Connectez-vous** avec le compte admin (`barrymohamadou98@gmail.com`)
2. Allez sur : `http://localhost:3000/admin/biens/nouveau`
3. Remplissez le formulaire
4. **Dans la section "Photos"**, glissez-déposez une image
5. L'image devrait s'afficher
6. Soumettez le formulaire

### ✅ Signes que ça fonctionne

- ✅ L'image s'affiche dans la prévisualisation après upload
- ✅ Un toast de succès apparaît : "X photo(s) ajoutée(s)"
- ✅ L'image est visible dans Supabase Dashboard → Storage → properties
- ✅ L'URL de l'image commence par : `https://blyanhulvwpdfpezlaji.supabase.co/storage/v1/object/public/properties/...`

### ❌ Si ça ne fonctionne pas

1. **Vérifiez la console du navigateur** (F12) pour les erreurs
2. **Vérifiez les logs Supabase** : Dashboard → Logs → Storage
3. **Vérifiez les politiques RLS** :
   - Les politiques doivent être actives (pas désactivées)
   - La politique INSERT doit avoir l'action "upload" sélectionnée
4. **Vérifiez que vous êtes connecté** : L'upload nécessite une authentification

## 📝 Note sur vos politiques

Vous avez créé 3 politiques séparées pour "Allow authenticated upload" (SELECT, UPDATE, INSERT). C'est fonctionnel, mais vous pourriez les combiner en une seule politique avec toutes les permissions si vous préférez simplifier.

## 🎉 Prochaines étapes

Une fois l'upload testé et fonctionnel :
- ✅ Le bucket Storage est opérationnel
- ✅ Les images peuvent être uploadées
- ✅ Les images sont accessibles publiquement
- ✅ Votre application est complètement connectée à Supabase !


