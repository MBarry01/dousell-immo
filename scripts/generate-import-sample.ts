/**
 * Generate Import Sample Files
 *
 * Generates both JSON and CSV sample files for property bulk import.
 * Run with: npx tsx scripts/generate-import-sample.ts
 */

import fs from 'fs'
import path from 'path'
import { generateCSVTemplate } from '@/lib/csv/parsePropertyCSV'

const publicDir = path.join(process.cwd(), 'public')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// ============================================================================
// JSON Sample
// ============================================================================

const jsonSample = {
  properties: [
    {
      title: 'Magnifique Appartement Plateau',
      description:
        'Appartement moderne situé au cœur du plateau avec vue panoramique sur l\'océan. 3 chambres, 2 salles de bain, cuisine équipée.',
      price: '50000000',
      category: 'vente',
      type: 'Appartement',
      city: 'dakar',
      district: 'plateau',
      surface: '120',
      rooms: '3',
      bedrooms: '3',
      bathrooms: '2',
      agent_name: 'Jean Dupont',
      agent_phone: '+221771234567',
      agent_email: 'jean@immobilier.sn',
    },
    {
      title: 'Villa Almadies Standing',
      description:
        'Superbe villa à Almadies avec piscine, garage et jardin. 4 chambres, standing élevé.',
      price: '150000000',
      category: 'vente',
      type: 'Villa',
      city: 'dakar',
      district: 'almadies',
      surface: '250',
      rooms: '4',
      bedrooms: '4',
      bathrooms: '3',
      agent_name: 'Marie Sène',
      agent_phone: '+221777654321',
    },
    {
      title: 'Studio étudiant Médina',
      description: 'Petit studio meublé idéal pour étudiant. Proche de l\'Université Cheikh Anta Diop.',
      price: '8000000',
      category: 'location',
      type: 'Studio',
      city: 'dakar',
      district: 'medina',
      surface: '25',
      rooms: '1',
      agent_name: 'Fatou BA',
      agent_phone: '+221784567890',
    },
    {
      title: 'Terrain viabilisé Diamniadio',
      description:
        'Beau terrain viabilisé au pôle urbain de Diamniadio. Excellent potentiel d\'investissement.',
      price: '75000000',
      category: 'vente',
      type: 'Terrain',
      city: 'dakar',
      district: 'diamniadio',
      surface: '500',
      agent_name: 'Moussa Diallo',
      agent_phone: '+221775432123',
    },
    {
      title: 'Duplex moderne Sacré-Cœur',
      description:
        'Duplex avec espace partagé et jardins privés. Quartier résidentiel calme. 5 chambres.',
      price: '120000000',
      category: 'vente',
      type: 'Duplex',
      city: 'dakar',
      district: 'sacre-coeur',
      surface: '180',
      rooms: '5',
      bedrooms: '4',
      bathrooms: '3',
      agent_name: 'Aïssatou Fall',
      agent_phone: '+221701234567',
    },
  ],
}

// ============================================================================
// CSV Sample
// ============================================================================

const csvSample = generateCSVTemplate()

// ============================================================================
// Write Files
// ============================================================================

try {
  // Write JSON sample
  const jsonPath = path.join(publicDir, 'sample-import.json')
  fs.writeFileSync(jsonPath, JSON.stringify(jsonSample, null, 2))
  console.log(`✅ JSON sample generated: public/sample-import.json`)

  // Write CSV sample
  const csvPath = path.join(publicDir, 'sample-import.csv')
  fs.writeFileSync(csvPath, csvSample)
  console.log(`✅ CSV sample generated: public/sample-import.csv`)

  // Write README
  const readmeContent = `# Property Bulk Import Samples

## JSON Format

Use the JSON format for importing properties programmatically or from admin UI.

**File**: \`sample-import.json\`

**Usage**:
1. Go to Admin Dashboard > Bulk Import
2. Copy the JSON from \`sample-import.json\`
3. Paste into the textarea
4. Click "Import"

**Format**:
\`\`\`json
{
  "properties": [
    {
      "title": "Property Title",
      "description": "Property description (min 20 chars)",
      "price": "50000000",         // in centimes (50M XOF)
      "category": "vente",         // or "location"
      "type": "Appartement",       // see list below
      "city": "dakar",
      "district": "plateau",       // optional
      "surface": "120",            // m² (optional)
      "rooms": "3",                // optional
      "bedrooms": "3",             // optional
      "bathrooms": "2",            // optional
      "agent_name": "Jean Dupont",
      "agent_phone": "+221771234567",
      "agent_email": "email@example.com" // optional
    }
  ]
}
\`\`\`

## CSV Format

Use CSV for bulk imports from spreadsheets (Excel, Google Sheets).

**File**: \`sample-import.csv\`

**Headers** (in order):
\`\`\`
title, description, price, category, type, city, district, surface, rooms, bedrooms, bathrooms, agent_name, agent_phone, agent_email
\`\`\`

**Rules**:
- Quote values containing commas: \`"Value with, comma"\`
- Escape quotes by doubling: \`"Value with ""quote"" inside"\`
- Price is in centimes (multiply XOF by 100)

## Property Types

Valid values for \`type\` field:
- Appartement
- Villa
- Maison
- Studio
- Terrain
- Immeuble
- Bureau
- Magasin
- Hangar
- Local commercial
- Chambre
- Duplex

## Cities & Districts

**Dakar**:
- Plateau
- Almadies / Les Almadies
- Ngor
- Mermoz
- Sacré-Cœur
- Médina
- Fass
- Parcelles Assainies
- Ouakam
- Yoff
- Diamniadio

**Thiès**:
- Centre-ville
- Thiès Escale
- Jaxaay

**Kaolack**:
- Centre-ville

## Import Status

After import, properties are marked as \`validation_status: pending\`.

**Admin Review Required**:
1. Properties are not immediately visible
2. Admin must approve each property
3. Once approved (\`validation_status: approved\`), properties appear in search results

## Troubleshooting

### Import Failed
- Check JSON/CSV format is valid
- Ensure required fields are present
- Verify phone numbers match regex: \`^\+?[0-9\s-()]+$\`
- Check price is numeric (no currency symbols)

### Price Format
- Input: \`50000000\` (price in XOF)
- Stored as: \`5000000000\` (in centimes, multiplied by 100)
- Display: \`50 000 000 XOF\`

## Sample Files

- \`sample-import.json\` - 5 example properties in JSON format
- \`sample-import.csv\` - Template CSV with 1 example property
`

  const readmePath = path.join(publicDir, 'BULK_IMPORT_README.md')
  fs.writeFileSync(readmePath, readmeContent)
  console.log(`✅ README generated: public/BULK_IMPORT_README.md`)

  console.log('\n✨ All import samples generated successfully!')
} catch (error) {
  console.error('❌ Error generating samples:', error)
  process.exit(1)
}
