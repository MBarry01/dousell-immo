import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const today = new Date();

        console.log('=== DEBUG REMINDERS ===');
        console.log('Date actuelle:', today.toISOString());
        console.log('Jour du mois:', today.getDate());

        // Récupérer toutes les transactions non payées
        const { data: transactions, error } = await supabase
            .from("rental_transactions")
            .select(`
                id,
                amount_due,
                status,
                period_month,
                period_year,
                reminder_sent,
                leases (
                    id,
                    billing_day,
                    tenant_email,
                    tenant_name
                )
            `)
            .neq("status", "paid")
            .gte("period_year", today.getFullYear() - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const debug: any[] = [];

        for (const tx of transactions || []) {
            const lease = Array.isArray(tx.leases) ? tx.leases[0] : tx.leases;

            if (!lease) continue;

            const billingDay = lease.billing_day || 5;
            const dueDate = new Date(tx.period_year, tx.period_month - 1, billingDay);
            const daysOverdue = differenceInDays(today, dueDate);

            const info = {
                id: tx.id,
                tenant: lease.tenant_name,
                email: lease.tenant_email,
                period: `${tx.period_month}/${tx.period_year}`,
                billing_day: billingDay,
                due_date: dueDate.toISOString().split('T')[0],
                days_overdue: daysOverdue,
                status: tx.status,
                reminder_sent: tx.reminder_sent,
                should_send: daysOverdue >= 5 && !tx.reminder_sent && !!lease.tenant_email,
                reasons: []
            };

            if (daysOverdue < 5) info.reasons.push('Pas encore J+5');
            if (tx.reminder_sent) info.reasons.push('Relance déjà envoyée');
            if (!lease.tenant_email) info.reasons.push('Email manquant');

            debug.push(info);
        }

        return NextResponse.json({
            today: today.toISOString(),
            current_day: today.getDate(),
            total_unpaid: transactions?.length || 0,
            transactions: debug,
            eligible_for_reminder: debug.filter(t => t.should_send).length
        });

    } catch (error: any) {
        console.error("Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
