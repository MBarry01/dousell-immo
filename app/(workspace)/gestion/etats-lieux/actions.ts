'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_ROOMS, getRoomsForPropertyType, type Room, type MeterReadings, type PropertyType } from './types';
import { getUserTeamContext } from "@/lib/team-context";
import { requireTeamPermission } from "@/lib/permissions";

/**
 * Get all inventory reports for the current team
 * Filters via the lease relationship since inventory_reports doesn't have team_id
 */
export async function getInventoryReports() {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé', data: [] };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé', data: [] };
    }

    // Get all lease IDs for this team first
    const { data: teamLeases, error: leasesError } = await supabase
        .from('leases')
        .select('id')
        .eq('team_id', teamId);

    if (leasesError) {
        console.error('Error fetching team leases:', leasesError);
        return { error: leasesError.message, data: [] };
    }

    const leaseIds = (teamLeases || []).map(l => l.id);

    if (leaseIds.length === 0) {
        return { data: [] };
    }

    const { data, error } = await supabase
        .from('inventory_reports')
        .select(`
            *,
            leases (
                tenant_name,
                property_address
            )
        `)
        .in('lease_id', leaseIds)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inventory reports:', error);
        return { error: error.message, data: [] };
    }

    // Transform the data to flatten the lease info
    const reports = (data || []).map(report => ({
        ...report,
        lease: Array.isArray(report.leases) ? report.leases[0] : report.leases
    }));

    return { data: reports };
}

/**
 * Get a single inventory report by ID (only if lease belongs to team)
 */
