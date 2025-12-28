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
    const errors = [];

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
                        errors.push(updateError);
                    } else {
                        emailsSent++;
                    }
                } catch (err) {
                    console.error(`Failed to send email to ${leaseData.tenant_email}`, err);
                    errors.push(err);
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

/**
 * Real Email Sender using project's existing mailer
 */
async function sendReminderEmail(email: string, name: string, amount: number, date: Date, ownerEmail?: string) {
    const formattedDate = date.toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedAmount = amount.toLocaleString("fr-SN");

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #dc3545; }
        .content { padding: 30px 20px; }
        .button { background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Rappel de paiement</h2>
        </div>
        <div class="content">
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de votre loyer d'un montant de <strong>${formattedAmount} FCFA</strong>, dont l'échéance était le <strong>${formattedDate}</strong>.</p>
          <p>Nous vous remercions de bien vouloir régulariser votre situation dans les meilleurs délais.</p>
          <p>Si vous avez déjà effectué ce paiement, merci de ne pas tenir compte de ce message.</p>
        </div>
        <div class="footer">
          <p>Ceci est un message automatique envoyé par Doussel Immo.</p>
          ${ownerEmail ? '<p style="color: #999; margin-top: 10px;">Copie envoyée au propriétaire pour information.</p>' : ''}
        </div>
      </div>
    </body>
    </html>
  `;

    console.log(`📧 Sending Late Reminder to: ${email}${ownerEmail ? ` (CC: ${ownerEmail})` : ''}`);

    // Préparer les destinataires
    const recipients: string | string[] = email;
    const ccRecipients: string[] | undefined = ownerEmail ? [ownerEmail] : undefined;

    await sendEmail({
        to: recipients,
        subject: `Rappel : Retard de paiement - Loyer du ${formattedDate}`,
        html: emailHtml,
        // @ts-ignore - Le type sendEmail accepte cc mais TypeScript ne le voit pas toujours
        cc: ccRecipients,
    });
}
