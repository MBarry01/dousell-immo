import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const params = new URLSearchParams({
            q: query,
            format: "json",
            addressdetails: "1",
            limit: "5",
            countrycodes: "sn",
            "accept-language": "fr",
        });

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                headers: {
                    'User-Agent': 'DouselImmo/1.0 (https://dousell.com)',
                },
            }
        );

        if (!response.ok) {
            console.error("[Address Proxy] Nominatim error:", response.statusText);
            return NextResponse.json([]);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Address Proxy] Fetch error:", error);
        return NextResponse.json([]);
    }
}
