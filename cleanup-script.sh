#!/bin/bash
# Script de nettoyage automatique - Dousell Immo Performance
# Exécuter avec: bash cleanup-script.sh

echo "🧹 Nettoyage du code mort - Dousell Immo"
echo "========================================="

# 1. Supprimer la route landing-3d (Three.js)
echo "📁 Suppression de landing-3d..."
rm -rf "app/(vitrine)/landing-3d"
rm -rf "components/3d"

# 2. Supprimer FeaturesStack (GSAP inutilisé)
echo "📁 Suppression de FeaturesStack..."
rm -f "components/home/FeaturesStack.tsx"

# 3. Supprimer les fichiers de documentation 3D
echo "📄 Suppression des docs de test..."
rm -f SOLUTION_ERROR_HDR.md
rm -f TROUBLESHOOTING_3D.md
rm -f LANDING_3D_SETUP.md
rm -f QUICKSTART_3D.md
rm -f INTEGRATION_GUIDE.md
rm -f README_LANDING_3D.md
rm -f docs/LANDING_3D.md
rm -f PLAN_UNIFICATION_ROUTES.md

# 4. Supprimer les logs de lint
echo "📄 Suppression des logs..."
rm -f lint_log.txt
rm -f lint_full_log.txt
rm -f lint_results.txt
rm -f lint_output.txt

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "⚠️  IMPORTANT: Vous devez maintenant désinstaller les dépendances inutilisées:"
echo ""
echo "npm uninstall three @react-three/fiber @react-three/drei"
echo "npm uninstall gsap @gsap/react"
echo "npm uninstall canvas-confetti"
echo "npm uninstall dom-to-image-more"
echo "npm uninstall @tsparticles/engine @tsparticles/react @tsparticles/slim"
echo ""
echo "Puis déplacer puppeteer en devDependencies:"
echo "npm uninstall puppeteer puppeteer-extra puppeteer-extra-plugin-stealth"
echo "npm install -D puppeteer puppeteer-extra puppeteer-extra-plugin-stealth"
echo ""
echo "💾 Gain estimé: ~15 MB sur node_modules, ~800 KB sur le bundle"
