"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addMonths } from "date-fns";
import { sendEmail } from "@/lib/mail-gmail";

// Schema de validation pour générer un préavis
const generateNoticeSchema = z.object({
    leaseId: z.string().uuid(),
    noticeType: z.enum(['J-180', 'J-90']),
});

export interface LeaseAlert {
    id: string;
    tenant_name: string;
    tenant_email: string | null;
    property_address: string;
    end_date: string;
    alert_type: 'J-180' | 'J-90';
    status: 'pending' | 'sent';
    monthly_amount: number;
    property_id: string;
}

export interface LegalStats {
    activeLeases: number;
    upcomingRenewals: number;
    legalRisks: number;
    complianceScore: number;
}

/**
 * Récupère les statistiques légales pour l'utilisateur connecté
 */
export async function getLegalStats(): Promise<LegalStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Non authentifié");
    }

    // Récupérer les baux actifs
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, end_date')
        .eq('owner_id', user.id)
        .eq('status', 'active');

    // Si la colonne end_date n'existe pas encore, retourner des stats vides
    if (leasesError && leasesError.message?.includes('column')) {
        return {
            activeLeases: 0,
            upcomingRenewals: 0,
            legalRisks: 0,
            complianceScore: 100
        };
    }

    const activeLeases = leases?.length || 0;

    // Calculer les renouvellements dans les 6 prochains mois
    const today = new Date();
    const sixMonthsFromNow = addMonths(today, 6);

    const upcomingRenewals = (leases || []).filter(lease => {
        if (!lease.end_date) return false;
        const endDate = new Date(lease.end_date);
        return endDate <= sixMonthsFromNow && endDate > today;
    }).length;

    // TODO: Récupérer les contentieux actifs (future feature)
    const legalRisks = 0;

    // Score de conformité (100% si pas de risques)
    const complianceScore = legalRisks === 0 ? 100 : Math.max(0, 100 - (legalRisks * 10));

    return {
        activeLeases,
        upcomingRenewals,
        legalRisks,
        complianceScore
    };
}

/**
 * Récupère les alertes d'expiration de bail pour l'utilisateur connecté
 */
export async function getLeaseAlerts(): Promise<LeaseAlert[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Non authentifié");
    }

    // Récupérer les baux actifs avec date de fin
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select('id, tenant_name, tenant_email, property_address, end_date, monthly_amount, property_id')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .not('end_date', 'is', null);

    // Si la colonne end_date n'existe pas encore, retourner tableau vide
    if (leasesError && leasesError.message?.includes('column')) {
        return [];
    }

    if (!leases) return [];

    const today = new Date();
    const threeMonthsFromNow = addMonths(today, 3);
    const sixMonthsFromNow = addMonths(today, 6);

    const alerts: LeaseAlert[] = [];

    for (const lease of leases) {
        const endDate = new Date(lease.end_date);

        // Alerte J-180 (6 mois) - Important mais pas urgent
        if (endDate <= sixMonthsFromNow && endDate > threeMonthsFromNow) {
            alerts.push({
                id: lease.id,
                tenant_name: lease.tenant_name || 'N/A',
                tenant_email: lease.tenant_email,
                property_address: lease.property_address || 'Adresse non renseignée',
                end_date: lease.end_date,
                alert_type: 'J-180',
                status: 'pending', // TODO: Lier avec les emails envoyés par le cron
                monthly_amount: lease.monthly_amount,
                property_id: lease.property_id
            });
        }

        // Alerte J-90 (3 mois) - Plus urgent
        if (endDate <= threeMonthsFromNow && endDate > today) {
            alerts.push({
                id: lease.id,
                tenant_name: lease.tenant_name || 'N/A',
                tenant_email: lease.tenant_email,
                property_address: lease.property_address || 'Adresse non renseignée',
                end_date: lease.end_date,
                alert_type: 'J-90',
                status: 'pending', // TODO: Lier avec les emails envoyés par le cron
                monthly_amount: lease.monthly_amount,
                property_id: lease.property_id
            });
        }
    }

    return alerts;
}

/**
 * Génère un préavis pour un bail donné
 */
