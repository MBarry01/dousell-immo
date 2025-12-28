import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const supabase = createAdminClient();

        // Reset reminder_sent pour toutes les transactions non payées de Décembre 2025
        const { data, error } = await supabase
            .from("rental_transactions")
            .update({ reminder_sent: false })
            .eq("period_month", 12)
            .eq("period_year", 2025)
            .neq("status", "paid")
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${data?.length || 0} transactions réinitialisées`,
            transactions: data
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
