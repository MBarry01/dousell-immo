/**
 * Bulk Property Import Schema
 *
 * Zod schema for validating bulk property imports.
 * Supports both JSON and CSV data with strict type checking.
 */

import { z } from 'zod'

// ============================================================================
// Individual Property Schema
// ============================================================================

export const BulkPropertyImportSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must not exceed 5000 characters'),

  price: z
    .string()
    .regex(/^\d+$/, 'Price must be a number')
    .transform((v) => parseInt(v) * 100), // Convert to centimes

  category: z.enum(['vente', 'location']),

  type: z.enum([
    'Appartement',
    'Villa',
    'Maison',
    'Studio',
    'Terrain',
    'Immeuble',
    'Bureau',
    'Magasin',
    'Hangar',
    'Local commercial',
    'Chambre',
    'Duplex',
  ]),

  city: z.string().min(2, 'City must be at least 2 characters').max(50),

  district: z.string().min(2, 'District must be at least 2 characters').max(100).optional(),

  surface: z
    .string()
    .regex(/^\d+$/, 'Surface must be a number')
    .transform((v) => parseInt(v))
    .optional()
    .refine((v) => !v || v > 0, 'Surface must be greater than 0'),

  rooms: z
    .string()
    .regex(/^\d+$/, 'Rooms must be a number')
    .transform((v) => parseInt(v))
    .optional()
    .refine((v) => !v || v > 0, 'Rooms must be greater than 0'),

  bedrooms: z
    .string()
    .regex(/^\d+$/, 'Bedrooms must be a number')
    .transform((v) => parseInt(v))
    .optional()
    .refine((v) => !v || v > 0, 'Bedrooms must be greater than 0'),

  bathrooms: z
    .string()
    .regex(/^\d+$/, 'Bathrooms must be a number')
    .transform((v) => parseInt(v))
    .optional()
    .refine((v) => !v || v > 0, 'Bathrooms must be greater than 0'),

  agent_name: z
    .string()
    .min(2, 'Agent name must be at least 2 characters')
    .max(100, 'Agent name must not exceed 100 characters'),

  agent_phone: z.string().regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format'),

  agent_email: z.string().email('Invalid email format').optional(),
})

export type BulkPropertyImport = z.infer<typeof BulkPropertyImportSchema>

// ============================================================================
// Bulk Import Payload Schema
// ============================================================================

export const BulkImportPayloadSchema = z.object({
  properties: z
    .array(BulkPropertyImportSchema)
    .min(1, 'At least 1 property is required')
    .max(100, 'Maximum 100 properties per batch'),
})

export type BulkImportPayload = z.infer<typeof BulkImportPayloadSchema>

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate a bulk import payload
 *
 * @param payload - The payload to validate
 * @returns Object with success flag and results or errors
 */
export function validateBulkImport(payload: unknown) {
  try {
    const validated = BulkImportPayloadSchema.parse(payload)
    return {
      success: true,
      data: validated,
      errors: [],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      }
    }

    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: String(error) }],
    }
  }
}
