/**
 * CSV to Property JSON Parser
 *
 * Converts CSV format to bulk import JSON format.
 * Handles header mapping and data type conversion.
 */

import { BulkPropertyImportSchema, validateBulkImport } from '@/lib/schemas/bulkImportSchema'

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Expected CSV headers (case-insensitive):
 * - title
 * - description
 * - price (will be multiplied by 100 for centimes)
 * - category (vente|location)
 * - type
 * - city
 * - district (optional)
 * - surface (optional, in m²)
 * - rooms (optional)
 * - bedrooms (optional)
 * - bathrooms (optional)
 * - agent_name
 * - agent_phone
 * - agent_email (optional)
 */

export interface ParsedCSVResult {
  success: boolean
  properties: any[]
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  summary: {
    total: number
    valid: number
    invalid: number
  }
}

/**
 * Parse CSV text to properties array
 *
 * @param csvText - Raw CSV text
 * @returns Parsed properties and validation errors
 */
export function parseCSV(csvText: string): ParsedCSVResult {
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')) // Skip empty lines and comments

  if (lines.length < 2) {
    return {
      success: false,
      properties: [],
      errors: [{ row: 0, field: 'csv', message: 'CSV must have header and at least 1 data row' }],
      summary: { total: 0, valid: 0, invalid: 0 },
    }
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())
  const errors: Array<{ row: number; field: string; message: string }> = []
  const properties: any[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const row = i + 1 // Human-readable row number
    const values = parseCSVLine(lines[i])

    if (values.length === 0) continue // Skip empty rows

    // Map values to object
    const obj: any = {}
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        obj[header] = values[idx].trim()
      }
    })

    // Validate with schema
    try {
      const validated = BulkPropertyImportSchema.parse(obj)
      properties.push(validated)
    } catch (error: any) {
      if (error instanceof Error && 'errors' in error) {
        ;(error as any).errors.forEach((e: any) => {
          errors.push({
            row,
            field: String(e.path[0] || 'unknown'),
            message: e.message,
          })
        })
      } else {
        errors.push({
          row,
          field: 'unknown',
          message: String(error),
        })
      }
    }
  }

  return {
    success: errors.length === 0,
    properties,
    errors,
    summary: {
      total: lines.length - 1,
      valid: properties.length,
      invalid: errors.length,
    },
  }
}

/**
 * Parse a single CSV line, handling quoted values and commas inside quotes
 *
 * @param line - CSV line
 * @returns Array of values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current) // Add last field
  return result
}

// ============================================================================
// Bulk Import Helper
// ============================================================================

/**
 * Parse CSV and prepare for bulk import
 *
 * @param csvText - Raw CSV text
 * @returns Object ready for bulk import API
 */
export function csvToBulkImportPayload(csvText: string) {
  const parsed = parseCSV(csvText)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.errors,
      payload: null,
    }
  }

  const payload = {
    properties: parsed.properties,
  }

  const validation = validateBulkImport(payload)

  return {
    success: validation.success,
    errors: validation.errors,
    payload: validation.data,
  }
}

// ============================================================================
// CSV Template Generator
// ============================================================================

/**
 * Generate CSV template with headers
 */
export function generateCSVTemplate(): string {
  const headers = [
    'title',
    'description',
    'price',
    'category',
    'type',
    'city',
    'district',
    'surface',
    'rooms',
    'bedrooms',
    'bathrooms',
    'agent_name',
    'agent_phone',
    'agent_email',
  ]

  const exampleRow = [
    'Magnifique Appartement Plateau',
    'Appartement moderne avec vue sur l\'océan, 3 chambres, 2 SDB',
    '50000000',
    'vente',
    'Appartement',
    'Dakar',
    'Plateau',
    '120',
    '3',
    '3',
    '2',
    'Jean Dupont',
    '+221771234567',
    'jean@immobilier.sn',
  ]

  const headerLine = headers.map((h) => `"${h}"`).join(',')
  const exampleLine = exampleRow
    .map((v) => {
      // Quote values that contain commas, quotes, or newlines
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"` // Escape quotes by doubling
      }
      return `"${v}"`
    })
    .join(',')

  return `${headerLine}\n${exampleLine}\n`
}
