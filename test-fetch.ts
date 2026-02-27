import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFetch() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/properties_count?select=*`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
        const response = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        const data = await response.json();
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testFetch();
