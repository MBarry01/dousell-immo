import { internalProcessReminders } from "@/lib/reminders-service";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Optional: Verify specific header for security (e.g. CRON_SECRET)
    // const authHeader = request.headers.get('authorization');
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        const supabaseAdmin = createAdminClient();
        const result = await internalProcessReminders(supabaseAdmin);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
