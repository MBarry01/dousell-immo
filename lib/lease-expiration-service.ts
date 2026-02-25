/**
 * Service de gestion des alertes de fin de bail
 * Conforme au cadre juridique sénégalais (COCC + décret 2014 + loi 2024)
 *
 * Règles d'alerte :
 * - J-180 (6 mois) : Alerte stratégique pour congé propriétaire (délai légal)
 * - J-90 (3 mois) : Alerte de négociation avant tacite reconduction
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
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

  const supabase = supabaseAdmin;
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
  supabase: typeof supabaseAdmin
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

import { LeaseExpirationEmail } from "../emails/lease-expiration-email";
import React from "react";

// ... (previous imports)

/**
 * Envoie l'email d'alerte au PROPRIÉTAIRE
 * Retourne true si l'envoi a réussi, false sinon
 */
async function sendExpirationAlert(
  lease: LeaseData,
  monthsRemaining: 6 | 3,
  endDate: Date,
  supabase: typeof supabaseAdmin
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

    const endDateStr = format(endDate, 'dd MMMM yyyy', { locale: fr });
    const formattedAmount = lease.monthly_amount.toLocaleString("fr-SN");

    // 4. Préparer et envoyer l'email (Utilisation de React Email)
    await sendEmail({
      to: ownerEmail,
      subject: `📅 ${monthsRemaining === 6 ? 'Action Requise' : 'Rappel'} : Fin de bail dans ${monthsRemaining} mois`,
      react: React.createElement(LeaseExpirationEmail, {
        monthsRemaining,
        endDateStr,
        tenantName: lease.tenant_name || "Votre locataire",
        propertyName,
        monthlyAmountFormatted: formattedAmount,
      }),
    });

    const daysRemaining = differenceInDays(endDate, new Date());
    console.log(`✅ Alerte J-${daysRemaining} envoyée à ${ownerEmail} pour le bail ${lease.id}`);

    return true;

  } catch (err) {
    console.error(`❌ Erreur envoi alerte pour bail ${lease.id}:`, err);
    return false;
  }
}

// buildEmailContent and old HTML can be removed as they are no longer used
