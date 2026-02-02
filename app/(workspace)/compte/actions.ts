'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateFinancials, LeaseInput, TransactionInput } from '@/lib/finance';

export interface DashboardStats {
    activeLeases: number;
    pendingPayments: number;
    maintenanceRequests: number;
    financials?: {
        total: number;
        collected: number;
        percent: number;
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { activeLeases: 0, pendingPayments: 0, maintenanceRequests: 0 };
    }

    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // 1. Fetch all ACTIVE LEASES
        const { data: activeLeasesData } = await supabase
            .from('leases')
            .select('id, monthly_amount, status, start_date, billing_day')
            .eq('owner_id', user.id)
            .eq('status', 'active');

        const allActiveLeases = (activeLeasesData || []) as LeaseInput[];

        // 2. Fetch TRANSACTIONS for the current month
        const { data: rawTransactions } = await supabase
            .from('rental_transactions')
            .select('id, lease_id, amount_due, status') // Removed amount_paid
            .eq('period_month', currentMonth)
            .eq('period_year', currentYear);

        // Polyfill amount_paid for Finance Guard compatibility
        const transactions: TransactionInput[] = (rawTransactions || []).map(t => ({
            ...t,
            // Fallback: Si status=paid, on considère que tout est payé.
            // Si la colonne amount_paid existait, on l'utiliserait.
            amount_paid: (t.status?.toLowerCase() === 'paid') ? t.amount_due : 0
        }));

        // 3. Open Issues count
        const { count: issuesCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .in('status', ['open', 'pending']);

        // 4. Calculate Financials using the Guard
        const kpis = calculateFinancials(allActiveLeases, transactions, [], today);

        return {
            activeLeases: allActiveLeases.length,
            pendingPayments: kpis.pendingCount + kpis.overdueCount,
            maintenanceRequests: issuesCount || 0,
            financials: {
                total: kpis.totalExpected,
                collected: kpis.totalCollected,
                percent: kpis.collectionRate
            }
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return { activeLeases: 0, pendingPayments: 0, maintenanceRequests: 0 };
    }
}
