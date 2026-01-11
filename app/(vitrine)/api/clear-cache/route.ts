/**
 * API Endpoint : Vider le cache de gestion locative
 *
 * DELETE /api/clear-cache
 *
 * Vide toutes les clés de cache rentals:* sur Upstash Redis
 * Utile quand les données sont modifiées directement en base
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/cache/redis-client';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    console.log(`[clear-cache] User ${user.id} requesting cache clear`);

    // Récupérer les clés à supprimer pour cet utilisateur
    const keysToDelete = [
      `rentals:leases:${user.id}:active`,
      `rentals:leases:${user.id}:terminated`,
      `rentals:leases:${user.id}:all`,
      `rentals:owner_profile:${user.id}`,
      `rentals:rental_stats:${user.id}`,
      `rentals:late_payments:${user.id}`,
    ];

    // Supprimer les clés
    if (keysToDelete.length > 0) {
      await redis.del(keysToDelete);
      console.log(`[clear-cache] Deleted ${keysToDelete.length} keys for user ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cache vidé (${keysToDelete.length} clés)`,
      deletedKeys: keysToDelete,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[clear-cache] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du vidage du cache',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST : Vider TOUT le cache rentals (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Pour dev, permettre aussi aux propriétaires
    const isAdmin = profile?.role === 'admin' || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Scanner et supprimer toutes les clés rentals:*
    const { Redis } = await import('@upstash/redis');

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        { error: 'Redis non configuré' },
        { status: 500 }
      );
    }

    const upstash = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const keysToDelete: string[] = [];
    let cursor: string | number = 0;

    do {
      const result = await upstash.scan(cursor, { match: 'rentals:*', count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];
      keysToDelete.push(...keys);
    } while (cursor !== 0 && cursor !== '0');

    if (keysToDelete.length > 0) {
      // Supprimer par lots
      for (let i = 0; i < keysToDelete.length; i += 10) {
        const batch = keysToDelete.slice(i, i + 10);
        await upstash.del(...batch);
      }
    }

    console.log(`[clear-cache] Admin ${user.id} cleared ALL rental cache (${keysToDelete.length} keys)`);

    return NextResponse.json({
      success: true,
      message: `Tout le cache rental vidé (${keysToDelete.length} clés)`,
      deletedKeys: keysToDelete,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[clear-cache] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du vidage du cache',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
