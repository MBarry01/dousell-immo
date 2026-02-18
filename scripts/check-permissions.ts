
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

async function checkPermissions() {
    // 1. Find User
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.users.find(u => u.email?.includes('barry')); // Fuzzy match based on known email part

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

    // 3. Check Team Member Status
    const { data: member } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', team.id)
        .single();

    console.log('Team Member Status:', member ? member.role : 'Not a member');

    // 4. Check Temporary Permissions
    const { data: perms, error: permError } = await supabase
        .from('temporary_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', team.id);

    if (permError) {
        console.error('Error fetching perms:', permError);
    } else {
        console.log('Temporary Permissions (Raw Table):');
        console.table(perms);

        // Check expiration
        const now = new Date();
        perms?.forEach(p => {
            const expires = new Date(p.expires_at);
            console.log(`Perm ${p.permission}: Expires ${expires.toISOString()} -> Active? ${expires > now}`);
        });
    }

    // 5. Check RPC result
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_active_temporary_permissions', {
        p_team_id: team.id,
        p_user_id: user.id
    });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
    } else {
        console.log('RPC Result (what the widget sees):');
        console.table(rpcData);
    }
}

checkPermissions();
