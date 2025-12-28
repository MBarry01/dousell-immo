/**
 * Service de gestion des alertes de fin de bail
 * Conforme au cadre juridique sénégalais (COCC + décret 2014 + loi 2024)
 *
 * Règles d'alerte :
 * - J-180 (6 mois) : Alerte stratégique pour congé propriétaire (délai légal)
 * - J-90 (3 mois) : Alerte de négociation avant tacite reconduction
 */

import { createAdminClient } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/mail";
import { addMonths, isSameDay, format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

// Types
export interface LeaseExpirationResult {
  count: number;
  message: string;
  errors?: Error[];
}

interface LeaseData {
  id: string;
  end_date: string | null;
  user_id: string;
  monthly_amount: number;
  tenant_name: string | null;
  tenant_email: string | null;
  property_id: string | null;
  billing_day?: number;
}

interface AlertContext {
  monthsRemaining: 6 | 3;
  endDate: Date;
  tenantName: string;
  propertyName: string;
  monthlyAmount: number;
}

/**
 * Fonction principale : vérifie les baux actifs et envoie les alertes J-180 et J-90
 */
export async function checkLeaseExpirations(): Promise<LeaseExpirationResult> {
  console.log("📡 Radar de fin de bail : Analyse en cours...");

  const supabase = createAdminClient();
  const today = new Date();

  try {
    // 1. Récupérer les baux ACTIFS avec une date de fin
    const { data: leases, error } = await supabase
      .from('leases')
      .select(`
        id,
        end_date,
        user_id,
        monthly_amount,
        tenant_name,
        tenant_email,
        property_id,
        billing_day
      `)
      .eq('status', 'active')
      .not('end_date', 'is', null);

    if (error) {
      console.error("❌ Erreur récupération baux:", error);
      return {
        count: 0,
        message: "Erreur lors de la récupération des baux.",
        errors: [error]
      };
    }

    console.log(`📋 ${leases?.length || 0} baux actifs analysés.`);

    if (!leases || leases.length === 0) {
      return { count: 0, message: "Aucun bail actif avec date de fin." };
    }

    let alertsSent = 0;
    const errors: Error[] = [];

    for (const lease of leases) {
      try {
        const result = await processLease(lease as LeaseData, today, supabase);
        alertsSent += result;
      } catch (err) {
        console.error(`❌ Erreur traitement bail ${lease.id}:`, err);
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    return {
      count: alertsSent,
      message: `${alertsSent} alerte(s) de fin de bail envoyée(s) avec succès.`,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (err) {
    console.error("❌ Erreur inattendue dans checkLeaseExpirations:", err);
    return {
      count: 0,
      message: "Erreur inattendue lors du traitement.",
      errors: [err instanceof Error ? err : new Error(String(err))]
    };
  }
}

/**
 * Traite un bail individuel et envoie les alertes si nécessaire
 * Retourne le nombre d'alertes envoyées (0, 1, ou 2)
 */
async function processLease(
  lease: LeaseData,
  today: Date,
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  if (!lease.end_date) return 0;

  const endDate = new Date(lease.end_date);
  let alertsSent = 0;

  // --- RÈGLE 1 : ALERTE J-180 (6 Mois) ---
  // Délai légal sénégalais pour le "Congé pour reprise"
  const sixMonthsBefore = addMonths(today, 6);

  if (isSameDay(endDate, sixMonthsBefore)) {
    const success = await sendExpirationAlert(lease, 6, endDate, supabase);
    if (success) alertsSent++;
  }

  // --- RÈGLE 2 : ALERTE J-90 (3 Mois) ---
  // Délai classique pour négocier avant la tacite reconduction
  const threeMonthsBefore = addMonths(today, 3);

  if (isSameDay(endDate, threeMonthsBefore)) {
    const success = await sendExpirationAlert(lease, 3, endDate, supabase);
    if (success) alertsSent++;
  }

  return alertsSent;
}

/**
 * Envoie l'email d'alerte au PROPRIÉTAIRE
 * Retourne true si l'envoi a réussi, false sinon
 */
async function sendExpirationAlert(
  lease: LeaseData,
  monthsRemaining: 6 | 3,
  endDate: Date,
  supabase: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  try {
    // 1. Récupérer l'email du propriétaire
    const { data: ownerData } = await supabase.auth.admin.getUserById(lease.user_id);
    const ownerEmail = ownerData?.user?.email;

    if (!ownerEmail) {
      console.log(`⚠️ Pas d'email trouvé pour le propriétaire (User ID: ${lease.user_id})`);
      return false;
    }

    // 2. Récupérer le nom de la propriété si disponible
    let propertyName = "le logement";
    if (lease.property_id) {
      const { data: propertyData } = await supabase
        .from('properties')
        .select('name')
        .eq('id', lease.property_id)
        .single();

      if (propertyData?.name) {
        propertyName = propertyData.name;
      }
    }

    // 3. Construire le contexte de l'alerte
    const context: AlertContext = {
      monthsRemaining,
      endDate,
      tenantName: lease.tenant_name || "Votre locataire",
      propertyName,
      monthlyAmount: lease.monthly_amount
    };

    // 4. Préparer et envoyer l'email
    const { subject, html } = buildEmailContent(context);

    await sendEmail({
      to: ownerEmail,
      subject,
      html,
    });

    const daysRemaining = differenceInDays(endDate, new Date());
    console.log(`✅ Alerte J-${daysRemaining} envoyée à ${ownerEmail} pour le bail ${lease.id}`);

    return true;

  } catch (err) {
    console.error(`❌ Erreur envoi alerte pour bail ${lease.id}:`, err);
    return false;
  }
}

/**
 * Construit le contenu de l'email selon le type d'alerte
 */
function buildEmailContent(context: AlertContext): { subject: string; html: string } {
  const { monthsRemaining, endDate, tenantName, propertyName, monthlyAmount } = context;

  const endDateStr = format(endDate, 'dd MMMM yyyy', { locale: fr });
  const formattedAmount = monthlyAmount.toLocaleString("fr-SN");

  let subject: string;
  let contextHtml: string;
  let mainMessage: string;

  if (monthsRemaining === 6) {
    subject = `📅 Action Requise : Fin de bail dans 6 mois - ${tenantName}`;
    contextHtml = `
      <div style="background-color: rgba(239, 68, 68, 0.1); padding: 20px; border-left: 5px solid #ef4444; margin-bottom: 25px; border-radius: 8px;">
        <strong style="color: #ef4444;">🇸🇳 Contexte Juridique Sénégal :</strong><br/>
        <p style="margin: 10px 0 0 0; color: #f87171; line-height: 1.6;">
          Si vous souhaitez récupérer ce bien (pour y habiter ou pour un proche), la loi exige souvent un préavis de <strong>6 mois</strong> signifié par huissier.
          <br/>C'est le moment d'agir si vous ne souhaitez pas renouveler le bail.
        </p>
      </div>
    `;
    mainMessage = "Le bail de votre locataire arrive à échéance dans 6 mois. C'est le délai légal pour donner congé si vous souhaitez récupérer votre bien.";
  } else {
    subject = `🔔 Rappel : Fin de bail dans 3 mois - ${tenantName}`;
    contextHtml = `
      <div style="background-color: rgba(234, 179, 8, 0.1); padding: 20px; border-left: 5px solid #eab308; margin-bottom: 25px; border-radius: 8px;">
        <strong style="color: #eab308;">ℹ️ Tacite Reconduction :</strong><br/>
        <p style="margin: 10px 0 0 0; color: #facc15; line-height: 1.6;">
          Sans action de votre part, ce bail sera probablement renouvelé automatiquement aux mêmes conditions pour une nouvelle période.
          <br/>C'est le moment idéal pour discuter d'un éventuel renouvellement ou d'ajustements.
        </p>
      </div>
    `;
    mainMessage = "Le bail de votre locataire se termine dans 3 mois. C'est l'occasion de discuter du renouvellement ou de nouvelles conditions.";
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #e2e8f0;
          margin: 0;
          padding: 0;
          background-color: #020617;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #0f172a;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1e293b;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .header {
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          color: #22c55e;
          padding: 30px 20px;
          text-align: center;
          border-bottom: 2px solid #1e293b;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
          color: #22c55e;
        }
        .content {
          padding: 30px 25px;
          background-color: #0f172a;
          color: #cbd5e1;
        }
        .content p {
          margin: 15px 0;
          color: #cbd5e1;
        }
        .details-box {
          background-color: rgba(34, 197, 94, 0.1);
          border-left: 4px solid #22c55e;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .details-box ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .details-box li {
          margin: 8px 0;
          color: #cbd5e1;
        }
        .footer {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          padding: 20px;
          border-top: 1px solid #1e293b;
          background-color: #020617;
        }
        .highlight {
          color: #22c55e;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🏠 Alerte de Fin de Bail</h2>
          <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 14px;">Doussel Immo - Gestion Locative</p>
        </div>

        <div class="content">
          <p style="font-size: 16px; font-weight: 500; color: #f1f5f9;">Bonjour,</p>

          <p style="color: #cbd5e1;">${mainMessage}</p>

          ${contextHtml}

          <div class="details-box">
            <p style="margin-top: 0; color: #f1f5f9;"><strong>📋 Détails du bail :</strong></p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li>👤 <strong style="color: #22c55e;">Locataire :</strong> ${tenantName}</li>
              <li>🏘️ <strong style="color: #22c55e;">Propriété :</strong> ${propertyName}</li>
              <li>💰 <strong style="color: #22c55e;">Loyer mensuel :</strong> ${formattedAmount} FCFA</li>
              <li>📅 <strong style="color: #22c55e;">Fin du bail :</strong> ${endDateStr}</li>
            </ul>
          </div>

          <p style="margin-top: 25px; color: #cbd5e1;">
            Pour toute question ou pour gérer ce bail, connectez-vous à votre espace Doussel Immo.
          </p>
        </div>

        <div class="footer">
          <p style="margin: 5px 0; color: #64748b;">Ceci est une alerte automatique de votre assistant de gestion locative.</p>
          <p style="margin: 5px 0; color: #475569;">Doussel Immo - Gestion Intelligente de Patrimoine Immobilier 🇸🇳</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
