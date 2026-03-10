"use server";

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { invalidateCacheBatch } from '@/lib/cache/cache-aside';
import { invalidateRentalCaches } from '@/lib/cache/invalidation';
import { revalidatePath } from 'next/cache';
import { fetchWithRetry } from '@/lib/utils';
import { validateTenantCreation } from '@/lib/finance';
import { sendEmail } from '@/lib/mail';
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";
import { checkFeatureAccess } from "@/lib/subscription/team-subscription";
import { generateMaintenancePDF } from '@/lib/maintenance-pdf-generator';
import { uploadPDFToStorage } from '@/lib/pdf-generator';
import { generateLeaseContract } from '@/lib/actions/contract-actions';
import { storeDocumentInGED } from '@/lib/ged-utils';
import {
    getRentalTransactions,
    getLeasesByTeam,
    getRentalStatsByTeam
} from "@/services/rentalService.cached";
import { WelcomePackEmail } from '@/emails/WelcomePackEmail';
import { MaintenanceUpdateEmail } from '@/emails/MaintenanceUpdateEmail';
import { TenantInvitationEmail } from '@/emails/TenantInvitationEmail';


/**
 * Récupérer les propriétés de l'équipe (pour les listes déroulantes)
 */
export async function getProperties() {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;
    const supabase = await createClient();

    try {
        const { data: properties, error } = await supabase
            .from('properties')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: properties };
    } catch (error) {
        console.error("Erreur getProperties:", error);
        return { success: false, error: "Erreur lors de la récupération des biens" };
    }
}

/**
 * Récupérer tous les baux de l'équipe (pour les listes déroulantes)
 */
export async function getLeasesByOwner() {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId } = context;
    const supabase = await createClient();

    try {
        const { data: leases, error } = await supabase
            .from('leases')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: leases };
    } catch (error) {
        console.error("Erreur getLeasesByOwner:", error);
        return { success: false, error: "Erreur lors de la récupération des baux" };
    }
}

/**
 * Calcule les statistiques financières en temps réel pour l'équipe
 */
export async function getRentalStats() {
    const context = await getUserTeamContext();
    if (!context) return { collected: "0", pending: "0", overdue: "0" };
    const { teamId } = context;
    const supabase = await createClient();

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Récupérer tous les baux actifs de l'équipe
    const { data: activeLeases } = await supabase
        .from('leases')
        .select('id, monthly_amount, billing_day')
        .eq('team_id', teamId)
        .eq('status', 'active');

    // 2. Récupérer les transactions de ce mois pour l'équipe
    const { data: monthlyTrans } = await supabase
        .from('rental_transactions')
        .select('lease_id, amount_due, status')
        .eq('team_id', teamId)
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

    let collected = 0;
    let pending = 0;
    let overdue = 0;

    const paidLeaseIds = new Set();

    // Traiter les paiements existants
    monthlyTrans?.forEach(t => {
        if (t.status === 'paid') {
            collected += Number(t.amount_due);
            paidLeaseIds.add(t.lease_id);
        }
    });

    // 3. Pour chaque bail actif, vérifier le statut
    activeLeases?.forEach(lease => {
        if (paidLeaseIds.has(lease.id)) return;

        const amount = Number(lease.monthly_amount);

        if (currentDay > (lease.billing_day || 5)) {
            overdue += amount;
        } else {
            pending += amount;
        }
    });

    return {
        collected: collected.toLocaleString('fr-FR'),
        pending: pending.toLocaleString('fr-FR'),
        overdue: overdue.toLocaleString('fr-FR')
    };
}

/**
 * Calcule les KPIs avancés pour le dashboard de l'équipe
 * OPTIMISÉ : Utilise des counts directs et limite le déchargement de données
 */
