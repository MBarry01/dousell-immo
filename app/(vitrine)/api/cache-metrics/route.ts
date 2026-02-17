/**
 * API Endpoint : Métriques de Cache
 *
 * GET /api/cache-metrics
 *
 * Retourne les statistiques du cache Redis en temps réel :
 * - Hit rate
 * - Latence moyenne
 * - Erreurs
 *
 * Sécurité : À protéger avec authentification admin en prod
 *
 * @example
 * fetch('/api/cache-metrics')
 *   .then(res => res.json())
 *   .then(data => console.log(data.metrics))
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheMetrics } from '@/lib/cache/advanced-patterns';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // SÉCURITÉ : Vérifier que c'est un admin
    // À décommenter en production
    /*
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }
    */

    // Récupérer les métriques
    const stats = CacheMetrics.getStats();

    return NextResponse.json({
      success: true,
      metrics: stats,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    console.error('Error fetching cache metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST : Reset des métriques (dev/testing only)
 */
export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ : Bloquer en production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Reset interdit en production' },
        { status: 403 }
      );
    }

    CacheMetrics.reset();

    return NextResponse.json({
      success: true,
      message: 'Métriques réinitialisées',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error resetting cache metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la réinitialisation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
