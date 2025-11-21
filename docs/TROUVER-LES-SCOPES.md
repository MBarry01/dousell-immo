# 🔍 Où trouver les Scopes dans Google Cloud Console

## 📍 Emplacement exact

### Étape 1 : Accéder à l'écran de consentement OAuth

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. Dans le menu de gauche, cherchez **"APIs & Services"**
4. Cliquez sur **"OAuth consent screen"**

### Étape 2 : Configurer les scopes

1. Si c'est la première fois, vous verrez un formulaire :
   - **User Type** : Sélectionnez **External** (pour les tests)
   - Cliquez sur **Create**

2. **Remplissez les informations** :
   - **App name** : `Dousell Immo`
   - **User support email** : Votre email
   - **Developer contact** : Votre email
   - Cliquez sur **Save and Continue**

3. **Page "Scopes"** (C'est ici !) :
   - Vous verrez un bouton **"Add or Remove Scopes"**
   - Cliquez dessus
   - Une fenêtre s'ouvre avec une liste de scopes
   - **Cochez ces 3 scopes** :
     - ✅ `.../auth/userinfo.email` (ou cherchez "email")
     - ✅ `.../auth/userinfo.profile` (ou cherchez "profile")
     - ✅ `openid` (ou cherchez "openid")
   - Cliquez sur **Update**
   - Cliquez sur **Save and Continue**

4. **Page "Test users"** (si External) :
   - Ajoutez votre email
   - Cliquez sur **Save and Continue**

5. **Page "Summary"** :
   - Vérifiez que les scopes sont bien listés
   - Cliquez sur **Back to Dashboard**

## ✅ Vérification

Pour vérifier que les scopes sont bien configurés :
1. Retournez dans **OAuth consent screen**
2. Vous devriez voir les scopes listés dans la section "Scopes"

## 🎯 Scopes nécessaires

Pour Dousell Immo, vous avez besoin de :
- **email** : Pour obtenir l'email de l'utilisateur
- **profile** : Pour obtenir le nom et la photo de profil
- **openid** : Pour l'authentification OpenID Connect

Ces 3 scopes sont **suffisants** pour que Google OAuth fonctionne.

## 🐛 Si vous ne voyez pas "OAuth consent screen"

1. Vérifiez que vous avez bien sélectionné un projet
2. Cherchez dans le menu de gauche sous **"APIs & Services"**
3. Si vous ne le voyez toujours pas, activez d'abord l'API :
   - Allez dans **APIs & Services** → **Library**
   - Recherchez "Google Identity API"
   - Cliquez sur **Enable**

## 📝 Note importante

Les scopes sont configurés **une seule fois** pour votre projet Google Cloud. Une fois configurés, tous vos OAuth Client IDs utiliseront ces scopes.

