/**
 * Cron Job: Alertes de fin de bail (J-180 et J-90)
 *
 * Se déclenche quotidiennement à 08:00 (heure Sénégal)
 * Envoie des alertes aux propriétaires selon le cadre juridique sénégalais:
 * - J-180 (6 mois): Alerte stratégique pour congé propriétaire (délai légal)
 * - J-90 (3 mois): Alerte de négociation avant tacite reconduction
 *
 * Configuration Vercel Cron dans vercel.json
 */

import { checkLeaseExpirations } from "@/lib/lease-expiration-service";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vérification de sécurité : Seul Vercel Cron peut appeler cette route
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        console.log('🔓 MODE DÉVELOPPEMENT : Cron exécuté sans authentification');
    } else {
        const authHeader = request.headers.get('authorization');
        const CRON_SECRET = process.env.CRON_SECRET;

        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.error('❌ Tentative d\'accès non autorisée au Cron Job');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('🚀 [CRON] Démarrage des alertes de fin de bail...');

        const result = await checkLeaseExpirations();

        console.log(`✅ [CRON] Traitement terminé: ${result.count} alerte(s) envoyée(s)`);

        return NextResponse.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("❌ [CRON] Erreur lors du traitement des alertes:", error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            count: 0
        }, { status: 500 });
    }
}
