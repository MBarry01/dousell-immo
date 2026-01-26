import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { TenantProfileClient } from "./TenantProfileClient";

export default async function TenantProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { id } = await params;

    // Récupérer les équipes de l'utilisateur
    const { data: teamMemberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

    const userTeamIds = teamMemberships?.map(tm => tm.team_id) || [];

    // Construire le filtre OR : owner_id OU team_id
    let leaseQuery = supabase
        .from("leases")
        .select(`
            *,
            properties:property_id(id, title, images),
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
        .eq("id", id);

    // Filter: owner_id = user.id OR team_id in user's teams
    if (userTeamIds.length > 0) {
        leaseQuery = leaseQuery.or(`owner_id.eq.${user.id},team_id.in.(${userTeamIds.join(',')})`);
    } else {
        leaseQuery = leaseQuery.eq("owner_id", user.id);
    }

    const { data: lease } = await leaseQuery.single();

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
