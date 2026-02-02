import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const results = [];

    // 1. Search Tenants (Authenticated only)
    if (user) {
        // Get team memberships to allow searching across team leases
        const { data: teamMemberships } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id);

        const userTeamIds = teamMemberships?.map(tm => tm.team_id) || [];

        let leasesQuery = supabase
            .from('leases')
            .select('id, tenant_name, property_address, status')
            .ilike('tenant_name', `%${query}%`)
            .limit(5);

        // Apply ownership/team filter logic similar to getLeasesByOwner
        if (userTeamIds.length > 0) {
            leasesQuery = leasesQuery.or(`owner_id.eq.${user.id},team_id.in.(${userTeamIds.join(',')})`);
        } else {
            leasesQuery = leasesQuery.eq("owner_id", user.id);
        }

        // We might want to include terminated leases? 
        // Usually search should find everything.

        const { data: tenants } = await leasesQuery;

        if (tenants) {
            results.push(...tenants.map(t => ({
                id: t.id,
                label: t.tenant_name,
                subLabel: t.property_address,
                type: 'tenant',
                url: `/gestion?q=${encodeURIComponent(t.tenant_name)}&tab=tenants`
            })));
        }
    }

    // 2. Search Properties (Public + Private?)
    // For now, let's search "My Properties" if logged in, or "Public Properties" if not?
    // The user requirement implies finding THEIR stuff in the dashboard.
    // But usage in public area implies finding public stuff.
    // Let's do a hybrid approach: Public properties + My properties (if logged in and not already found)

    // Actually, for simplicity and safety, let's search ALL approved properties (Public Search)
    // This is what getSearchSuggestions in propertyService does.
    // But here we want the ID/Link to be correct.

    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, address, city')
        .eq('validation_status', 'approved') // Only approved
        .eq('status', 'disponible') // Only available
        .or(`title.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(5);

    if (properties) {
        results.push(...properties.map(p => ({
            id: p.id,
            label: p.title || p.address,
            subLabel: p.city,
            type: 'property',
            url: `/recherche?q=${encodeURIComponent(p.title || "")}` // Public search link
            // Or if it's THEIR property, maybe link to `/gestion`? 
            // Complexity: checking ownership for each. 
            // For now, standardize on public search link or generic query.
        })));
    }

    return NextResponse.json(results);
}
