
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load .env and .env.local
const rootDir = process.cwd();
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestPermission() {
    // 1. Find User by Email (fuzzy match)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.users.find(u => u.email?.toLowerCase().includes('barry'));

    if (!user) {
        console.log('User not found');
        return;
    }
    console.log(`Found User: ${user.email} (${user.id})`);

    // 2. Find Team "Baraka Immo"
    const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .ilike('name', '%Baraka%');

    if (teamError || !teams?.length) {
        console.log('Team Baraka Immo not found', teamError);
        return;
    }

    const team = teams[0];
    console.log(`Found Team: ${team.name} (${team.id})`);

    // 3. Add Temporary Permission (valid for 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('temporary_permissions')
        .insert({
            user_id: user.id,
            team_id: team.id,
            permission: 'properties.view', // Granting view access to verify the fix
            expires_at: expiresAt,
            granted_by: user.id, // Self-grant for testing (usually admin)
            reason: 'Testing widget visibility'
        })
        .select();

    if (error) {
        console.error('Error adding permission:', error);
    } else {
        console.log('Successfully added test permission:', data);
    }
}

addTestPermission();