export async function generateNotice(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    // Validation
    const parsed = generateNoticeSchema.safeParse({
        leaseId: formData.get('leaseId'),
        noticeType: formData.get('noticeType'),
    });

    if (!parsed.success) {
        return { success: false, error: "Données invalides" };
    }

    const { leaseId, noticeType } = parsed.data;

    // Vérifier que le bail appartient à l'utilisateur
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .eq('owner_id', user.id)
        .single();

    if (leaseError || !lease) {
        return { success: false, error: "Bail non trouvé" };
    }

    // Vérifier que l'email du locataire existe
    if (!lease.tenant_email) {
        return {
            success: false,
            error: "Email du locataire manquant. Veuillez renseigner l'email du locataire dans le bail."
        };
    }

    try {
        // Récupérer le profil du propriétaire pour les informations de branding
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, company_name, company_address, company_email, company_ninea, signature_url, logo_url')
            .eq('id', user.id)
            .maybeSingle();

        // Générer un numéro unique pour le préavis
        const noticeNumber = `PREV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        // Préparer les données pour l'API
        const noticeData = {
            // Informations bail
            tenantName: lease.tenant_name,
            tenantEmail: lease.tenant_email,
            tenantPhone: lease.tenant_phone,
            tenantAddress: lease.property_address, // Adresse du bien comme adresse du locataire
            propertyAddress: lease.property_address || 'Adresse non renseignée',
            monthlyAmount: lease.monthly_amount || 0,
            startDate: lease.start_date,
            endDate: lease.end_date,

            // Type de préavis
            noticeType: noticeType,
            noticeDate: new Date().toISOString(),

            // Informations propriétaire (avec fallback intelligent)
            ownerName: profile?.company_name || profile?.full_name || user.email || 'Propriétaire',
            ownerAddress: profile?.company_address || 'Adresse non renseignée',
            ownerEmail: profile?.company_email || user.email,
            ownerNinea: profile?.company_ninea,
            ownerLogo: profile?.logo_url,
            ownerSignature: profile?.signature_url,
            ownerAccountEmail: user.email,

            // Numéro unique
            noticeNumber: noticeNumber,
        };

        // Log pour vérifier les données envoyées
        console.log('📋 Données préavis:', {
            locataire: lease.tenant_name,
            emailLocataire: lease.tenant_email,
            proprietaire: noticeData.ownerName,
            emailProprietaire: noticeData.ownerEmail,
        });

        // Appeler l'API de génération et envoi du préavis
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://dousel.com'}/api/send-notice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noticeData),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Erreur lors de l\'envoi du préavis');
        }

        // TODO: Marquer l'alerte comme traitée dans une table lease_alerts

        revalidatePath('/documents-legaux');

        return {
            success: true,
            message: `Préavis ${noticeType} envoyé avec succès à ${lease.tenant_name}`,
            noticeType,
            tenant: lease.tenant_name,
            noticeNumber
        };
    } catch (error) {
        console.error("Erreur lors de la génération du préavis:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la génération du préavis"
        };
    }
}

/**
 * Récupère les transactions de loyer pour un bail donné
 */
export async function getLeaseTransactions(leaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Non authentifié");
    }

    // Vérifier que le bail appartient à l'utilisateur
    const { data: lease } = await supabase
        .from('leases')
        .select('id')
        .eq('id', leaseId)
        .eq('owner_id', user.id)
        .single();

    if (!lease) {
        throw new Error("Bail non trouvé");
    }

    // Récupérer les transactions
    const { data: transactions } = await supabase
        .from('rental_transactions')
        .select('*')
        .eq('lease_id', leaseId)
        .order('expected_date', { ascending: false });

    return transactions || [];
}

/**
 * Renouveler un bail (Décision manuelle du propriétaire)
 */
export async function renewLease(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    // Validation
    const leaseId = formData.get('leaseId') as string;
    const newEndDate = formData.get('newEndDate') as string | null;
    const newRentAmount = formData.get('newRentAmount') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!leaseId) {
        return { success: false, error: "ID du bail manquant" };
    }

    try {
        // Vérifier que le bail appartient à l'utilisateur
        const { data: lease, error: leaseError } = await supabase
            .from('leases')
            .select('*')
            .eq('id', leaseId)
            .eq('owner_id', user.id)
            .single();

        if (leaseError || !lease) {
            return { success: false, error: "Bail non trouvé" };
        }

        // Calculer la nouvelle date de fin (par défaut: +1 an)
        const currentEndDate = new Date(lease.end_date);
        const calculatedNewEndDate = newEndDate
            ? new Date(newEndDate)
            : addMonths(currentEndDate, 12);

        // Mettre à jour le bail
        const updateData: { end_date: string; monthly_amount?: number } = {
            end_date: calculatedNewEndDate.toISOString().split('T')[0],
        };

        if (newRentAmount && parseFloat(newRentAmount) > 0) {
            updateData.monthly_amount = parseFloat(newRentAmount);
        }

        const { error: updateError } = await supabase
            .from('leases')
            .update(updateData)
            .eq('id', leaseId);

        if (updateError) {
            throw new Error("Erreur lors de la mise à jour du bail");
        }

        // Enregistrer la décision dans lease_decisions
        const { error: decisionError } = await supabase
            .from('lease_decisions')
            .insert({
                lease_id: leaseId,
                decision_type: 'renew',
                new_end_date: calculatedNewEndDate.toISOString().split('T')[0],
                new_rent_amount: newRentAmount ? parseFloat(newRentAmount) : null,
                decided_by: user.id,
                notes: notes || null,
            });

        if (decisionError) {
            console.error("Erreur lors de l'enregistrement de la décision:", decisionError);
            // Ne pas bloquer si erreur sur lease_decisions (table peut ne pas exister encore)
        }

        // Envoyer un email de confirmation au locataire
        if (lease.tenant_email) {
            const formattedNewEndDate = calculatedNewEndDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const formattedRent = (newRentAmount ? parseFloat(newRentAmount) : lease.monthly_amount).toLocaleString('fr-SN');

            const renewalEmailHtml = `
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Renouvellement de bail</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
                        .container { background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .header { text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { color: #05080c; margin: 0; font-size: 28px; }
                        .success-badge { background-color: #dcfce7; color: #166534; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: 600; margin: 15px 0; }
                        .content { margin: 30px 0; }
                        .content p { margin: 15px 0; color: #555; }
                        .details { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; }
                        .details p { margin: 5px 0; }
                        .details strong { color: #05080c; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Bonne nouvelle !</h1>
                            <div class="success-badge">✅ Bail Renouvelé</div>
                        </div>
                        
                        <div class="content">
                            <p>Bonjour <strong>${lease.tenant_name || 'Cher locataire'}</strong>,</p>
                            
                            <p>Nous avons le plaisir de vous informer que votre propriétaire a validé le <strong>renouvellement de votre bail</strong> pour le bien situé à :</p>
                            
                            <p style="font-size: 16px; font-weight: 600; color: #05080c;">${lease.property_address || 'Adresse non renseignée'}</p>
                            
                            <div class="details">
                                <p><strong>📅 Nouvelle date de fin :</strong> ${formattedNewEndDate}</p>
                                <p><strong>💰 Loyer mensuel :</strong> ${formattedRent} FCFA ${newRentAmount ? '(nouveau montant)' : '(inchangé)'}</p>
                            </div>
                            
                            <p>Les autres conditions de votre bail restent inchangées.</p>
                            
                            <p>Pour toute question, n'hésitez pas à contacter votre propriétaire.</p>
                        </div>
                        
                        <div class="footer">
                            <p><strong>Doussel Immo</strong></p>
                            <p>Votre partenaire immobilier à Dakar</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            try {
                await sendEmail({
                    to: lease.tenant_email,
                    subject: `✅ Bonne nouvelle ! Votre bail a été renouvelé jusqu'au ${formattedNewEndDate}`,
                    html: renewalEmailHtml,
                });
                console.log(`📧 Email de renouvellement envoyé à ${lease.tenant_email}`);
            } catch (emailError) {
                console.error("Erreur lors de l'envoi de l'email de renouvellement:", emailError);
                // Ne pas bloquer si l'email échoue
            }
        }

        revalidatePath('/documents-legaux');
        revalidatePath('/gestion-locative');

        return {
            success: true,
            message: `Bail renouvelé jusqu'au ${calculatedNewEndDate.toLocaleDateString('fr-FR')}${lease.tenant_email ? ' et locataire notifié par email' : ''}`,
            newEndDate: calculatedNewEndDate.toISOString().split('T')[0],
        };
    } catch (error) {
        console.error("Erreur lors du renouvellement:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors du renouvellement du bail"
        };
    }
}

/**
 * Résilier un bail (Génère et envoie le préavis)
 */
export async function terminateLease(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    // Validation
    const leaseId = formData.get('leaseId') as string;
    const noticeType = formData.get('noticeType') as 'J-180' | 'J-90';
    const terminationReason = formData.get('terminationReason') as string;
    const notes = formData.get('notes') as string | null;

    if (!leaseId || !noticeType || !terminationReason) {
        return { success: false, error: "Données manquantes" };
    }

    try {
        // Vérifier que le bail appartient à l'utilisateur
        const { data: lease, error: leaseError } = await supabase
            .from('leases')
            .select('*')
            .eq('id', leaseId)
            .eq('owner_id', user.id)
            .single();

        if (leaseError || !lease) {
            return { success: false, error: "Bail non trouvé" };
        }

        // Vérifier que l'email du locataire existe
        if (!lease.tenant_email) {
            return {
                success: false,
                error: "Email du locataire manquant. Veuillez renseigner l'email du locataire dans le bail."
            };
        }

        // Récupérer le profil du propriétaire
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, company_name, company_address, company_email, company_ninea, signature_url, logo_url')
            .eq('id', user.id)
            .maybeSingle();

        // Générer un numéro unique pour le préavis
        const noticeNumber = `PREV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        // Préparer les données pour l'API
        const noticeData = {
            tenantName: lease.tenant_name,
            tenantEmail: lease.tenant_email,
            tenantPhone: lease.tenant_phone,
            tenantAddress: lease.property_address,
            propertyAddress: lease.property_address || 'Adresse non renseignée',
            monthlyAmount: lease.monthly_amount || 0,
            startDate: lease.start_date,
            endDate: lease.end_date,
            noticeType: noticeType,
            noticeDate: new Date().toISOString(),
            ownerName: profile?.company_name || profile?.full_name || user.email || 'Propriétaire',
            ownerAddress: profile?.company_address || 'Adresse non renseignée',
            ownerEmail: profile?.company_email || user.email,
            ownerNinea: profile?.company_ninea,
            ownerLogo: profile?.logo_url,
            ownerSignature: profile?.signature_url,
            ownerAccountEmail: user.email,
            noticeNumber: noticeNumber,
        };

        // Log pour debug
        console.log('📋 Résiliation bail - Données préavis:', {
            locataire: lease.tenant_name,
            emailLocataire: lease.tenant_email,
            motif: terminationReason,
        });

        // Appeler l'API de génération et envoi du préavis
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://dousel.com'}/api/send-notice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noticeData),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Erreur lors de l'envoi du préavis");
        }

        // Marquer le bail comme "en cours de résiliation"
        await supabase
            .from('leases')
            .update({ status: 'pending_termination' })
            .eq('id', leaseId);

        // Enregistrer la décision dans lease_decisions
        const { error: decisionError } = await supabase
            .from('lease_decisions')
            .insert({
                lease_id: leaseId,
                decision_type: 'terminate',
                termination_reason: terminationReason,
                notice_type: noticeType,
                notice_sent_at: new Date().toISOString(),
                notice_number: noticeNumber,
                decided_by: user.id,
                notes: notes || null,
            });

        if (decisionError) {
            console.error("Erreur lors de l'enregistrement de la décision:", decisionError);
        }

        revalidatePath('/documents-legaux');
        revalidatePath('/gestion-locative');

        return {
            success: true,
            message: `Préavis ${noticeType} envoyé avec succès à ${lease.tenant_name}`,
            noticeType,
            noticeNumber,
        };
    } catch (error) {
        console.error("Erreur lors de la résiliation:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la résiliation du bail"
        };
    }
}

/**
 * Récupère tous les baux actifs pour le générateur de documents
 */
export async function getAllActiveLeases() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Non authentifié");
    }

    const { data: leases, error } = await supabase
        .from('leases')
        .select('id, tenant_name, property_address, lease_pdf_url, monthly_amount, tenant_email, tenant_phone')
        .eq('owner_id', user.id)
        .eq('status', 'active');

    if (error) {
        console.error("Erreur récupération baux:", error);
        return [];
    }

    return leases || [];
}