export async function getAdvancedStats() {
    const context = await getUserTeamContext();
    if (!context) return { occupancyRate: 0, avgPaymentDelay: 0, unpaidRate: 0, avgRevenuePerProperty: 0, totalProperties: 0, activeLeases: 0 };
    const { teamId } = context;
    const supabase = await createClient();

    // 1. Récupérer le nombre total de biens (COUNT uniquement)
    const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

    // 2. Récupérer les baux actifs (On a besoin des détails pour les calculs suivants)
    const { data: activeLeases } = await supabase
        .from('leases')
        .select('id, monthly_amount, billing_day, property_address')
        .eq('team_id', teamId)
        .eq('status', 'active');

    const activeLeasesCount = activeLeases?.length || 0;

    // 3. Calculer le taux d'occupation
    let occupancyBase = totalProperties || 0;
    if (occupancyBase === 0 && activeLeasesCount > 0) {
        const uniqueAddresses = new Set((activeLeases || []).map(l => l.property_address?.toLowerCase().trim()));
        occupancyBase = uniqueAddresses.size;
    }

    const rawOccupancyRate = occupancyBase > 0
        ? Math.round((activeLeasesCount / occupancyBase) * 100)
        : (activeLeasesCount > 0 ? 100 : 0);

    const occupancyRate = Math.min(rawOccupancyRate, 100);

    // 4. Calculer le délai moyen de paiement sur les derniers mois uniquement (Limit 50 pour performance)
    const { data: paidTransactions } = await supabase
        .from('rental_transactions')
        .select('lease_id, paid_at, period_month, period_year')
        .eq('team_id', teamId)
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
        .limit(50);

    let totalDelay = 0;
    let delayCount = 0;

    paidTransactions?.forEach(t => {
        const lease = activeLeases?.find(l => l.id === t.lease_id);
        if (lease && t.paid_at && t.period_month && t.period_year) {
            const billingDay = lease.billing_day || 5;
            const expectedDate = new Date(t.period_year, t.period_month - 1, billingDay);
            const paidDate = new Date(t.paid_at);
            const diffDays = Math.floor((paidDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
                totalDelay += diffDays;
                delayCount++;
            }
        }
    });

    const avgPaymentDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

    // 5. Taux d'impayés (COUNT uniquement)
    const { count: totalTransCount } = await supabase
        .from('rental_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

    const { count: failedCount } = await supabase
        .from('rental_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .in('status', ['failed', 'rejected']);

    const unpaidRate = (totalTransCount && totalTransCount > 0)
        ? Math.round(((failedCount || 0) / totalTransCount) * 100)
        : 0;

    // 6. Revenu moyen par bien loué
    const totalMonthlyRevenue = activeLeases?.reduce((acc, l) => acc + Number(l.monthly_amount), 0) || 0;
    const avgRevenuePerProperty = activeLeasesCount > 0
        ? Math.round(totalMonthlyRevenue / activeLeasesCount)
        : 0;

    return {
        occupancyRate,
        avgPaymentDelay,
        unpaidRate,
        avgRevenuePerProperty,
        totalProperties: totalProperties || 0,
        activeLeases: activeLeasesCount
    };
}

/**
 * Récupère l'historique des revenus de l'équipe sur les N derniers mois
 */
/**
 * Récupère l'historique des revenus de l'équipe sur les N derniers mois
 * OPTIMISÉ : 1 seule requête DB au lieu de N requêtes (boucle)
 */
export async function getRevenueHistory(months: number = 12) {
    const context = await getUserTeamContext();
    if (!context) return [];
    const { teamId } = context;
    const supabase = await createClient();

    const today = new Date();
    const history: { month: string; year: number; monthNum: number; collected: number; expected: number }[] = [];

    // Calculer la fenêtre de temps (ex: il y a 12 mois)
    // On prend une marge de sécurité sur l'année précédente
    const pastDate = new Date(today.getFullYear(), today.getMonth() - months, 1);
    const minYear = pastDate.getFullYear();

    // 1. Récupérer TOUTES les transactions pertinentes en UNE SEULE requête
    const { data: transactions } = await supabase
        .from('rental_transactions')
        .select('amount_due, status, period_month, period_year')
        .eq('team_id', teamId)
        .gte('period_year', minYear);

    // 2. Agréger les données en mémoire (beaucoup plus rapide que N requêtes DB)
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthNum = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

        // Filtrer les transactions pour ce mois spécifique
        const monthTransactions = (transactions || []).filter(t =>
            t.period_month === monthNum && t.period_year === year
        );

        const collected = monthTransactions
            .filter(t => t.status === 'paid')
            .reduce((sum, t) => sum + Number(t.amount_due || 0), 0);

        const expected = monthTransactions
            .reduce((sum, t) => sum + Number(t.amount_due || 0), 0);

        history.push({
            month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            year,
            monthNum,
            collected,
            expected
        });
    }

    return history;
}

/**
 * Fonction utilitaire pour envoyer les données à n8n
 * Les webhooks n8n doivent être configurés pour recevoir ces événements
 */
async function triggerN8N(webhookPath: string, payload: Record<string, unknown>) {
    const N8N_URL = process.env.N8N_WEBHOOK_URL; // URL de l'instance n8n
    console.log(`[triggerN8N] Tentative envoi vers ${webhookPath}`, {
        hasUrl: !!N8N_URL,
        payloadKeys: Object.keys(payload)
    });

    if (!N8N_URL) {
        console.warn('N8N_WEBHOOK_URL non configuré - webhook ignoré');
        return;
    }

    try {
        const response = await fetchWithRetry(`${N8N_URL}/${webhookPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'any'
            },
            body: JSON.stringify({
                ...payload,
                timestamp: new Date().toISOString(),
                source: 'dousel-immo'
            }),
        });

        if (!response.ok) {
            console.error(`Webhook n8n (${webhookPath}) - Erreur HTTP:`, response.status, await response.text());
        } else {
            console.log(`[triggerN8N] Succès envoi ${webhookPath}`);
        }
    } catch (err) {
        console.error(`Erreur Webhook n8n (${webhookPath}):`, err);
    }
}

/**
 * Enregistre un nouveau locataire et son bail
 * Supporte :
 * - Sélection d'un bien existant (property_id)
 * - Création de bien on-the-fly (create_new_property)
 * - Liaison automatique bien-bail avec mise à jour du statut
 */
export async function createNewLease(formData: Record<string, unknown>) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.create');

    // ✅ CHECK FEATURE QUOTA (LEASE)
    const leaseAccess = await checkFeatureAccess(teamId, "add_lease");
    if (!leaseAccess.allowed) {
        return {
            success: false,
            error: leaseAccess.message,
            upgradeRequired: leaseAccess.upgradeRequired
        };
    }

    // ✅ CHECK FEATURE QUOTA (PROPERTY) if creating on-the-fly
    if (formData.create_new_property === 'true' || formData.create_new_property === true) {
        const propertyAccess = await checkFeatureAccess(teamId, "add_property");
        if (!propertyAccess.allowed) {
            return {
                success: false,
                error: propertyAccess.message,
                upgradeRequired: propertyAccess.upgradeRequired
            };
        }
    }

    const supabase = await createClient();

    // ==============================================
    // GESTION DU BIEN IMMOBILIER
    // ==============================================
    let propertyId = formData.property_id as string | undefined;
    let propertyAddress = formData.property_address as string;

    // Cas 1: Création de bien on-the-fly
    if (formData.create_new_property === 'true' || formData.create_new_property === true) {
        const newPropertyTitle = formData.new_property_title as string;
        const newPropertyAddress = formData.new_property_address as string;
        const newPropertyPrice = Number(formData.new_property_price) || Number(formData.monthly_amount) || 0;

        if (!newPropertyTitle || !newPropertyAddress) {
            return { success: false, error: "Nom et adresse du bien requis pour la création" };
        }

        // Créer le bien en mode brouillon (sans photos = draft pour vitrine)
        const { data: newProperty, error: propError } = await supabase
            .from('properties')
            .insert([{
                title: newPropertyTitle,
                price: newPropertyPrice,
                currency: 'FCFA',
                category: 'location',
                status: 'loué', // Directement loué car associé au locataire
                location: {
                    address: newPropertyAddress,
                    city: 'Dakar', // Valeur par défaut
                },
                owner_id: user.id,
                team_id: teamId,
                validation_status: 'pending', // Pas sur la vitrine (pas de photos)
                images: [],
            }])
            .select('id')
            .single();

        if (propError || !newProperty) {
            console.error("Erreur création bien on-the-fly:", propError);
            return { success: false, error: `Erreur création bien: ${propError?.message}` };
        }

        propertyId = newProperty.id;
        propertyAddress = newPropertyAddress;
        console.log("✅ Bien créé on-the-fly avec team_id:", teamId);
    }

    // Cas 2: Bien existant sélectionné - mettre à jour son statut
    if (propertyId) {
        const { error: updateError } = await supabase
            .from('properties')
            .update({
                status: 'loué',
                validation_status: 'pending' // Retirer de la vitrine
            })
            .eq('id', propertyId)
            .eq('team_id', teamId); // Sécurité supplémentaire

        if (updateError) {
            console.warn("Erreur mise à jour statut bien:", updateError);
        }
    }

    // ==============================================
    // PRÉPARATION DES DONNÉES DU BAIL
    // ==============================================
    const cleanedFormData = { ...formData };
    delete (cleanedFormData as any).create_new_property;
    delete (cleanedFormData as any).new_property_title;
    delete (cleanedFormData as any).new_property_address;
    delete (cleanedFormData as any).new_property_price;
    delete (cleanedFormData as any).monthly_amount_prefilled;

    // Extraire deposit_months pour ne pas l'envoyer à la table leases
    const depositMonths = Number(formData.deposit_months) || 2;
    delete (cleanedFormData as any).deposit_months;

    // Extraire custom_data (champs personnalisés de l'import CSV)
    const customData = (cleanedFormData as any).custom_data || {};
    delete (cleanedFormData as any).custom_data;

    const finalData = {
        ...cleanedFormData,
        owner_id: user.id,
        team_id: teamId,
        property_id: propertyId || null,
        property_address: propertyAddress,
    };

    // Ajouter custom_data à finalData seulement s'il n'est pas vide
    if (Object.keys(customData).length > 0) {
        (finalData as any).custom_data = customData;
    }

    const emailToCheck = (finalData as Record<string, unknown>).tenant_email as string | undefined;
    if (emailToCheck) {
        // validateTenantCreation devrait idéalement aussi être mis à jour mais on continue pour l'instant
        const validation = await validateTenantCreation(emailToCheck, supabase, user.id);

        if (!validation.valid) {
            return {
                success: false,
                error: validation.error || "Erreur de validation"
            };
        }
    }

    // 1.5 Vérifier que le profil utilisateur existe (Contrainte FK leases_owner_id_fkey)
    const { data: userProfile, error: _profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

    if (!userProfile) {
        // Fallback: Créer le profil s'il n'existe pas (Mode résilient)
        const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Propriétaire',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

        if (insertProfileError) {
            console.error("Erreur auto-création profil:", insertProfileError);
            return { success: false, error: "Impossible de créer le bail : Votre profil propriétaire est introuvable." };
        }

        // IMPORTANT: Invalider le cache du profil après création
        await invalidateCacheBatch([`owner_profile:${user.id}`], 'rentals');
    }

    // 2. Insérer le bail
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert([finalData])
        .select('*')
        .single();

    if (leaseError || !lease) {
        console.error("Erreur création bail:", leaseError);
        return { success: false, error: `Erreur création bail: ${leaseError?.message}` };
    }

    // ==============================================
    // CRÉATION DES TRANSACTIONS INITIALES
    // ==============================================
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthlyAmount = Number(lease.monthly_amount);

    // 2. Créer transaction CAUTION (Mois 0)
    // On utilise month=0 pour identifier la caution dans l'historique sans changer le schéma
    if (depositMonths > 0) {
        const depositAmount = monthlyAmount * depositMonths;
        const { error: depositError } = await supabase
            .from('rental_transactions')
            .insert([{
                lease_id: lease.id,
                period_month: 0, // Convention pour Caution
                period_year: currentYear,
                amount_due: depositAmount,
                status: 'pending',
                period_start: today.toISOString().split('T')[0],
                period_end: today.toISOString().split('T')[0],
                reminder_sent: false,
                team_id: teamId
            }]);

        if (depositError) console.error("Erreur création caution:", depositError);
    }

    // 3. Créer automatiquement la transaction pour le mois en cours (Loyer)
    const { error: transError } = await supabase
        .from('rental_transactions')
        .insert([{
            lease_id: lease.id,
            period_month: currentMonth,
            period_year: currentYear,
            amount_due: monthlyAmount,
            status: 'pending',
            period_start: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
            period_end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
            reminder_sent: false,
            team_id: teamId
        }]);

    if (transError) {
        console.error("Erreur création transaction:", transError.message);
        // On ne bloque pas la création du bail, mais on log l'erreur
    }

    // Invalidation complète du cache pour mise à jour UI immédiate
    await invalidateRentalCaches(teamId, lease.id, {
        invalidateLeases: true,
        invalidateTransactions: true,
        invalidateStats: true
    });

    // ==============================================
    // 4. GÉNÉRATION ET STOCKAGE DU BAIL PDF
    // ==============================================
    try {
        console.log("📄 Génération automatique du contrat de bail...");
        const contractResult = await generateLeaseContract({ leaseId: lease.id });

        if (contractResult.success) {
            console.log("✅ Bail PDF généré et stocké avec succès");
        } else {
            console.error("❌ Echec génération automatique du bail:", contractResult.error);
        }
    } catch (contractError) {
        console.error("❌ Erreur lors de la génération automatique du bail:", contractError);
    }

    // DÉCLENCHEUR N8N : Supprimé car génération interne
    // La génération du PDF est maintenant gérée ci-dessus par generateLeasePDF et stockée dans la GED.

    // Invalider aussi le cache du profil propriétaire et le CACHE VITRINE (Homepage)
    // pour que le bien disparaisse de la liste "disponible"
    const keysToInvalidate = [
        `owner_profile:${user.id}`,
        // Clés Homepage (V3)
        'all_sections_v3',
        'popular_locations_v3_8',
        'properties_for_sale_v3_8',
        'land_for_sale_v3_8'
    ];

    // Si on a l'adresse/ville, on invalide aussi le cache par ville
    if (finalData.property_address && typeof finalData.property_address === 'string') {
        // Extraction naïve de la ville si possible, sinon on invalide Dakar par défaut
        // TODO: Idéalement il faudrait la ville précise
        keysToInvalidate.push('city:Dakar:limit:20', 'city:Saly:limit:20');
        // Invalidation générique des recherches
        keysToInvalidate.push('search:*');
    }

    await invalidateCacheBatch(keysToInvalidate, 'rentals'); // Rentals namespace for owner profile
    await invalidateCacheBatch(keysToInvalidate, 'homepage'); // Homepage namespace for showcase
    await invalidateCacheBatch(keysToInvalidate, 'properties'); // Properties namespace for search

    revalidatePath('/gestion');
    revalidatePath('/gestion/locataires');
    revalidatePath('/'); // Revalidate root (Vitrine)
    revalidatePath('/recherche');
    return { success: true, id: lease.id };
}

/**
 * Envoie le "Pack de Bienvenue" au locataire
 * Comprend : Lien Invitation + Contrat PDF (en pièce jointe)
 * Envoi direct via Nodemailer (sans n8n)
 */
export async function sendWelcomePack(leaseId: string) {
    console.log("[sendWelcomePack] Start for lease:", leaseId);
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('documents.generate');

    const supabase = await createClient();

    // 1. Récupérer les détails du bail et du bien (filtré par teamId pour sécu)
    const { data: lease, error: _fetchError } = await supabase
        .from('leases')
        .select(`
            *,
            property:properties(*)
        `)
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (!lease) {
        console.error("[sendWelcomePack] Lease not found");
        return { success: false, error: "Bail introuvable" };
    }

    // 2. Récupérer le profil du propriétaire
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, full_name, company_address')
        .eq('id', user.id)
        .maybeSingle();

    const ownerName = profile?.company_name || profile?.full_name || "Votre Gestionnaire";

    // 3. Générer le lien d'invitation (Magic Link) via Admin API
    let inviteLink = "https://dousel.com/auth/login"; // Fallback

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            console.log("[sendWelcomePack] Generating magic link...");
            const adminAuth = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            ).auth;

            const { data: linkData, error: linkError } = await adminAuth.admin.generateLink({
                type: 'magiclink',
                email: lease.tenant_email,
                options: {
                    redirectTo: 'https://dousel.com/espace-locataire'
                }
            });

            if (linkError) {
                console.error("[sendWelcomePack] Link gen error:", linkError);
            } else if (linkData?.properties?.action_link) {
                inviteLink = linkData.properties.action_link;
                console.log("[sendWelcomePack] Magic link generated successfully");
            }
        } catch (e) {
            console.error("[sendWelcomePack] Erreur génération lien admin:", e);
        }
    } else {
        console.warn("[sendWelcomePack] No SERVICE_ROLE_KEY found, using fallback link");
    }

    // 4. Préparer les pièces jointes (Contrat PDF + Reçu de Caution + Quittance si applicable)
    const attachments: Array<{ filename: string; content: Buffer | string; contentType?: string }> = [];

    // IMPORTANT: Re-fetch lease data to get the latest lease_pdf_url
    let { data: freshLease } = await supabase
        .from('leases')
        .select('*, lease_pdf_url')
        .eq('id', leaseId)
        .single();

    console.log("[sendWelcomePack] Fresh lease data - PDF URL:", freshLease?.lease_pdf_url || "NOT SET");

    // 4a. Contrat de bail — auto-générer si pas encore fait
    if (!freshLease?.lease_pdf_url) {
        console.log("[sendWelcomePack] No contract PDF found — auto-generating...");
        try {
            const contractResult = await generateLeaseContract({ leaseId });
            if (contractResult.success) {
                console.log("[sendWelcomePack] Contract auto-generated successfully");
                // Re-fetch pour récupérer l'URL fraîchement sauvegardée
                const { data: refetched } = await supabase
                    .from('leases')
                    .select('lease_pdf_url')
                    .eq('id', leaseId)
                    .single();
                if (refetched?.lease_pdf_url) {
                    freshLease = { ...freshLease, lease_pdf_url: refetched.lease_pdf_url } as typeof freshLease;
                }
            } else {
                console.error("[sendWelcomePack] Contract auto-generation failed:", contractResult.error);
            }
        } catch (e) {
            console.error("[sendWelcomePack] Error during contract auto-generation:", e);
        }
    }

    if (freshLease?.lease_pdf_url || freshLease?.id) {
        try {
            console.log("[sendWelcomePack] Attempting to fetch contract PDF...");

            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Reconstruire le chemin probable si l'URL est corrompue ou expirée
            // Format standard: {owner_id}/contract-{lease_id}.pdf
            const storagePath = `${freshLease.owner_id}/contract-${leaseId}.pdf`;

            console.log("[sendWelcomePack] Priority storage path:", storagePath);

            const { data: pdfBlob, error: downloadError } = await supabaseAdmin.storage
                .from('lease-contracts')
                .download(storagePath);

            if (!downloadError && pdfBlob) {
                const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
                attachments.push({
                    filename: `Contrat_Bail_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                });
                console.log("[sendWelcomePack] Contract PDF attached successfully from storage");
            } else {
                console.warn("[sendWelcomePack] Could not download from primary path, trying URL fetch fallback...", downloadError?.message);

                if (freshLease.lease_pdf_url && freshLease.lease_pdf_url.startsWith('http')) {
                    const pdfResponse = await fetchWithRetry(freshLease.lease_pdf_url);
                    if (pdfResponse.ok) {
                        const pdfArrayBuffer = await pdfResponse.arrayBuffer();
                        attachments.push({
                            filename: `Contrat_Bail_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                            content: Buffer.from(pdfArrayBuffer),
                            contentType: 'application/pdf'
                        });
                        console.log("[sendWelcomePack] Contract PDF attached via URL fallback");
                    }
                }
            }
        } catch (e) {
            console.error("[sendWelcomePack] Error fetching contract PDF:", e);
        }
    } else {
        console.warn("[sendWelcomePack] Contract PDF unavailable — skipping");
    }

    // 4b. Reçu de Caution (si caution payée)
    try {
        // Vérifier si la caution est payée
        console.log("[sendWelcomePack] Looking for deposit transaction with lease_id:", leaseId, "period_month: 0, status: paid");
        const { data: depositTx, error: depositError } = await supabase
            .from('rental_transactions')
            .select('*')
            .eq('lease_id', leaseId)
            .eq('period_month', 0) // Caution = mois 0
            .eq('status', 'paid')
            .maybeSingle();

        console.log("[sendWelcomePack] Deposit tx found:", depositTx ? `YES (amount: ${depositTx.amount_due})` : "NO", depositError ? `Error: ${depositError.message}` : "");

        if (depositTx) {
            console.log("[sendWelcomePack] Generating deposit receipt PDF...");
            const ReactPDF = await import('@react-pdf/renderer');
            const { createDepositReceiptDocument } = await import('@/components/pdf/DepositReceiptPDF');

            // Récupérer le profil complet pour le PDF
            const { data: fullProfile } = await supabase
                .from('profiles')
                .select('company_name, full_name, company_address, company_ninea, logo_url, signature_url')
                .eq('id', user.id)
                .maybeSingle();

            const depositReceiptData = {
                tenantName: lease.tenant_name,
                tenantEmail: lease.tenant_email,
                tenantPhone: lease.tenant_phone,
                depositAmount: depositTx.amount_due,
                depositMonths: Math.round(depositTx.amount_due / lease.monthly_amount),
                monthlyRent: lease.monthly_amount,
                receiptNumber: `CAUT-${Date.now().toString().slice(-8)}`,
                ownerName: fullProfile?.company_name || fullProfile?.full_name || ownerName,
                ownerAddress: fullProfile?.company_address || '',
                ownerNinea: fullProfile?.company_ninea,
                ownerLogo: fullProfile?.logo_url,
                ownerSignature: fullProfile?.signature_url,
                propertyAddress: lease.property_address,
                leaseStartDate: new Date(lease.start_date).toLocaleDateString('fr-FR'),
            };

            const depositDoc = createDepositReceiptDocument(depositReceiptData);
            const stream = await ReactPDF.default.renderToStream(depositDoc);

            // Convertir le stream en buffer
            const chunks: Uint8Array[] = [];
            const depositBuffer = await new Promise<Buffer>((resolve, reject) => {
                stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            attachments.push({
                filename: `Recu_Caution_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                content: depositBuffer,
                contentType: 'application/pdf'
            });
            console.log("[sendWelcomePack] Deposit receipt PDF attached");
        }
    } catch (e) {
        console.error("[sendWelcomePack] Error generating deposit receipt:", e);
    }

    // 4c. Quittance de Loyer (si premier loyer payé)
    try {
        // Vérifier si le loyer du mois en cours est payé
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const { data: rentTx } = await supabase
            .from('rental_transactions')
            .select('*')
            .eq('lease_id', leaseId)
            .eq('period_month', currentMonth)
            .eq('period_year', currentYear)
            .eq('status', 'paid')
            .maybeSingle();

        if (rentTx) {
            console.log("[sendWelcomePack] Generating rent receipt PDF...");
            const ReactPDF = await import('@react-pdf/renderer');
            const { createQuittanceDocument } = await import('@/components/pdf/QuittancePDF_v2');

            // Récupérer le profil complet pour le PDF
            const { data: fullProfile } = await supabase
                .from('profiles')
                .select('company_name, full_name, company_address, company_ninea, logo_url, signature_url')
                .eq('id', user.id)
                .maybeSingle();

            const periodDate = new Date(rentTx.period_year, rentTx.period_month - 1);
            const lastDayOfMonth = new Date(rentTx.period_year, rentTx.period_month, 0).getDate();

            const quittanceData = {
                tenantName: lease.tenant_name,
                tenantEmail: lease.tenant_email,
                tenantPhone: lease.tenant_phone,
                tenantAddress: lease.property_address,
                amount: rentTx.amount_due,
                periodMonth: periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                periodStart: `01/${String(rentTx.period_month).padStart(2, '0')}/${rentTx.period_year}`,
                periodEnd: `${lastDayOfMonth}/${String(rentTx.period_month).padStart(2, '0')}/${rentTx.period_year}`,
                receiptNumber: `QUITT-${Date.now().toString().slice(-8)}`,
                ownerName: fullProfile?.company_name || fullProfile?.full_name || ownerName,
                ownerAddress: fullProfile?.company_address || '',
                ownerNinea: fullProfile?.company_ninea,
                ownerLogo: fullProfile?.logo_url,
                ownerSignature: fullProfile?.signature_url,
                propertyAddress: lease.property_address,
            };

            const quittanceDoc = createQuittanceDocument(quittanceData);
            const stream = await ReactPDF.default.renderToStream(quittanceDoc);

            // Convertir le stream en buffer
            const chunks: Uint8Array[] = [];
            const quittanceBuffer = await new Promise<Buffer>((resolve, reject) => {
                stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
                stream.on('end', () => resolve(Buffer.concat(chunks)));
                stream.on('error', reject);
            });

            attachments.push({
                filename: `Quittance_${periodDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_')}_${lease.tenant_name.replace(/\s+/g, '_')}.pdf`,
                content: quittanceBuffer,
                contentType: 'application/pdf'
            });
            console.log("[sendWelcomePack] Rent receipt PDF attached");
        }
    } catch (e) {
        console.error("[sendWelcomePack] Error generating rent receipt:", e);
    }

    // 5. Construire la liste des documents pour l'affichage dans l'email
    const documentsList = [];
    if (attachments.find(a => a.filename.includes('Contrat'))) documentsList.push('Contrat de bail');
    if (attachments.find(a => a.filename.includes('Caution'))) documentsList.push('Reçu de caution');
    if (attachments.find(a => a.filename.includes('Quittance'))) documentsList.push('Quittance 1 mois de loyer');

    // 6. Envoyer l'email via Nodemailer avec React Email
    try {
        const _result = await sendEmail({

            to: lease.tenant_email,
            subject: `🏠 Bienvenue ${lease.tenant_name} - Votre Pack Locataire`,
            react: WelcomePackEmail({
                tenantName: lease.tenant_name,
                propertyAddress: lease.property_address || '',
                monthlyAmount: new Intl.NumberFormat('fr-FR').format(lease.monthly_amount),
                startDate: new Date(lease.start_date).toLocaleDateString('fr-FR'),
                billingDay: lease.billing_day,
                inviteLink: inviteLink,
                documentsList: documentsList,
                ownerName: ownerName,
                ownerAddress: profile?.company_address || undefined,
            }),
            attachments: attachments.length > 0 ? attachments : undefined
        });

        console.log("[sendWelcomePack] Email sent successfully");


        // 7. Sauvegarder le pack dans la GED (user_documents)
        if (attachments.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const { createClient: createAdminSupabase } = await import('@supabase/supabase-js');
                const supabaseAdmin = createAdminSupabase(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                for (const attachment of attachments) {
                    const fileName = `${user.id}/welcome-pack/${leaseId}_${Date.now()}.pdf`;
                    const contentBuffer = typeof attachment.content === 'string'
                        ? Buffer.from(attachment.content)
                        : attachment.content;

                    // Upload vers Storage
                    const { error: uploadError } = await supabaseAdmin.storage
                        .from('verification-docs')
                        .upload(fileName, contentBuffer, {
                            contentType: 'application/pdf',
                            upsert: false
                        });

                    if (!uploadError) {
                        // Enregistrer dans user_documents
                        await supabaseAdmin.from('user_documents').insert({
                            user_id: user.id,
                            file_name: attachment.filename,
                            file_path: fileName,
                            file_type: 'welcome_pack',
                            file_size: contentBuffer.length,
                            mime_type: 'application/pdf',
                            source: 'generated',
                            lease_id: leaseId,
                            category: 'welcome_pack',
                            description: `Pack de bienvenue - ${lease.tenant_name}`
                        });
                        console.log("[sendWelcomePack] Document saved to GED:", fileName);
                    } else {
                        console.error("[sendWelcomePack] Storage upload error:", uploadError.message);
                    }
                }
            } catch (storageError) {
                console.error("[sendWelcomePack] GED storage error (non-blocking):", storageError);
            }
        }

        // 8. Invalider le cache et revalider les paths pour que l'UI se mette à jour
        try {
            await invalidateRentalCaches(user.id, leaseId, {
                invalidateLeases: true,
                invalidateTransactions: true,
                invalidateStats: true
            });
            revalidatePath('/gestion');
            revalidatePath(`/gestion/locataires/${leaseId}`);
            console.log("[sendWelcomePack] Cache invalidated and paths revalidated");
        } catch (e) {
            console.error("[sendWelcomePack] Cache invalidation error (non-blocking):", e);
        }

        return { success: true, message: "Pack de bienvenue envoyé !" };
    } catch (emailError) {
        console.error("[sendWelcomePack] Email error:", emailError);
        return { success: false, error: "Erreur lors de l'envoi de l'email" };
    }
}

/**
 * Marque un loyer comme payé
 * Déclenche l'envoi automatique de la quittance par EMAIL via n8n
 */
/**
 * Marque un loyer comme payé
 * Déclenche l'envoi automatique de la quittance par EMAIL via n8n
 * Si pas d'ID de transaction, en crée une pour le mois courant
 */
export async function confirmPayment(leaseId: string, transactionId?: string, month?: number, year?: number, silent: boolean = false) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('payments.confirm');

    const supabase = await createClient();

    let targetId = transactionId;

    // 1. Si pas de transactionID, on en crée une pour le mois actuel
    // 1. Si pas de transactionID, on cherche ou on crée
    if (!targetId) {
        // Déterminer la période cible (Mois sélectionné OU Mois actuel par défaut)
        const targetMonth = month !== undefined ? month : (new Date().getMonth() + 1);
        const targetYear = year || new Date().getFullYear();

        // Pour les CAUTIONS (month=0), on ne filtre PAS par année
        const isDeposit = targetMonth === 0;

        // A) Vérifier s'il existe DÉJÀ une transaction pour ce bail/mois(/année)
        let query = supabase
            .from('rental_transactions')
            .select('id, status')
            .eq('team_id', teamId)
            .eq('lease_id', leaseId)
            .eq('period_month', targetMonth);

        // Ne filtrer par année QUE pour les loyers (pas pour les cautions)
        if (!isDeposit) {
            query = query.eq('period_year', targetYear);
        }

        const { data: existingTx } = await query.limit(1).maybeSingle();

        console.log(`[confirmPayment] Looking for transaction: lease=${leaseId}, month=${targetMonth}, year=${isDeposit ? 'N/A (deposit)' : targetYear}, found=${!!existingTx}`);

        if (existingTx) {
            // Si elle existe déjà, on l'utilise (même si elle est payée, on la mettra à jour en 'paid')
            targetId = existingTx.id;
        } else {
            // B) Sinon, on en crée une nouvelle
            const { data: lease } = await supabase
                .from('leases')
                .select('monthly_amount, team_id')
                .eq('id', leaseId)
                .single();

            if (!lease) return { success: false, error: "Bail introuvable" };

            // Fallback: si le bail n'a pas de team_id (anciens baux), on utilise celui de l'utilisateur
            let effectiveTeamId = lease.team_id;
            if (!effectiveTeamId) {
                const { data: teamMember } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', user.id)
                    .maybeSingle();
                effectiveTeamId = teamMember?.team_id || null;
                console.log(`[confirmPayment] Lease has no team_id, using user's team: ${effectiveTeamId}`);
            }

            const { data: newTrans, error: insertError } = await supabase
                .from('rental_transactions')
                .insert([{
                    lease_id: leaseId,
                    period_month: targetMonth,
                    period_year: targetYear,
                    amount_due: lease.monthly_amount,
                    status: 'pending',
                    team_id: teamId
                }])
                .select()
                .single();

            if (insertError || !newTrans) {
                console.error("Erreur création transaction auto:", insertError);
                return { success: false, error: "Impossible de créer la transaction de paiement" };
            }
            targetId = newTrans.id;
        }
    }

    // 2. Mettre à jour la transaction comme payée
    const { data: trans, error: updateError } = await supabase
        .from('rental_transactions')
        .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'manual', // Par défaut pour confirmation manuelle
            team_id: teamId, // Sécurité
            meta: {
                provider: 'manual',
                confirmed_by: user.id,
                confirmed_at: new Date().toISOString(),
                currency: 'XOF',
            },
        })
        .eq('id', targetId)
        .eq('team_id', teamId)
        .select('*, leases(tenant_name, tenant_email, monthly_amount, owner_id, property_address)')
        .single();

    if (updateError || !trans) {
        console.error("Erreur confirmation paiement:", updateError?.message);
        return { success: false, error: updateError?.message || "Transaction introuvable" };
    }

    // 4. Récupérer le profil du propriétaire pour les infos de l'agence
    const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_email, company_ninea, signature_url, logo_url, full_name')
        .eq('id', user.id)
        .maybeSingle();

    // 5. Envoi automatique de la quittance par email (Gmail direct) - SAUF si mode silent
    let emailSent = false;

    if (!silent && trans && trans.leases && trans.leases.tenant_email) {
        try {
            // Préparer les données pour la quittance
            const receiptData = {
                // Locataire
                tenantName: trans.leases.tenant_name || 'Locataire',
                tenantEmail: trans.leases.tenant_email,
                tenantAddress: trans.leases.property_address || '',

                // Montants
                amount: trans.amount_due || 0,

                // Période
                periodMonth: new Date(trans.period_year, trans.period_month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                periodStart: `01/${String(trans.period_month).padStart(2, '0')}/${trans.period_year}`,
                periodEnd: `${new Date(trans.period_year, trans.period_month, 0).getDate()}/${String(trans.period_month).padStart(2, '0')}/${trans.period_year}`,

                // Référence
                receiptNumber: `QUITT-${Date.now().toString().slice(-8)}`,

                // ID pour sauvegarde automatique
                leaseId: trans.lease_id,

                // Propriétaire / Agence
                ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
                ownerAddress: profile?.company_address || '',
                ownerNinea: profile?.company_ninea || '',
                ownerLogo: profile?.logo_url || undefined,
                ownerSignature: profile?.signature_url || undefined,
                ownerEmail: profile?.company_email || undefined, // Email de l'agence (priorité)
                ownerAccountEmail: user.email, // Email du compte (fallback)

                // Propriété
                propertyAddress: trans.leases.property_address || 'Adresse non renseignée',
            };

            try {
                // Appeler l'API de génération de quittance (PDF)
                // Note: fetch interne nécessite l'URL absolue en Server Actions
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doussell-immo.com';
                const start = performance.now();
                const response = await fetch(`${baseUrl}/api/send-receipt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptData),
                });
                console.log(`[confirmPayment] Receipt API call took ${Math.round(performance.now() - start)}ms`);

                if (response.ok) {
                    emailSent = true;
                    console.log("[confirmPayment] Quittance envoyée par email");
                } else {
                    console.error("[confirmPayment] Erreur API quittance:", await response.text());
                }
            } catch (err) {
                console.error("[confirmPayment] Exception API quittance:", err);
            }
        } catch (err) {
            console.error("Erreur générale quittance:", err);
        }
    }

    // PRIORITÉ : Invalider le cache AVANT revalidatePath pour màj UI immédiate
    try {
        // Invalidation directe de la clé de transaction spécifique
        await invalidateCacheBatch([`rental_transactions:${leaseId}`], 'rentals');

        // Puis invalidation globale
        await invalidateRentalCaches(teamId, leaseId, {
            invalidateLeases: true,
            invalidateTransactions: true,
            invalidateStats: true
        });
    } catch (e) {
        console.error("[confirmPayment] Cache invalidation error:", e);
    }

    // 🔥 CACHE WARMING (Pré-chauffage)
    // Pour éviter le "Thundering Herd" (Timeouts) quand le dashboard se rafraîchit
    // on relance immédiatement les requêtes lourdes pour repeupler le cache Redis
    // de manière séquentielle AVANT que le client ne fasse ses requêtes parallèles.
    try {
        console.log("[confirmPayment] 🔥 Warming up cache...");
        await Promise.all([
            getRentalTransactions([], teamId), // Récupérer toutes les transactions
            getLeasesByTeam(teamId, "active"), // Récupérer les baux actifs
            getRentalStatsByTeam(teamId)       // Recalculer les stats
        ]);
        console.log("[confirmPayment] ✅ Cache warmed up!");
    } catch (warmError) {
        console.error("[confirmPayment] ⚠️ Cache warming failed:", warmError);
    }

    // Revalider les pages APRÈS l'invalidation du cache
    revalidatePath('/gestion');
    revalidatePath(`/gestion/locataires/${leaseId}`);

    // Message personnalisé selon si l'email a été déclenché
    const message = emailSent
        ? `Paiement validé ! La quittance sera envoyée par email au locataire (${trans.leases?.tenant_email}) avec copie au propriétaire.`
        : "Paiement validé ! Vous pouvez générer la quittance manuellement.";

    return { success: true, message };
}

/**
 * Met à jour les informations d'un locataire/bail
 */
export async function updateLease(leaseId: string, data: {
    tenant_name?: string;
    tenant_phone?: string;
    tenant_email?: string;
    property_address?: string;
    monthly_amount?: number;
    billing_day?: number;
    start_date?: string;
    end_date?: string;
}) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.edit');

    const supabase = await createClient();

    // 1. Vérifier que le bail appartient à l'équipe
    const { data: lease, error: fetchError } = await supabase
        .from('leases')
        .select('owner_id, team_id, property_id')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (fetchError || !lease) {
        return { success: false, error: "Bail non trouvé ou non autorisé" };
    }

    // 2. Préparer les données de mise à jour
    const updateData: Record<string, string | number | undefined> = {};
    if (data.tenant_name !== undefined) updateData.tenant_name = data.tenant_name;
    if (data.tenant_phone !== undefined) updateData.tenant_phone = data.tenant_phone;
    if (data.tenant_email !== undefined) updateData.tenant_email = data.tenant_email;
    if (data.property_address !== undefined) updateData.property_address = data.property_address;
    if (data.monthly_amount !== undefined) updateData.monthly_amount = data.monthly_amount;
    if (data.billing_day !== undefined) updateData.billing_day = data.billing_day;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;

    const { error: updateError } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', leaseId)
        .eq('team_id', teamId);

    if (updateError) {
        console.error("Erreur mise à jour bail:", updateError.message);
        return { success: false, error: updateError.message };
    }

    // 3. Si le bail est lié à une propriété, mettre à jour la propriété aussi
    if (lease.property_id && updateData.property_address) {
        const { error: propError } = await supabase
            .from('properties')
            .update({
                title: updateData.property_address as string
            })
            .eq('id', lease.property_id)
            .eq('team_id', teamId);

        if (propError) {
            console.warn("Erreur mise à jour propriété liée:", propError.message);
        }
    }

    // 4. Invalidation du cache
    await invalidateRentalCaches(teamId, leaseId, {
        invalidateLeases: true,
        invalidateTransactions: false,
        invalidateStats: true
    });

    revalidatePath('/gestion');
    return { success: true };
}

/**
 * Lier un bail orphelin à un bien existant
 * Utilisé après import en masse pour la réconciliation
 */
export async function linkLeaseToProperty(leaseId: string, propertyId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.edit');

    const supabase = await createClient();

    // 1. Vérifier que le bail et le bien appartiennent à l'équipe
    const { data: lease, error: leaseErr } = await supabase
        .from('leases')
        .select('id')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    const { data: property, error: propErr } = await supabase
        .from('properties')
        .select('id, title, location')
        .eq('id', propertyId)
        .eq('team_id', teamId)
        .single();

    if (leaseErr || !lease || propErr || !property) {
        return { success: false, error: "Bail ou bien non trouvé ou non autorisé" };
    }

    // 2. Préparer l'adresse du bien
    const propertyAddress = (property as any).location?.address ||
        `${(property as any).location?.district || ''}, ${(property as any).location?.city || ''}`.trim() ||
        property.title;

    // 3. Faire la liaison
    const { error: linkError } = await supabase
        .from('leases')
        .update({
            property_id: propertyId,
            property_address: propertyAddress
        })
        .eq('id', leaseId)
        .eq('team_id', teamId);

    if (linkError) {
        console.error("Erreur liaison bail-bien:", linkError.message);
        return { success: false, error: linkError.message };
    }

    // 4. Mettre à jour le statut du bien de manière adaptative
    // Compter les baux actifs pour ce bien
    const { count: activeLeasesCount } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .eq('status', 'active');

    const bedrooms = (property as any).specs?.bedrooms || 1;
    const currentOccupancy = activeLeasesCount || 0;

    // Déterminer s'il est plein
    const isFull = currentOccupancy >= bedrooms;

    const newDetails = {
        ...((property as any).details || {}),
        occupied_rooms: currentOccupancy
    };

    await supabase
        .from('properties')
        .update({
            status: isFull ? 'loué' : 'disponible',
            validation_status: isFull ? 'pending' : 'approved',
            details: newDetails
        })
        .eq('id', propertyId)
        .eq('team_id', teamId);

    // 5. Invalider cache
    await invalidateRentalCaches(teamId, leaseId, {
        invalidateLeases: true,
        invalidateStats: true
    });

    revalidatePath('/gestion');
    return { success: true };
}

/**
 * Résilier un bail (Suppression logique - conserve l'historique)
 * Change le statut à 'terminated' et enregistre la date de fin
 */
export async function terminateLease(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.terminate');

    const supabase = await createClient();

    // 1. Récupérer le bail pour confirmation (sécurisé par teamId)
    const { data: lease, error: fetchError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (fetchError || !lease) {
        return { success: false, error: "Bail introuvable ou non autorisé" };
    }

    // 2. Résilier le bail
    const { error: updateError } = await supabase
        .from('leases')
        .update({
            status: 'terminated',
            end_date: new Date().toISOString()
        })
        .eq('id', leaseId)
        .eq('team_id', teamId);

    if (updateError) {
        console.error("Erreur résiliation bail:", updateError.message);
        return { success: false, error: updateError.message };
    }

    // 3. Invalider caches
    await invalidateRentalCaches(teamId, leaseId, {
        invalidateLeases: true,
        invalidateTransactions: false,
        invalidateStats: true
    });

    revalidatePath('/gestion');
    return {
        success: true,
        message: `Le bail de ${lease.tenant_name} a été résilié.`
    };
}

/**
 * Réactiver un bail résilié
 * Change le statut de 'terminated' à 'active'
 */
export async function reactivateLease(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('leases.edit');

    const supabase = await createClient();

    // Réactiver le bail
    const { error } = await supabase
        .from('leases')
        .update({
            status: 'active'
        })
        .eq('id', leaseId)
        .eq('team_id', teamId);

    if (error) {
        console.error("Erreur réactivation bail:", error.message);
        return { success: false, error: error.message };
    }

    // 3. Invalider caches
    await invalidateCacheBatch([
        `leases:${teamId}:active`,
        `leases:${teamId}:terminated`,
        `leases:${teamId}:all`,
        `lease_detail:${leaseId}`,
        `rental_stats:${teamId}`
    ], 'rentals');

    revalidatePath('/gestion');
    return {
        success: true,
        message: "L'opération a été effectuée avec succès."
    };
}

/**
 * Signaler une demande de maintenance
 * Peut être signalé par le propriétaire (avec sélection du bail) ou le locataire
 */
export async function createMaintenanceRequest(data: {
    leaseId?: string;
    description: string;
    category?: string;
}) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    await requireTeamPermission('maintenance.create');

    const supabase = await createClient();

    // Si pas de leaseId fourni, prendre le premier bail actif du propriétaire
    let targetLeaseId = data.leaseId;

    if (!targetLeaseId) {
        const { data: firstLease } = await supabase
            .from('leases')
            .select('id')
            .eq('team_id', teamId)
            .eq('status', 'active')
            .limit(1)
            .single();

        if (!firstLease) {
            return { success: false, error: "Aucun bail actif trouvé pour cette équipe" };
        }
        targetLeaseId = firstLease.id;
    }

    // 1. Récupérer les infos du bail pour le contexte (Adresse pour Google Maps)
    const { data: leaseContext } = await supabase
        .from('leases')
        .select('property_address, tenant_name, tenant_phone, tenant_email, property_id')
        .eq('id', targetLeaseId)
        .eq('team_id', teamId)
        .single();

    // Variables pour stocker les infos artisan
    let artisanData: {
        name?: string;
        phone?: string;
        rating?: number;
        address?: string;
    } = {};
    let status = 'open';

    // 2. APPEL DU WEBHOOK MAKE (Recherche Artisan)
    // On priorise MAKE_WEBHOOK_URL, fallback sur N8N_WEBHOOK_URL
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (MAKE_WEBHOOK_URL) {
        try {
            console.log(`[createMaintenanceRequest] Appel webhook: ${MAKE_WEBHOOK_URL}`);
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: data.category || "General",
                    location: leaseContext?.property_address || "Dakar, Sénégal",
                    issue: data.description,
                    tenantName: leaseContext?.tenant_name,
                    tenantPhone: leaseContext?.tenant_phone,
                    tenantEmail: leaseContext?.tenant_email,
                    webhookType: 'find_artisan'
                })
            });

            if (response.ok) {
                const responseText = await response.text();
                try {
                    const result = JSON.parse(responseText);
                    if (result.artisan_name) {
                        artisanData = {
                            name: result.artisan_name,
                            phone: result.artisan_phone,
                            rating: parseFloat(result.rating) || undefined,
                            address: result.address
                        };
                        status = 'artisan_found';
                    }
                } catch (parseError) {
                    console.error("[createMaintenanceRequest] Erreur parsing JSON webhook:", parseError, "Réponse:", responseText.slice(0, 100));
                }
            } else {
                console.error(`[createMaintenanceRequest] Erreur HTTP webhook: ${response.status}`, await response.text().catch(() => "N/A"));
            }
        } catch (e) {
            console.error("[createMaintenanceRequest] Exception Webhook Make:", e);
        }
    } else {
        console.warn("[createMaintenanceRequest] MAKE_WEBHOOK_URL non configuré.");
    }

    // 3. ENREGISTRER EN BASE
    const { data: request, error: insertError } = await supabase
        .from('maintenance_requests')
        .insert([{
            lease_id: targetLeaseId,
            property_id: leaseContext?.property_id,
            team_id: teamId,
            description: data.description,
            category: data.category || 'General',
            status: status || 'open', // 'open' triggers artisan search if artisan found, otherwise searching
            artisan_name: artisanData.name,
            artisan_phone: artisanData.phone,
            artisan_rating: artisanData.rating,
            artisan_address: artisanData.address,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (insertError) {
        console.error("Erreur création demande maintenance:", insertError.message);
        return { success: false, error: insertError.message };
    }

    revalidatePath('/gestion');

    return {
        success: true,
        id: request.id,
        artisanFound: status === 'artisan_found',
        artisan: artisanData.name ? artisanData : null,
        message: status === 'artisan_found'
            ? "Artisan trouvé !"
            : (MAKE_WEBHOOK_URL ? "Demande enregistrée, recherche d'artisan lancée..." : "Demande enregistrée.")
    };
}

/**
 * Saisir le devis réel après contact avec l'artisan
 * Passe le statut à 'awaiting_approval' pour validation propriétaire
 */
export async function submitQuote(requestId: string, data: {
    quoted_price: number;
    intervention_date: string;
    quote_url?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    // 1. Récupérer les infos pour le PDF
    const { data: request, error: reqError } = await supabase
        .from('maintenance_requests')
        .select(`
            id, 
            description, 
            category, 
            lease_id,
            artisan_name,
            artisan_phone,
            leases (
                tenant_name,
                property_id,
                properties (
                    title,
                    location
                )
            )
        `)
        .eq('id', requestId)
        .single();

    if (reqError || !request) return { success: false, error: "Intervention introuvable" };

    // 2. Récupérer le profil du propriétaire pour le branding
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name, company_address, logo_url')
        .eq('id', user.id)
        .single();

    let finalQuoteUrl = data.quote_url;

    try {
        let fileBuffer: Uint8Array | null = null;
        let fileName = `Devis_${request.category || 'Intervention'}_${requestId.slice(0, 5)}.pdf`;
        let isAutoGenerated = false;

        // 3. Préparer le buffer (Génération ou Téléchargement pour standardisation)
        if (!finalQuoteUrl) {
            // Génération Auto
            const pdfBytes = await generateMaintenancePDF({
                requestId: request.id,
                description: request.description,
                category: request.category || 'Maintenance',
                interventionDate: data.intervention_date,
                quotedPrice: data.quoted_price,
                propertyTitle: (request.leases as any)?.properties?.title || 'Bien non spécifié',
                propertyAddress: (request.leases as any)?.properties?.location?.address || '',
                tenantName: (request.leases as any)?.tenant_name || 'Locataire',
                artisanName: request.artisan_name || undefined,
                artisanPhone: request.artisan_phone || undefined,
                ownerName: profile?.full_name || 'Propriétaire',
                ownerCompany: profile?.company_name || undefined,
                ownerAddress: profile?.company_address || undefined,
                logoUrl: profile?.logo_url || undefined,
            });
            fileBuffer = pdfBytes;
            fileName = `auto_quote_${requestId}_${Date.now()}.pdf`;
            isAutoGenerated = true;
        } else {
            // Récupération fichier existant (upload manuel client)
            // On le récupère pour le ré-uploader proprement via GED (standardisation metadonnées)
            const response = await fetch(finalQuoteUrl);
            if (!response.ok) throw new Error("Impossible de récupérer le fichier uploadé");
            const arrayBuffer = await response.arrayBuffer();
            fileBuffer = new Uint8Array(arrayBuffer);
            fileName = `manual_quote_${requestId}_${Date.now()}.pdf`;
        }

        // 4. Stockage unifié via GED
        // Utilisation du bucket 'properties' car les fichiers doivent être accessibles publiquement (pour le tenant)
        // storeDocumentInGED gère aussi l'inscription dans user_documents
        const gedResult = await storeDocumentInGED({
            userId: user.id,
            fileBuffer: fileBuffer!,
            fileName: fileName,
            bucketName: 'properties',
            documentType: 'maintenance',
            metadata: {
                requestId: requestId,
                propertyId: (request.leases as any)?.property_id || null,
                leaseId: request.lease_id || null,
                tenantName: (request.leases as any)?.tenant_name,
                description: `Devis ${isAutoGenerated ? 'auto' : 'manuel'} pour : ${request.description.slice(0, 50)}`
            }
        }, supabase);

        if (gedResult.success && gedResult.fileUrl) {
            finalQuoteUrl = gedResult.fileUrl;
        } else {
            console.error("Erreur GED:", gedResult.error);
            // Si auto-généré et échec GED, c'est bloquant car on n'a pas d'URL
            if (isAutoGenerated && !finalQuoteUrl) throw new Error("Echec stockage GED du devis auto: " + (gedResult.error || "erreur inconnue"));
        }

    } catch (err: any) {
        console.error("Erreur traitement devis:", err);
        return { success: false, error: "Erreur lors du traitement du document: " + err.message };
    }

    const { error } = await supabase
        .from('maintenance_requests')
        .update({
            quoted_price: data.quoted_price,
            intervention_date: data.intervention_date,
            quote_url: finalQuoteUrl,
            status: 'awaiting_approval' // En attente de validation propriétaire
        })
        .eq('id', requestId);

    if (error) {
        console.error("Erreur saisie devis:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion');
    return { success: true, message: "Devis enregistré, en attente de validation." };
}

/**
 * Répondre à une demande de report du locataire
 */
export async function handleOwnerRescheduleResponse(requestId: string, action: 'accept' | 'decline', newDate?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const updateData: any = {};
    if (action === 'accept') {
        // Récupérer la date suggérée
        const { data: request } = await supabase
            .from('maintenance_requests')
            .select('tenant_suggested_date')
            .eq('id', requestId)
            .single();

        if (request?.tenant_suggested_date) {
            updateData.intervention_date = request.tenant_suggested_date;
            updateData.tenant_response = 'confirmed'; // On remet à confirmé
            updateData.tenant_suggested_date = null;
        }
    } else if (newDate) {
        updateData.intervention_date = newDate;
        updateData.tenant_response = null; // On attend la nouvelle réponse du locataire
        updateData.tenant_suggested_date = null;
    }

    const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion');
    return { success: true, message: action === 'accept' ? "Nouveau créneau accepté." : "Nouvelle date proposée." };
}

/**
 * Valider une demande de maintenance (Locataire -> Recherche Artisan)
 * Passe le statut de 'submitted' à 'open' et déclenche le webhook de recherche
 */
export async function validateMaintenanceRequest(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    // 1. Récupérer les détails de la demande
    const { data: request, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select(`
            *,
            leases(property_address, tenant_name, tenant_phone, tenant_email)
        `)
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        return { success: false, error: "Intervention introuvable" };
    }

    const lease = Array.isArray(request.leases) ? request.leases[0] : request.leases;

    // 2. Tenter de trouver un artisan via Webhook
    let artisanData: {
        name?: string;
        phone?: string;
        rating?: number;
        address?: string;
    } = {};
    let newStatus = 'open';

    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (MAKE_WEBHOOK_URL) {
        try {
            console.log(`[validateMaintenanceRequest] Appel webhook: ${MAKE_WEBHOOK_URL}`);
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: request.category || "General",
                    location: lease?.property_address || "Dakar, Sénégal",
                    issue: request.description,
                    tenantName: lease?.tenant_name,
                    tenantPhone: lease?.tenant_phone,
                    tenantEmail: lease?.tenant_email,
                    webhookType: 'find_artisan'
                })
            });

            if (response.ok) {
                const responseText = await response.text();
                try {
                    const result = JSON.parse(responseText);
                    if (result.artisan_name) {
                        artisanData = {
                            name: result.artisan_name,
                            phone: result.artisan_phone,
                            rating: parseFloat(result.rating) || undefined,
                            address: result.address
                        };
                        newStatus = 'artisan_found';
                    }
                } catch (parseError) {
                    console.error("[validateMaintenanceRequest] Erreur parsing JSON webhook:", parseError, "Réponse:", responseText.slice(0, 100));
                }
            } else {
                console.error(`[validateMaintenanceRequest] Erreur HTTP webhook: ${response.status}`, await response.text().catch(() => "N/A"));
            }
        } catch (e) {
            console.error("[validateMaintenanceRequest] Exception Webhook validation:", e);
        }
    } else {
        console.warn("[validateMaintenanceRequest] MAKE_WEBHOOK_URL non configuré.");
    }

    // 3. Mettre à jour la demande
    const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({
            status: newStatus,
            artisan_name: artisanData.name,
            artisan_phone: artisanData.phone,
            artisan_rating: artisanData.rating,
            artisan_address: artisanData.address,
        })
        .eq('id', requestId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    revalidatePath('/gestion');
    return {
        success: true,
        message: newStatus === 'artisan_found'
            ? "Intervention validée et artisan trouvé !"
            : (MAKE_WEBHOOK_URL ? "Intervention validée, recherche d'artisan lancée..." : "Intervention validée (Webhook non configuré)")
    };
}

/**
 * Rejeter une demande de maintenance
 */
export async function rejectMaintenanceRequest(requestId: string, reason?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const { error } = await supabase
        .from('maintenance_requests')
        .update({
            status: 'rejected',
            rejection_reason: reason
        })
        .eq('id', requestId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion');
    return { success: true, message: "Signalement rejeté." };
}

/**
 * Le propriétaire approuve le devis
 * Passe le statut à 'approved' et lance les travaux
 */
export async function approveQuoteByOwner(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    const { data: request, error } = await supabase
        .from('maintenance_requests')
        .update({
            status: 'approved',
            owner_approved: true
        })
        .eq('id', requestId)
        .select('*, leases(tenant_name, tenant_email, owner_id)')
        .single();

    if (error) {
        console.error("Erreur approbation devis:", error.message);
        return { success: false, error: error.message };
    }

    // Récupérer les informations complètes du bail pour l'email
    const lease = Array.isArray(request.leases) ? request.leases[0] : request.leases;
    const tenantEmail = lease?.tenant_email;
    const tenantName = lease?.tenant_name;

    // Notification à l'artisan via webhook
    await triggerN8N('maintenance-quote-approved', {
        requestId: request.id,
        description: request.description,
        quoteAmount: request.quoted_price,
        artisanPhone: request.artisan_phone
    });

    // Notification au locataire par email (Nodemailer)
    if (tenantEmail && request.artisan_name) {
        const datePrevue = request.intervention_date
            ? new Date(request.intervention_date).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(':', 'h')
            : 'à confirmer';

        try {
            await sendEmail({
                to: tenantEmail,
                subject: `✅ Intervention validée : ${request.description}`,
                react: MaintenanceUpdateEmail({
                    tenantName: tenantName || 'Locataire',
                    description: request.description,
                    artisanName: request.artisan_name,
                    artisanPhone: request.artisan_phone,
                    artisanAddress: request.artisan_address || undefined,
                    interventionDate: datePrevue,
                    status: "approved",
                })
            });
            console.log(`✅ Email envoyé à ${tenantEmail} pour intervention ${request.description}`);
        } catch (emailError) {

            console.error("❌ Erreur envoi email locataire:", emailError);
            // On ne bloque pas le workflow si l'email échoue
        }
    }

    revalidatePath('/gestion');
    return { success: true, message: "Devis approuvé ! Le locataire et l'artisan ont été notifiés." };
}

/**
 * Terminer l'intervention et créer la dépense comptable
 * Crée automatiquement une ligne dans la table 'expenses'
 */
export async function completeIntervention(requestId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Non autorisé" };

    // 1. Récupérer les détails de l'intervention
    const { data: request, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('*, leases(owner_id, property_id)')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        return { success: false, error: "Intervention introuvable" };
    }

    // Vérifier que le devis a été approuvé
    if (!request.owner_approved) {
        return { success: false, error: "Le devis doit être approuvé avant de terminer." };
    }

    // 2. Mettre à jour le statut de l'intervention
    const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // 3. Créer la dépense comptable
    const leaseData = Array.isArray(request.leases) ? request.leases[0] : request.leases;

    if (leaseData && request.quoted_price) {
        const { error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                owner_id: user.id,
                property_id: leaseData.property_id || null,
                // maintenance_request_id: requestId, // Commenting out potential invalid column, enabling if confirmed
                lease_id: request.lease_id || null, // Best guess mapping
                description: `Intervention: ${request.description} (${request.artisan_name || 'Artisan'})`,
                amount: request.quoted_price,
                category: 'maintenance',
                expense_date: new Date().toISOString().split('T')[0]
                // If maintenance_request_id exists in DB, uncomment below:
                // maintenance_request_id: requestId, 
            }]);

        if (expenseError) {
            console.error("Erreur création dépense:", expenseError.message);
            // On ne bloque pas la clôture
        }
    }

    revalidatePath('/gestion');
    return {
        success: true,
        message: `Intervention terminée ! Dépense de ${request.quoted_price?.toLocaleString('fr-FR')} FCFA enregistrée.`
    };
}

/**
 * Envoyer une invitation au portail locataire
 * Génère un lien magique (Magic Link) et l'envoie par email
 */
export async function sendTenantInvitation(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    if (!user) return { success: false, error: "Non autorisé" };

    const supabase = await createClient();
    // 1. Récupérer les infos du locataire
    const { data: lease } = await supabase
        .from('leases')
        .select('tenant_name, tenant_email, property_address, team_id')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (!lease) return { success: false, error: "Bail introuvable" };
    if (lease.team_id !== teamId) return { success: false, error: "Non autorisé" };
    if (!lease.tenant_email) return { success: false, error: "Email du locataire manquant" };

    // Récupérer le nom de l'expéditeur
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', user.id)
        .maybeSingle();

    const ownerName = profile?.company_name || profile?.full_name || "Votre propriétaire";


    // 2. Générer le token d'accès locataire (système custom, cookie-based)
    const { generateTenantAccessToken, getTenantMagicLinkUrl } = await import('@/lib/tenant-magic-link');
    const rawToken = await generateTenantAccessToken(leaseId);
    const magicLink = getTenantMagicLinkUrl(rawToken);

    // 3. Envoyer l'email
    try {
        await sendEmail({
            to: lease.tenant_email,
            subject: `Invitation à votre Espace Locataire - Dousel`,
            react: TenantInvitationEmail({
                tenantName: lease.tenant_name,
                propertyAddress: lease.property_address || '',
                magicLink: magicLink,
                ownerName: ownerName,
            })
        });

        return { success: true, message: `Invitation envoyée à ${lease.tenant_email}` };


    } catch (emailError) {
        console.error("Erreur envoi email invitation:", emailError);
        return { success: false, error: "Erreur lors de l'envoi de l'email" };
    }
}





/**
 * Récupérer les baux actifs (pour le select du formulaire de signalement)
 */
export async function getActiveLeases() {
    const context = await getUserTeamContext();
    if (!context) return { success: false, data: [] };
    const { teamId, user } = context;

    if (!user) {
        return { success: false, data: [] };
    }

    const supabase = await createClient();
    const { data: leases, error } = await supabase
        .from('leases')
        .select('id, tenant_name, property_address')
        .eq('status', 'active')
        .eq('team_id', teamId);

    if (error) {
        return { success: false, data: [] };
    }

    return { success: true, data: leases || [] };
}

/**
 * Envoie les données de quittance à Pipedream
 * Formate correctement le payload pour le webhook Pipedream
 */
export async function sendReceiptToN8N(data: Record<string, unknown>) {
    // 1. On récupère l'URL Pipedream définie dans .env.local
    const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
        console.error("URL Pipedream manquante !");
        return { success: false, error: "Configuration webhook manquante" };
    }

    // 2. On prépare le paquet de données (L'enveloppe)
    // On mappe vos données Supabase vers les noms attendus par Pipedream

    // Debug: Voir ce qu'on reçoit vraiment
    console.log("=".repeat(80));
    console.log("📦 DONNÉES BRUTES REÇUES AVANT ENVOI:");
    const tenant = data.tenant as Record<string, unknown> | undefined;
    const profile = data.profile as Record<string, unknown> | undefined;
    console.log("📧 Email du tenant:", tenant?.email);
    console.log("📞 Téléphone du tenant:", tenant?.phone);
    console.log("👤 Objet tenant complet:", JSON.stringify(tenant, null, 2));
    console.log("=".repeat(80));

    const payload = {
        // Infos Locataire
        tenantName: tenant?.tenant_name || tenant?.name || '',
        tenantEmail: tenant?.email || tenant?.tenant_email || '',
        tenantPhone: tenant?.phone || tenant?.tenant_phone || '',
        tenantAddress: tenant?.address || (data.property_address as string) || '',

        // Infos Paiement
        amount: Number(data.amount) || 0,
        periodMonth: data.periodMonth || `${data.month || new Date().getMonth() + 1}/2025`,
        periodStart: data.periodStart || `01/${data.month || new Date().getMonth() + 1}/2025`,
        periodEnd: data.periodEnd || `30/${data.month || new Date().getMonth() + 1}/2025`,
        receiptNumber: data.receiptNumber || `QUITT-${Date.now().toString().slice(-6)}`,

        // Infos Propriétaire (Baraka Immo)
        ownerName: profile?.company_name || profile?.full_name || 'Propriétaire',
        ownerEmail: profile?.email || '',
        ownerLogo: profile?.logo_url || null,
        ownerSignature: profile?.signature_url || null,
        ownerAddress: profile?.company_address || '',
        ownerNinea: profile?.ninea || '',

        // Infos Propriété
        propertyAddress: (data.property_address as string) || tenant?.address || '',

        // Image de la quittance (si générée côté client)
        receiptImage: data.receiptImage || null
    };

    console.log("📤 Envoi à Pipedream :", JSON.stringify(payload, null, 2)); // Pour vérifier dans vos logs serveur

    try {
        // 3. On expédie le tout à Pipedream
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) // Pipedream : envoyer directement le payload, pas enveloppé
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur Pipedream:', response.status, response.statusText);
            console.error('Réponse brute:', errorText.substring(0, 500)); // Log les 500 premiers caractères
            return {
                success: false,
                error: `Erreur webhook (${response.status}): ${response.statusText}`
            };
        }

        // Essayer de parser la réponse comme JSON
        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
            console.log("✅ Réponse Pipedream:", result);
            return { success: true, data: result };
        } catch (_parseError) {
            // Si ce n'est pas du JSON, c'est probablement du HTML d'erreur
            console.warn("⚠️ Réponse non-JSON reçue:", responseText.substring(0, 200));

            // On considère quand même que c'est un succès si status 200
            if (response.status === 200) {
                console.log("✅ Requête envoyée avec succès (pas de JSON retourné)");
                return {
                    success: true,
                    data: {
                        message: "Envoyé à Pipedream (pas de réponse JSON)",
                        rawResponse: responseText.substring(0, 200)
                    }
                };
            }

            return {
                success: false,
                error: "Réponse invalide de Pipedream (pas du JSON)"
            };
        }
    } catch (error) {
        console.error("❌ Echec envoi Pipedream:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Impossible de joindre le webhook"
        };
    }
}

/**
 * Supprime une transaction (pour nettoyer les doublons générés par erreur)
 */
export async function deleteTransaction(transactionId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { success: false, error: "Non autorisé" };
    }

    // Sécurité: Vérifier que la transaction appartient bien à un bail de l'équipe
    const { data: transaction } = await supabase
        .from('rental_transactions')
        .select('lease_id, leases!inner(team_id)')
        .eq('id', transactionId)
        .single();

    const leaseData = transaction?.leases as { team_id: string } | undefined;

    if (!transaction || !leaseData || leaseData.team_id !== teamId) {
        return { success: false, error: "Transaction introuvable ou non autorisée" };
    }

    const { error } = await supabase
        .from('rental_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('team_id', teamId);

    if (error) {
        console.error("Erreur suppression transaction:", error.message);
        return { success: false, error: error.message };
    }

    revalidatePath('/gestion');
    return { success: true };
}

/**
 * Supprime DÉFINITIVEMENT un bail (Fonction de nettoyage)
 */
export async function deleteLease(leaseId: string) {
    const context = await getUserTeamContext();
    if (!context) return { success: false, error: "Non autorisé" };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) return { success: false, error: "Non autorisé" };

    const { data: lease } = await supabase
        .from('leases')
        .select('team_id')
        .eq('id', leaseId)
        .eq('team_id', teamId)
        .single();

    if (!lease) {
        return { success: false, error: "Bail introuvable ou non autorisé" };
    }

    const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', leaseId)
        .eq('team_id', teamId);

    if (error) {
        console.error("Erreur suppression bail:", error.message);
        return { success: false, error: error.message };
    }

    // Invalider caches
    await invalidateRentalCaches(teamId, leaseId);

    revalidatePath('/gestion');
    return { success: true };
}

/**
 * Vérifie si l'owner connecté est aussi locataire dans un autre bien
 *
 * Recherche les baux actifs où l'email de l'owner correspond à tenant_email.
 * Utilisé pour afficher le switch "Espace Locataire" dans le dropdown.
 *
 * Per WORKFLOW_PROPOSAL.md section 2.5 - Switch role Owners
 */
export async function checkOwnerHasTenantAccess(): Promise<{
    hasTenantAccess: boolean;
    tenantLease?: {
        id: string;
        property_title: string;
        owner_name: string;
        has_valid_token: boolean;
    };
}> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
        return { hasTenantAccess: false };
    }

    // Chercher un bail actif où cet email est le locataire
    const { data: lease, error } = await supabase
        .from('leases')
        .select(`
            id,
            tenant_access_token,
            tenant_token_expires_at,
            property:properties(title),
            owner:profiles!leases_owner_id_fkey(full_name, company_name)
        `)
        .eq('tenant_email', user.email.toLowerCase())
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    if (error || !lease) {
        return { hasTenantAccess: false };
    }

    // Vérifier si le token est valide
    const hasValidToken = !!(
        lease.tenant_access_token &&
        lease.tenant_token_expires_at &&
        new Date(lease.tenant_token_expires_at) > new Date()
    );

    const property = lease.property as { title?: string } | null;
    const owner = lease.owner as { full_name?: string; company_name?: string } | null;

    return {
        hasTenantAccess: true,
        tenantLease: {
            id: lease.id,
            property_title: property?.title || "Bien immobilier",
            owner_name: owner?.company_name || owner?.full_name || "Propriétaire",
            has_valid_token: hasValidToken,
        },
    };
}

/**
 * Génère ou récupère le Magic Link pour l'accès locataire de l'owner
 *
 * Si un token valide existe, retourne l'URL.
 * Sinon, génère un nouveau token.
 */
export async function getOwnerTenantAccessLink(leaseId: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
}> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
        return { success: false, error: "Non authentifié" };
    }

    // Vérifier que le bail appartient bien à cet email
    const { data: lease } = await supabase
        .from('leases')
        .select('id, tenant_access_token, tenant_token_expires_at')
        .eq('id', leaseId)
        .eq('tenant_email', user.email.toLowerCase())
        .eq('status', 'active')
        .single();

    if (!lease) {
        return { success: false, error: "Bail introuvable ou non autorisé" };
    }

    // Vérifier si le token existant est valide
    const hasValidToken = !!(
        lease.tenant_access_token &&
        lease.tenant_token_expires_at &&
        new Date(lease.tenant_token_expires_at) > new Date()
    );

    if (hasValidToken) {
        // Note: On ne peut pas récupérer le token raw car on stocke le hash
        // Il faut en générer un nouveau
    }

    // Générer un nouveau token
    const { generateTenantAccessToken, getTenantMagicLinkUrl } = await import('@/lib/tenant-magic-link');
    const { trackServerEvent, EVENTS } = await import('@/lib/analytics');

    try {
        const rawToken = await generateTenantAccessToken(leaseId);
        const url = getTenantMagicLinkUrl(rawToken);

        // Track role switch analytics
        trackServerEvent(EVENTS.ROLE_SWITCHED, {
            from: "gestion",
            to: "locataire",
            user_id: user.id,
            is_owner_dual_role: true,
        });

        return { success: true, url };
    } catch (error) {
        console.error("[getOwnerTenantAccessLink] Error:", error);
        return { success: false, error: "Erreur lors de la génération du lien" };
    }
}