export async function getInventoryReportById(id: string) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // First get the report with its lease info
    const { data, error } = await supabase
        .from('inventory_reports')
        .select(`
            *,
            leases (
                id,
                team_id,
                tenant_name,
                tenant_email,
                property_address,
                start_date,
                end_date
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching inventory report:', error);
        return { error: error.message };
    }

    // Verify the lease belongs to the team
    const lease = Array.isArray(data.leases) ? data.leases[0] : data.leases;
    if (!lease || lease.team_id !== teamId) {
        return { error: 'Rapport non trouvé ou accès non autorisé' };
    }

    return {
        data: {
            ...data,
            lease
        }
    };
}

/**
 * Create a new inventory report with intelligent templating
 */
export async function createInventoryReport(data: {
    leaseId: string;
    type: 'entry' | 'exit';
    propertyType?: PropertyType;
    roomsCount?: number;
}) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    await requireTeamPermission('leases.edit'); // Permission for inventory reports linked to leases
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Verify lease belongs to team
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id')
        .eq('id', data.leaseId)
        .eq('team_id', teamId)
        .single();

    if (leaseError || !lease) {
        return { error: 'Bail non trouvé' };
    }

    // Use intelligent template if property type is provided, otherwise fallback to default
    const initialRooms = data.propertyType
        ? getRoomsForPropertyType(data.propertyType, data.roomsCount)
        : DEFAULT_ROOMS;

    // Note: We don't insert team_id as the column doesn't exist
    // The lease_id provides the team relationship
    const { data: report, error } = await supabase
        .from('inventory_reports')
        .insert({
            lease_id: data.leaseId,
            owner_id: user.id,
            type: data.type,
            status: 'draft',
            rooms: initialRooms,
            meter_readings: {}
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/gestion/etats-lieux');
    return { data: report };
}

/**
 * Helper: Verify report belongs to team via lease
 */
async function verifyReportOwnership(supabase: Awaited<ReturnType<typeof createClient>>, reportId: string, teamId: string) {
    const { data: report, error } = await supabase
        .from('inventory_reports')
        .select(`
            id,
            status,
            lease_id,
            leases!inner (
                team_id
            )
        `)
        .eq('id', reportId)
        .single();

    if (error || !report) {
        return { valid: false, error: 'Rapport non trouvé' };
    }

    const lease = Array.isArray(report.leases) ? report.leases[0] : report.leases;
    if (!lease || (lease as { team_id: string }).team_id !== teamId) {
        return { valid: false, error: 'Accès non autorisé' };
    }

    return { valid: true, report };
}

export async function updateInventoryReport(id: string, updates: {
    rooms?: Room[];
    meter_readings?: MeterReadings;
    general_comments?: string;
    status?: 'draft' | 'completed';
}) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Verify ownership via lease
    const ownership = await verifyReportOwnership(supabase, id, teamId);
    if (!ownership.valid) {
        return { error: ownership.error };
    }

    const { error } = await supabase
        .from('inventory_reports')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error updating inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/gestion/etats-lieux');
    revalidatePath(`/gestion/etats-lieux/${id}`);
    return { success: true };
}

/**
 * Sign the inventory report
 */
export async function signInventoryReport(id: string, signatures: {
    owner_signature?: string;
    tenant_signature?: string;
}) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Verify ownership via lease
    const ownership = await verifyReportOwnership(supabase, id, teamId);
    if (!ownership.valid) {
        return { error: ownership.error };
    }

    const updateData: Record<string, unknown> = { ...signatures };

    // If both signatures provided, mark as signed
    if (signatures.owner_signature && signatures.tenant_signature) {
        updateData.status = 'signed';
        updateData.signed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('inventory_reports')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error signing inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/gestion/etats-lieux');
    revalidatePath(`/gestion/etats-lieux/${id}`);
    return { success: true };
}

/**
 * Delete an inventory report (only drafts)
 */
export async function deleteInventoryReport(id: string) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Verify ownership via lease
    const ownership = await verifyReportOwnership(supabase, id, teamId);
    if (!ownership.valid) {
        return { error: ownership.error };
    }

    if (ownership.report?.status === 'signed') {
        return { error: 'Impossible de supprimer un rapport signé' };
    }

    const { error } = await supabase
        .from('inventory_reports')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/gestion/etats-lieux');
    return { success: true };
}

/**
 * Get leases for dropdown selection
 */
export async function getLeasesForInventory() {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé', data: [] };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé', data: [] };
    }

    const { data, error } = await supabase
        .from('leases')
        .select('id, tenant_name, property_address, status')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leases:', error);
        return { error: error.message, data: [] };
    }

    return { data: data || [] };
}

/**
 * Get owner's saved signature from profile for auto-population
 */
export async function getOwnerSignature() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('signature_url')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching owner signature:', error);
        return { error: error.message };
    }

    return { signature_url: data?.signature_url || null };
}

/**
 * Get owner's agency branding
 */
export async function getAgencyBranding() {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // TODO: Use team branding instead of owner profile branding
    const { data, error } = await supabase
        .from('profiles')
        .select('company_name, logo_url')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching agency branding:', error);
        return { error: error.message };
    }

    return {
        agency_name: data?.company_name || null,
        logo_url: data?.logo_url || null
    };
}

/**
 * Upload a photo for an inventory item
 */
export async function uploadInventoryPhoto(file: File, reportId: string) {
    const context = await getUserTeamContext();
    if (!context) return { error: 'Non autorisé' };
    const { teamId, user } = context;
    const supabase = await createClient();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    const originalExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
    const fileExt = originalExt && ['jpg', 'jpeg', 'png', 'webp'].includes(originalExt) ? originalExt : 'jpg';
    const fileName = `teams/${teamId}/inventory/${reportId}/${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('inventory')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading inventory photo:', uploadError);
        return { error: uploadError.message };
    }

    // Get signed URL for private access (valid 1 hour for editing session)
    // For long term PDF View, we might need a longer expiry or generate it on view
    const { data } = await supabase.storage
        .from('inventory')
        .createSignedUrl(fileName, 3600 * 24 * 365 * 10); // 10 years (effectively permanent for the PDF)

    // Note: For a real production app with high security requirements,
    // we would generate short-lived URLs on demand.
    // Here we generate a long-lived one for simplicity of the PDF generation.

    if (!data?.signedUrl) {
        return { error: 'Erreur lors de la récupération de l\'URL' };
    }

    return { url: data.signedUrl };
}
