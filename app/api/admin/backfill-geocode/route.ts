import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { smartGeocode } from '@/lib/geocoding';

// Initialisation de Supabase avec le service role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API pour géocoder les annonces externes existantes qui n'ont pas de coordonnées
 * POST /api/admin/backfill-geocode
 * 
 * Options (body JSON):
 * - limit: nombre max d'annonces à traiter (défaut: 50)
 * - source: filtrer par source (optionnel)
 */
export async function POST(req: Request) {
    try {
        // Vérification basique d'autorisation (à renforcer en prod)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}` && process.env.ADMIN_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const limit = body.limit || 50;
        const source = body.source;

        // Récupérer les annonces sans coordonnées
        let query = supabase
            .from('external_listings')
            .select('id, location, city')
            .is('coords_lat', null)
            .limit(limit);

        if (source) {
            query = query.eq('source_site', source);
        }

        const { data: listings, error: selectError } = await query;

        if (selectError) {
            throw new Error(`Select error: ${selectError.message}`);
        }

        if (!listings || listings.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Aucune annonce à géocoder',
                processed: 0,
            });
        }

        console.log(`[Backfill] Géocodage de ${listings.length} annonces...`);

        let processed = 0;
        let errors = 0;

        for (const listing of listings) {
            try {
                // Géocodage dynamique via Nominatim
                const coords = await smartGeocode(
                    undefined,
                    listing.location || '',
                    listing.city || 'Dakar'
                );

                // Mise à jour en base
                const { error: updateError } = await supabase
                    .from('external_listings')
                    .update({
                        coords_lat: coords.lat,
                        coords_lng: coords.lng,
                    })
                    .eq('id', listing.id);

                if (updateError) {
                    console.error(`[Backfill] Update error for ${listing.id}:`, updateError);
                    errors++;
                } else {
                    processed++;
                    console.log(`[Backfill] ✓ ${listing.location} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                }

                // Rate limiting pour Nominatim (1 req/sec)
                await new Promise(resolve => setTimeout(resolve, 1100));
            } catch (err) {
                console.error(`[Backfill] Error for ${listing.id}:`, err);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Géocodage terminé`,
            stats: {
                total: listings.length,
                processed,
                errors,
                remaining: listings.length - processed,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Backfill] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET pour vérifier le statut
export async function GET() {
    try {
        // Compter les annonces sans coordonnées
        const { count, error } = await supabase
            .from('external_listings')
            .select('*', { count: 'exact', head: true })
            .is('coords_lat', null);

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({
            status: 'ready',
            pending: count || 0,
            message: count ? `${count} annonces en attente de géocodage` : 'Toutes les annonces sont géocodées',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
