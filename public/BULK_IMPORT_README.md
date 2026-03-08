# Property Bulk Import Samples

## JSON Format

Use the JSON format for importing properties programmatically or from admin UI.

**File**: `sample-import.json`

**Usage**:
1. Go to Admin Dashboard > Bulk Import
2. Copy the JSON from `sample-import.json`
3. Paste into the textarea
4. Click "Import"

**Format**:
```json
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
```

## CSV Format

Use CSV for bulk imports from spreadsheets (Excel, Google Sheets).

**File**: `sample-import.csv`

**Headers** (in order):
```
title, description, price, category, type, city, district, surface, rooms, bedrooms, bathrooms, agent_name, agent_phone, agent_email
```

**Rules**:
- Quote values containing commas: `"Value with, comma"`
- Escape quotes by doubling: `"Value with ""quote"" inside"`
- Price is in centimes (multiply XOF by 100)

## Property Types

Valid values for `type` field:
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

After import, properties are marked as `validation_status: pending`.

**Admin Review Required**:
1. Properties are not immediately visible
2. Admin must approve each property
3. Once approved (`validation_status: approved`), properties appear in search results

## Troubleshooting

### Import Failed
- Check JSON/CSV format is valid
- Ensure required fields are present
- Verify phone numbers match regex: `^+?[0-9s-()]+$`
- Check price is numeric (no currency symbols)

### Price Format
- Input: `50000000` (price in XOF)
- Stored as: `5000000000` (in centimes, multiplied by 100)
- Display: `50 000 000 XOF`

## Sample Files

- `sample-import.json` - 5 example properties in JSON format
- `sample-import.csv` - Template CSV with 1 example property
