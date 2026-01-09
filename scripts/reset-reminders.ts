
import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetReminders() {
    console.log("Resetting reminder flags...");

    // Reset for the pending transactions of 2024/2025
    const { data: transactions, error } = await supabase
        .from("rental_transactions")
        .update({ reminder_sent: false })
        .neq("status", "paid")
        .eq("reminder_sent", true)
        .gte("period_year", 2024)
        .select();

    if (error) {
        console.error("Error resetting:", error);
        return;
    }

    console.log(`Reset ${transactions.length} transactions. They are now ready to receive reminders again.`);
}

resetReminders();
