/**
 * Bulk Property Import API
 *
 * POST /api/admin/bulk-import
 *
 * Accepts a JSON payload with an array of properties to import.
 * Only admins can access this endpoint.
 * Properties are created with validation_status='pending' for review.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { requireAdmin } from '@/lib/permissions'
import { createClient } from '@/utils/supabase/server'
import { validateBulkImport } from '@/lib/schemas/bulkImportSchema'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin access
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - not authenticated' }, { status: 401 })
    }

    await requireAdmin()

    // 2. Parse request body
    let payload
    try {
      payload = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // 3. Validate payload
    const validation = validateBulkImport(payload)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 422 }
      )
    }

    // 4. Prepare properties for insertion
    const supabase = await createClient()
    const properties = validation.data!.properties.map((prop) => ({
      title: prop.title,
      description: prop.description,
      price: prop.price,
      category: prop.category,
      location: {
        city: prop.city.toLowerCase(),
        landmark: prop.district ? prop.district.toLowerCase() : null,
        coordinates: { lat: 14.6928, lng: -17.4467 }, // Default Dakar center
      },
      specs: {
        surface: prop.surface || null,
        rooms: prop.rooms || null,
        bedrooms: prop.bedrooms || null,
        bathrooms: prop.bathrooms || null,
      },
      details: {
        type: prop.type,
      },
      agent: {
        name: prop.agent_name,
        phone: prop.agent_phone,
        email: prop.agent_email || null,
      },
      status: 'disponible',
      validation_status: 'pending', // Admin review required before publishing
      created_by: user.id,
      images: [],
    }))

    // 5. Insert into database
    const { data, error } = await supabase.from('properties').insert(properties).select('id')

    if (error) {
      console.error('[Bulk Import] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to import properties: ' + error.message },
        { status: 500 }
      )
    }

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        imported: data?.length || 0,
        message: `${data?.length || 0} properties imported and pending review`,
        propertyIds: data?.map((p) => p.id) || [],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Bulk Import] Error:', error)

    // Handle permission errors specifically
    if (error.message?.includes('Permission') || error.message?.includes('Admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/bulk-import
 *
 * Returns example payload for bulk import
 */
export async function GET(request: NextRequest) {
  const example = {
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
    ],
  }

  return NextResponse.json(example)
}
