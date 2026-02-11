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

    // 2. Search Properties (Public)
    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, location')
        .eq('validation_status', 'approved')
        .eq('status', 'disponible')
        .or(`title.ilike.%${query}%,location->>city.ilike.%${query}%`)
        .limit(5);

    if (properties) {
        results.push(...properties.map(p => ({
            id: p.id,
            label: p.title || (p.location as any)?.city || "Bien",
            subLabel: (p.location as any)?.city,
            type: 'property' as const,
            url: `/recherche?q=${encodeURIComponent(p.title || "")}`
        })));
    }

    // 3. Search External Listings (Public) - Critical for Dakar results
    const { data: externalProperties } = await supabase
        .from('external_listings')
        .select('id, title, city')
        .or(`title.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(5);

    if (externalProperties) {
        results.push(...externalProperties.map(p => ({
            id: p.id,
            label: p.title,
            subLabel: p.city,
            type: 'property' as const,
            url: `/recherche?q=${encodeURIComponent(p.title || p.city || "")}`
        })));
    }

    return NextResponse.json(results);
}
