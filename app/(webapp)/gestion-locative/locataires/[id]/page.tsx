import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { TenantProfileClient } from "./TenantProfileClient";

export default async function TenantProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { id } = await params;

    const { data: lease } = await supabase
        .from("leases")
        .select(`
            *,
            rental_transactions (
                id,
                period_month,
                period_year,
                amount_due,
                status,
                paid_at,
                created_at
            ),
            maintenance_requests (
                id,
                description,
                status,
                created_at
            )
        `)
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!lease) notFound();

    // Calculate generic stats
    const transactions = lease.rental_transactions || [];
    const totalPaid = transactions
        .filter((t: any) => t.status === "paid")
        .reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);

    const pendingAmount = transactions
        .filter((t: any) => t.status === "pending")
        .reduce((sum: number, t: any) => sum + (t.amount_due || 0), 0);

    const overdueCount = transactions.filter((t: any) => t.status === "overdue").length;

    return (
        <TenantProfileClient
            lease={lease}
            transactions={transactions}
            totalPaid={totalPaid}
            pendingAmount={pendingAmount}
            overdueCount={overdueCount}

            user={user}
            profile={profile}
        />
    );
}
