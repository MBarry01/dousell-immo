import { internalProcessReminders } from "@/lib/reminders-service";
import { checkLeaseExpirations } from "@/lib/lease-expiration-service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vérification de sécurité : Vercel Cron envoie un header spécial
    const authHeader = request.headers.get('authorization');

    // Vérifier le secret dans tous les environnements
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error('[CRON] CRON_SECRET manquant');
        return new NextResponse('Config error', { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
        console.error('[CRON] Tentative d\'accès non autorisée');
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[CRON] Starting daily tasks (reminders + lease expirations)...');

        // 1. Process reminders
        console.log('[CRON] Processing reminders...');
        const remindersResult = await internalProcessReminders(supabaseAdmin);
        console.log('[CRON] Reminders completed:', remindersResult);

        // 2. Check lease expirations
        console.log('[CRON] Checking lease expirations...');
        const expirationsResult = await checkLeaseExpirations();
        console.log('[CRON] Lease expirations completed:', expirationsResult);

        return NextResponse.json({
            reminders: remindersResult,
            expirations: expirationsResult,
            success: true
        });
    } catch (error) {
        console.error("[CRON] Job Failed:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
