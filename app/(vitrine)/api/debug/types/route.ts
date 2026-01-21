
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Check external listings only
        const { data: external } = await supabase
            .from("external_listings")
            .select("category, type, source_site")
            .limit(100);

        const extCounts: Record<string, number> = {};
        const extTypes: Record<string, number> = {};

        external?.forEach((e) => {
            const cat = e.category || "UNDEFINED";
            extCounts[cat] = (extCounts[cat] || 0) + 1;

            const typ = e.type || "UNDEFINED";
            extTypes[typ] = (extTypes[typ] || 0) + 1;
        });

        return NextResponse.json({
            external_total: external?.length,
            external_categories: extCounts,
            external_types: extTypes,
            samples: external?.slice(0, 5)
        });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
