
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserTeams() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("Missing credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const email = "barrymohamadou98@gmail.com"; // The user from the logs

    console.log(`Checking teams for user: ${email}`);

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error("Error listing users:", userError);
        return;
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
        console.error("User not found");
        return;
    }

    console.log(`Found user ID: ${user.id}`);

    const { data: memberships, error: memError } = await supabase
        .from('team_members')
        .select('*, teams(*)')
        .eq('user_id', user.id);

    if (memError) {
        console.error("Error fetching memberships:", memError);
        return;
    }

    console.log("Memberships found:", JSON.stringify(memberships, null, 2));
}

checkUserTeams();
