
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

// Initialize Supabase client with Service Role Key (admin privileges)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixMissingTeams() {
    console.log('🔍 Checking for users without teams...');

    // 1. Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        // 2. Check if user belongs to a team
        const { data: memberships, error: memberError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id);

        if (memberError) {
            console.error(`Error checking membership for ${user.email}:`, memberError.message);
            continue;
        }

        if (memberships && memberships.length > 0) {
            console.log(`✅ User ${user.email} already has a team.`);
            continue;
        }

        console.log(`⚠️ User ${user.email} has NO team. Creating one...`);

        // 3. Create Personal Team
        const userName = user.email?.split('@')[0] || 'Utilisateur';
        const slug = `perso-${user.id.substring(0, 8)}`;
        const teamName = `Espace de ${userName}`;

        // Create Team
        const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert({ name: teamName, slug })
            .select()
            .single();

        if (teamError) {
            // If slug constraint fails, try generating a random one
            console.warn(`Initial team creation failed for ${user.email}:`, teamError.message);
            // Retry with random suffix
            const randomSlug = `perso-${user.id.substring(0, 4)}-${Math.floor(Math.random() * 1000)}`;
            const { data: retryTeam, error: retryError } = await supabase
                .from('teams')
                .insert({ name: teamName, slug: randomSlug })
                .select()
                .single();

            if (retryError) {
                console.error(`❌ Failed to create team for ${user.email} after retry:`, retryError.message);
                continue;
            }

            if (retryTeam) {
                await addMember(retryTeam.id, user.id, user.email || 'unknown');
            }
        } else if (newTeam) {
            await addMember(newTeam.id, user.id, user.email || 'unknown');
        }
    }

    console.log('\n✨ Team fixation process completed.');
}

async function addMember(teamId: string, userId: string, email: string) {
    const { error: memberInsertError } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: userId,
            role: 'owner',
            status: 'active'
        });

    if (memberInsertError) {
        console.error(`❌ Failed to add member for ${email}:`, memberInsertError.message);
    } else {
        console.log(`✅ Successfully created team and added owner: ${email}`);
    }
}

fixMissingTeams().catch(console.error);
