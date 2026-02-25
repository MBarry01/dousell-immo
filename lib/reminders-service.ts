import { SupabaseClient } from "@supabase/supabase-js";
import { differenceInDays } from "date-fns";
import { sendEmail } from "@/lib/mail";

// Types
export interface ReminderResult {
    count: number;
    message: string;
    errors?: Error[];
}

/**
 * Core logic to process reminders.
 * Accepts a Supabase client (either User scoped or Admin scoped).
 */
export async function internalProcessReminders(supabase: SupabaseClient): Promise<ReminderResult> {
    console.log("🕵️ Recherche des impayés de +5 jours...");

    const today = new Date();

    // Fetch ALL unpaid transactions that haven't been reminded yet
    // We'll calculate the actual due date using billing_day and filter in code
    // This ensures we respect the billing_day configured in the UI modal
    const { data: transactions, error } = await supabase
        .from("rental_transactions")
        .select(`
      id,
      amount_due,
      status,
      period_month,
      period_year,
      period_start,
      reminder_sent,
      leases (
        id,
        billing_day,
        tenant_email,
        tenant_name,
        property_id,
        owner_id
      )
    `)
        .neq("status", "paid") // Not paid
        .eq("reminder_sent", false) // Not reminded
        // Only fetch recent transactions (current year and previous year)
        .gte("period_year", today.getFullYear() - 1);

    if (error) {
        console.error("Error fetching transactions:", error);
        return { count: 0, message: "Erreur lors de la récupération des transactions.", errors: [error] };
    }

    console.log(`Found ${transactions?.length || 0} candidate transactions from DB.`);

    if (!transactions || transactions.length === 0) {
        return { count: 0, message: "Aucun paiement en retard détecté." };
    }

    let emailsSent = 0;
    const errors: Error[] = [];

    for (const tx of transactions) {
        console.log(`Checking transaction ${tx.id}: Status=${tx.status}, Period=${tx.period_month}/${tx.period_year}`);

        const lease = tx.leases;
        // Handle case where lease might be an array or null
        // Supabase can return array for relations depending on schema checks/client version
        const leaseData = Array.isArray(lease) ? lease[0] : lease;

        if (!leaseData) {
            console.log(`-> Skipped: No lease data found.`);
            continue;
        }

        const billingDay = leaseData.billing_day || 5;
        const periodYear = tx.period_year;
        const periodMonth = tx.period_month;

        let dueDate: Date;
        try {
            // Month in Date constructor is 0-indexed (0=Jan, 11=Dec)
            dueDate = new Date(periodYear, periodMonth - 1, billingDay);
        } catch (e) {
            console.warn(`-> Skipped: Invalid date for tx ${tx.id}`, e);
            continue;
        }

        const daysOverdue = differenceInDays(today, dueDate);
        console.log(`-> Due Date: ${dueDate.toISOString().split('T')[0]}, Days Overdue: ${daysOverdue}`);

        // "Relance Automatique J+5": Trigger if 5 or more days have passed since due date.
        if (daysOverdue >= 5) {
            if (leaseData.tenant_email) {
                try {
                    // Récupérer l'email du propriétaire
                    let ownerEmail: string | undefined;
                    if (leaseData.owner_id) {
                        const { data: ownerData } = await supabase.auth.admin.getUserById(leaseData.owner_id);
                        ownerEmail = ownerData?.user?.email;
                    }

                    await sendReminderEmail(
                        leaseData.tenant_email,
                        leaseData.tenant_name || "Locataire",
                        tx.amount_due,
                        dueDate,
                        ownerEmail // Ajout du CC propriétaire
                    );

                    const { error: updateError } = await supabase
                        .from("rental_transactions")
                        .update({ reminder_sent: true })
                        .eq("id", tx.id);

                    if (updateError) {
                        console.error(`Failed to update tx ${tx.id}`, updateError);
                        errors.push(updateError instanceof Error ? updateError : new Error(JSON.stringify(updateError)));
                    } else {
                        emailsSent++;
                    }
                } catch (err) {
                    console.error(`Failed to send email to ${leaseData.tenant_email}`, err);
                    errors.push(err instanceof Error ? err : new Error(String(err)));
                }
            }
        }
    }

    return {
        count: emailsSent,
        message: `${emailsSent} relances envoyées avec succès.`,
        errors: errors.length > 0 ? errors : undefined
    };
}

import { PaymentReminderEmail } from "../emails/payment-reminder-email";
import React from "react";

// ... (existing imports)

/**
 * Real Email Sender using project's existing mailer
 */
async function sendReminderEmail(email: string, name: string, amount: number, date: Date, ownerEmail?: string) {
    const formattedDate = date.toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedAmount = amount.toLocaleString("fr-SN");

    console.log(`📧 Sending Late Reminder to: ${email}${ownerEmail ? ` (CC: ${ownerEmail})` : ''}`);

    // Préparer les destinataires
    const recipients: string | string[] = email;
    const ccRecipients: string[] | undefined = ownerEmail ? [ownerEmail] : undefined;

    await sendEmail({
        to: recipients,
        subject: `Rappel : Retard de paiement - Loyer du ${formattedDate}`,
        react: React.createElement(PaymentReminderEmail, {
            tenantName: name,
            amountFormatted: formattedAmount,
            dueDateStr: formattedDate,
        }),
        // @ts-ignore - Le type sendEmail accepte cc mais TypeScript ne le voit pas toujours
        cc: ccRecipients,
    });
}
