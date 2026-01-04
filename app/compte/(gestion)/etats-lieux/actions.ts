'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_ROOMS, getRoomsForPropertyType, type Room, type MeterReadings, type PropertyType } from './types';

/**
 * Get all inventory reports for the current owner
 */
export async function getInventoryReports() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé', data: [] };
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
        .eq('owner_id', user.id)
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
 * Get a single inventory report by ID
 */
export async function getInventoryReportById(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    const { data, error } = await supabase
        .from('inventory_reports')
        .select(`
            *,
            leases (
                tenant_name,
                tenant_email,
                property_address,
                start_date,
                end_date
            )
        `)
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching inventory report:', error);
        return { error: error.message };
    }

    return {
        data: {
            ...data,
            lease: Array.isArray(data.leases) ? data.leases[0] : data.leases
        }
    };
}

/**
 * Create a new inventory report
 */
export async function createInventoryReport(data: {
    leaseId: string;
    type: 'entry' | 'exit';
    propertyType?: PropertyType;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Verify lease belongs to user
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id')
        .eq('id', data.leaseId)
        .eq('owner_id', user.id)
        .single();

    if (leaseError || !lease) {
        return { error: 'Bail non trouvé' };
    }

    // Use intelligent template if property type is provided, otherwise fallback to default (F2)
    const initialRooms = data.propertyType
        ? getRoomsForPropertyType(data.propertyType)
        : DEFAULT_ROOMS;

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

    revalidatePath('/compte/etats-lieux');
    return { data: report };
}

/**
 * Update an inventory report (rooms, meters, comments)
 */
export async function updateInventoryReport(id: string, updates: {
    rooms?: Room[];
    meter_readings?: MeterReadings;
    general_comments?: string;
    status?: 'draft' | 'completed';
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    const { error } = await supabase
        .from('inventory_reports')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        console.error('Error updating inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/compte/etats-lieux');
    revalidatePath(`/compte/etats-lieux/${id}`);
    return { success: true };
}

/**
 * Sign the inventory report
 */
export async function signInventoryReport(id: string, signatures: {
    owner_signature?: string;
    tenant_signature?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
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
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        console.error('Error signing inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/compte/etats-lieux');
    revalidatePath(`/compte/etats-lieux/${id}`);
    return { success: true };
}

/**
 * Delete an inventory report (only drafts)
 */
export async function deleteInventoryReport(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    // Only allow deleting drafts
    const { data: report } = await supabase
        .from('inventory_reports')
        .select('status')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

    if (!report) {
        return { error: 'Rapport non trouvé' };
    }

    if (report.status === 'signed') {
        return { error: 'Impossible de supprimer un rapport signé' };
    }

    const { error } = await supabase
        .from('inventory_reports')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

    if (error) {
        console.error('Error deleting inventory report:', error);
        return { error: error.message };
    }

    revalidatePath('/compte/etats-lieux');
    return { success: true };
}

/**
 * Get leases for dropdown selection
 */
export async function getLeasesForInventory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé', data: [] };
    }

    const { data, error } = await supabase
        .from('leases')
        .select('id, tenant_name, property_address, status')
        .eq('owner_id', user.id)
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Non autorisé' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${reportId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

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
