import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const args = process.argv.slice(2);
    const statusIndex = args.indexOf('--status');
    const emailIndex = args.indexOf('--email');

    const targetStatus = statusIndex !== -1 ? args[statusIndex + 1] : 'expired';
    const targetEmail = emailIndex !== -1 ? args[emailIndex + 1] : null;

    if (!targetEmail) {
        console.error('❌ Usage: npx tsx scripts/test-paywall.ts --email user@example.com [--status expired|active|trial]');
        process.exit(1);
    }

    console.log(`🔍 Finding user with email: ${targetEmail}...`);

    // 1. Get user ID from email
    const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single();

    if (userError || !userData) {
        console.error('❌ User not found in profiles table:', userError?.message);
        process.exit(1);
    }

    const userId = userData.id;
    console.log(`✅ Found user ID: ${userId}`);

    // 2. Find team for this user
    const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    if (teamError || !teamMember) {
        console.error('❌ Team membership not found:', teamError?.message || 'User is not in a team');
        process.exit(1);
    }

    const teamId = teamMember.team_id;
    console.log(`✅ Found team ID: ${teamId}`);

    // 3. Update team subscription status
    console.log(`🚀 Updating team ${teamId} status to: ${targetStatus}...`);

    const updateData: any = {
        subscription_status: targetStatus,
        updated_at: new Date().toISOString()
    };

    if (targetStatus === 'expired') {
        // Set trial as ended in the past
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        updateData.subscription_trial_ends_at = lastMonth.toISOString();
    } else if (targetStatus === 'trial') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updateData.subscription_trial_ends_at = nextMonth.toISOString();
    } else if (targetStatus === 'active') {
        updateData.subscription_trial_ends_at = null;
    }

    const { error: updateError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId);

    if (updateError) {
        console.error('❌ Error updating team:', updateError.message);
        process.exit(1);
    }

    console.log(`\n✨ Successfully updated team to ${targetStatus}!`);
    console.log(`🔗 Go to /gestion and refresh to see the effect.`);
}

main().catch(err => {
    console.error('💥 Script crashed:', err);
    process.exit(1);
});
