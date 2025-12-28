import { internalProcessReminders } from "@/lib/reminders-service";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Vérification de sécurité : Vercel Cron envoie un header spécial
    const authHeader = request.headers.get('authorization');

    // En production, vérifier le header Authorization de Vercel Cron
    // Vercel envoie automatiquement un Bearer token pour les crons
    if (process.env.NODE_ENV === 'production') {
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron access attempt');
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('[CRON] Starting reminders processing...');
        const supabaseAdmin = createAdminClient();
        const result = await internalProcessReminders(supabaseAdmin);
        console.log('[CRON] Reminders processing completed:', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[CRON] Job Failed:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
