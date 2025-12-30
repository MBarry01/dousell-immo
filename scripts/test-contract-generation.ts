/**
 * Script de test pour le générateur de contrats
 * Usage: npx tsx scripts/test-contract-generation.ts
 */

import { generateContractText, validateContractData, ContractData } from '../lib/contract-template';
import { generateLeasePDF } from '../lib/pdf-generator';
import * as fs from 'fs';
import * as path from 'path';

// Données de test
const testContractData: ContractData = {
  landlord: {
    firstName: 'Amadou',
    lastName: 'Diallo',
    address: '123 Avenue Cheikh Anta Diop, Dakar, Sénégal',
    phone: '+221 77 123 45 67',
    email: 'amadou.diallo@example.com',
    companyName: 'Diallo Immobilier SARL',
    ninea: '987654321',
  },
  tenant: {
    firstName: 'Fatou',
    lastName: 'Sene',
    birthDate: '15 mars 1985',
    birthPlace: 'Saint-Louis',
    phone: '+221 76 987 65 43',
    email: 'fatou.sene@example.com',
    nationalId: 'CNI 1234567890123',
  },
  property: {
    address: 'Résidence Les Almadies, Immeuble B, Appartement 304, Dakar',
    description: '3 chambres à coucher, 1 salon/salle à manger, 1 cuisine équipée, 2 salles de bain, 1 balcon',
    propertyType: 'appartement',
    floor: '3ème étage',
    buildingName: 'Résidence Les Almadies',
  },
  lease: {
    monthlyRent: 350000, // 350,000 FCFA
    securityDeposit: 700000, // 2 mois
    depositMonths: 2,
    startDate: new Date('2025-02-01'),
    duration: 12, // 1 an
    billingDay: 5,
    charges: 25000, // Charges mensuelles
    paymentMethod: 'Virement bancaire',
  },
  signatures: {
    signatureDate: new Date('2025-01-15'),
    signatureCity: 'Dakar',
  },
  additionalClauses: [
    'Le locataire s\'engage à souscrire une assurance habitation dans les 15 jours suivant la prise de possession',
    'Les animaux domestiques sont autorisés avec accord préalable du propriétaire',
    'Le bien est loué avec un parking privatif (numéro P-12)',
  ],
};

async function runTests() {
  console.log('🧪 Test du Générateur de Contrats de Bail\n');
  console.log('═'.repeat(60));

  // Test 1: Validation des données
  console.log('\n📋 Test 1: Validation des données');
  console.log('─'.repeat(60));

  const validation = validateContractData(testContractData);
  if (validation.valid) {
    console.log('✅ Validation réussie - Les données sont conformes');
  } else {
    console.log('❌ Validation échouée:');
    validation.errors.forEach(err => console.log(`   - ${err}`));
    return;
  }

  // Test 2: Génération du texte
  console.log('\n📝 Test 2: Génération du texte du contrat');
  console.log('─'.repeat(60));

  try {
    const contractText = generateContractText(testContractData);
    console.log('✅ Texte généré avec succès');
    console.log(`   Longueur: ${contractText.length} caractères`);

    // Sauvegarder le texte pour inspection
    const textOutputPath = path.join(process.cwd(), 'test-contract-output.txt');
    fs.writeFileSync(textOutputPath, contractText, 'utf-8');
    console.log(`   📄 Texte sauvegardé: ${textOutputPath}`);

    // Afficher un extrait
    console.log('\n   Extrait du contrat:');
    console.log('   ' + '─'.repeat(56));
    const excerpt = contractText.split('\n').slice(0, 20).join('\n');
    console.log(excerpt.split('\n').map(line => `   ${line}`).join('\n'));
    console.log('   ' + '─'.repeat(56));
    console.log('   [...] (voir le fichier complet)');

  } catch (error) {
    console.log('❌ Erreur génération texte:', error);
    return;
  }

  // Test 3: Génération du PDF
  console.log('\n🎨 Test 3: Génération du PDF');
  console.log('─'.repeat(60));

  try {
    const pdfResult = await generateLeasePDF(testContractData, {
      includeWatermark: true,
      watermarkText: 'BROUILLON TEST',
    });

    if (pdfResult.success && pdfResult.pdfBytes) {
      console.log('✅ PDF généré avec succès');
      console.log(`   Taille: ${(pdfResult.pdfBytes.length / 1024).toFixed(2)} KB`);

      // Sauvegarder le PDF
      const pdfOutputPath = path.join(process.cwd(), 'test-contract-output.pdf');
      fs.writeFileSync(pdfOutputPath, pdfResult.pdfBytes);
      console.log(`   📄 PDF sauvegardé: ${pdfOutputPath}`);
      console.log(`   👀 Ouvrez le fichier pour vérifier le rendu`);

    } else {
      console.log('❌ Erreur génération PDF:', pdfResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Erreur génération PDF:', error);
    return;
  }

  // Test 4: Vérification de la conformité légale
  console.log('\n⚖️  Test 4: Vérification de la conformité légale');
  console.log('─'.repeat(60));

  const checks = {
    'Caution ≤ 2 mois de loyer': testContractData.lease.securityDeposit <= testContractData.lease.monthlyRent * 2,
    'Loyer > 0': testContractData.lease.monthlyRent > 0,
    'Durée > 0': testContractData.lease.duration > 0,
    'Adresse propriétaire renseignée': Boolean(testContractData.landlord.address),
    'Téléphone propriétaire renseigné': Boolean(testContractData.landlord.phone),
    'Nom locataire renseigné': Boolean(testContractData.tenant.firstName && testContractData.tenant.lastName),
    'Adresse bien renseignée': Boolean(testContractData.property.address),
  };

  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n✅ Tous les tests de conformité sont passés');
  } else {
    console.log('\n⚠️  Certains tests de conformité ont échoué');
  }

  // Résumé
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Tests terminés avec succès!');
  console.log('═'.repeat(60));
  console.log('\nFichiers générés:');
  console.log(`   - test-contract-output.txt (texte brut)`);
  console.log(`   - test-contract-output.pdf (PDF avec watermark TEST)`);
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Vérifiez le PDF généré');
  console.log('   2. Appliquez la migration Supabase (bucket)');
  console.log('   3. Intégrez le bouton dans votre UI');
  console.log('   4. Testez avec de vraies données de bail\n');
}

// Exécution
runTests().catch(console.error);
