import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSupabase() {
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Provide an existing User ID if possible, or we just try inserting with a random UUID to see enum failure.
    // Usually Foreign Key Constraint drops before Enum check, but let's see.
    // Try calling the RPC `create_notification` to bypass FK temporarily if needed.

    const { data, error } = await supabase.from('notifications').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Check',
        message: 'Check msg',
        type: 'message'
    });

    if (error) {
        console.error("INSERT ERROR =>", error);
    } else {
        console.log("INSERT SUCCESS =>", data);
    }
}

testSupabase();
