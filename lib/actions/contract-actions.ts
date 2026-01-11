'use server';

/**
 * Server Actions pour la génération de contrats de bail
 * Conforme aux règles Doussel Immo (CLAUDE.md)
 */

import { createClient as createServerClient } from '@/utils/supabase/server';
// import { getCurrentUser } from '@/lib/auth'; // Deprecated in Server Actions
import { generateLeasePDF, uploadPDFToStorage } from '@/lib/pdf-generator';
import { ContractData } from '@/lib/contract-template';
import { ContractCustomTexts } from '@/lib/contract-defaults';
import { z, ZodError } from 'zod'; // Import ZodError
import { revalidatePath } from 'next/cache';
import { differenceInMonths, addDays } from 'date-fns';

// Schéma de validation Zod pour la génération de contrat
const GenerateContractSchema = z.object({
  leaseId: z.string().uuid('ID de bail invalide'),
  includeWatermark: z.boolean().optional(),
  watermarkText: z.string().optional(),
  customTexts: z.any().optional(),
  preview: z.boolean().optional(),
});

type GenerateContractInput = z.infer<typeof GenerateContractSchema>;

interface GenerateContractResult {
  success: boolean;
  contractUrl?: string;
  pdfBase64?: string;
  error?: string;
}

/**
 * Génère un contrat de bail PDF à partir d'un lease ID
 */
export async function generateLeaseContract(
  input: GenerateContractInput
): Promise<GenerateContractResult> {
  try {
    // 1. Validation des données
    const validated = GenerateContractSchema.parse(input);
    const { leaseId, includeWatermark = false, watermarkText = 'BROUILLON', customTexts = {}, preview = false } = validated;

    // 2. Vérification de l'utilisateur
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // 3. Récupérer les données du bail et profil propriétaire
    // const supabase = await createServerClient(); // Déjà créé plus haut

    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id,
        owner_id,
        property_id,
        tenant_name,
        tenant_email,
        tenant_phone,
        monthly_amount,
        start_date,
        end_date,
        billing_day,
        property_address,
        properties (
          id,
          title,
          location,
          description,
          property_type
        )
      `)
      .eq('id', leaseId)
      .single();

    if (leaseError || !lease) {
      console.error("Erreur récupération bail:", leaseError);
      return {
        success: false,
        error: leaseError ? `Erreur technique: ${leaseError.message}` : 'Bail introuvable (ID inconnu)'
      };
    }

    // 4. Vérifier que l'utilisateur est bien le propriétaire
    if (lease.owner_id !== user.id) {
      return { success: false, error: 'Non autorisé: vous n\'êtes pas le propriétaire de ce bail' };
    }

    // 5. Récupérer les informations du propriétaire
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone, company_name, company_address, company_phone, company_email, company_ninea, logo_url, signature_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Erreur récupération profil:", profileError);
      return {
        success: false,
        error: profileError ? `Erreur technique profil: ${profileError.message}` : 'Profil propriétaire introuvable'
      };
    }

    // Extraction nom/prénom depuis full_name
    const fullName = profile.full_name || '';
    const firstName = fullName.split(' ')[0] || '';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';

    // 6. Mapper les données vers le format ContractData
    const contractData: ContractData = {
      landlord: {
        firstName: firstName,
        lastName: lastName,
        address: profile.company_address || 'Adresse non spécifiée',
        phone: profile.company_phone || profile.phone || '', // Priorité tel pro
        email: profile.company_email || user.email || '', // Priorité email pro
        companyName: profile.company_name || undefined,
        ninea: profile.company_ninea || undefined,
      },
      tenant: {
        firstName: lease.tenant_name?.split(' ')[0] || 'Prénom',
        lastName: lease.tenant_name?.split(' ').slice(1).join(' ') || 'Nom',
        phone: lease.tenant_phone || '',
        email: lease.tenant_email || undefined,
      },
      property: {
        address: lease.property_address || (lease.properties as any)?.location?.address || (lease.properties as any)?.location?.city || '',
        description: (lease.properties as any)?.description || (lease.properties as any)?.title || 'Non spécifié',
        propertyType: (lease.properties as any)?.property_type as any || undefined,
      },
      lease: {
        monthlyRent: Number(lease.monthly_amount),
        securityDeposit: Number(lease.monthly_amount) * 2, // Par défaut 2 mois (max légal)
        depositMonths: 2,
        startDate: new Date(lease.start_date),
        duration: (lease.end_date && lease.start_date)
          ? Math.max(1, differenceInMonths(addDays(new Date(lease.end_date), 1), new Date(lease.start_date)))
          : 12, // Défaut 12 mois si pas de dates valides
        billingDay: lease.billing_day || 5,
      },
      signatures: {
        landlordSignatureUrl: profile.signature_url || undefined,
        signatureDate: new Date(),
        signatureCity: 'Dakar', // À rendre configurable
      },
    };

    // 7. Générer le PDF
    const pdfResult = await generateLeasePDF(contractData, customTexts, {
      includeWatermark,
      watermarkText: includeWatermark ? watermarkText : undefined,
      logoUrl: profile.logo_url || undefined,
    });

    if (!pdfResult.success || !pdfResult.pdfBytes) {
      return { success: false, error: pdfResult.error || 'Erreur génération PDF' };
    }

    // SI MODE PREVIEW: Retourner le base64 sans uploader
    if (preview) {
      const base64 = Buffer.from(pdfResult.pdfBytes).toString('base64');
      return {
        success: true,
        pdfBase64: base64
      };
    }

    // 8. Upload vers Supabase Storage
    // IMPORTANT: Le chemin DOIT commencer par user.id pour passer la RLS
    const filename = `${user.id}/contract-${leaseId}.pdf`;
    const uploadResult = await uploadPDFToStorage(pdfResult.pdfBytes, filename, supabase);

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || 'Erreur upload PDF' };
    }

    // 9. Mettre à jour le lease avec l'URL du contrat
    const { error: updateError } = await supabase
      .from('leases')
      .update({ lease_pdf_url: uploadResult.url })
      .eq('id', leaseId);

    if (updateError) {
      console.error('Erreur mise à jour lease:', updateError);
      // On continue quand même, le PDF est généré
    }

    // 9.5 NOUVEAU: Enregistrer dans user_documents pour la GED
    // Tentative d'insertion avec logs détaillés
    // 9.5 NOUVEAU: Enregistrer dans user_documents pour la GED
    // Tentative d'insertion avec logs détaillés
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Contrat_Bail_${lease.tenant_name || 'Locataire'}_${timestamp}.pdf`;
    const filePath = filename; // Chemin dans Storage (user.id/contract-leaseId.pdf - inchangé pour le storage mais le nom fichier DB change)
    // NOTE: filePath dans DB devrait matcher le storage path si possible, mais ici on garde le storage path du point 8

    // Pour éviter confusion: le file_path DB est celui utilisé pour le download.
    // Le point 8 utilise `filename` (user.id/contract-leaseId.pdf).
    // Si on veut permettre plusieurs versions, il faudrait changer le storage path aussi.
    // Mais ici on veut juste que la DB accepte l'insertion.
    // LE PROBLEME: file_path est unique ?
    // Check migration: ADD CONSTRAINT user_documents_file_path_key UNIQUE (file_path);
    // Donc si on garde le meme file_path (contract-leaseId.pdf), on ne peut pas insérer une ligne duplicate.

    // SOLUTION: On ne change PAS le chemin storage (on écrase le fichier PDF), 
    // MAIS on ne peut pas insérer une NOUVELLE ligne si le file_path existe déjà.

    // On doit faire un UPSERT au lieu de INSERT si le fichier existe déjà.

    const pdfBuffer = pdfResult.pdfBytes;

    const docData = {
      user_id: user.id,
      file_name: fileName,
      file_path: filePath,
      file_type: 'bail',
      mime_type: 'application/pdf',
      file_size: pdfBuffer.length,
      category: 'lease_contract',
      entity_type: 'lease',
      entity_id: lease.id,
      property_id: lease.property_id,  // CRITICAL: Required for GED property grouping
      description: `Contrat de bail - ${lease.tenant_name}`,
      source: 'generated', // Important: distinguish from manual uploads
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lease_id: lease.id
    };

    console.log('📄 Tentative upsert user_documents:', JSON.stringify(docData, null, 2));

    const { error: docError } = await supabase
      .from('user_documents')
      .upsert(docData, { onConflict: 'file_path' }); // Utiliser Upsert sur file_path

    if (docError) {
      console.error('❌ Erreur insertion user_documents:', docError);
      // Log to file for easier access
      try {
        const fs = require('fs');
        const logMessage = `[${new Date().toISOString()}] ERROR: ${JSON.stringify(docError)}\nDATA: ${JSON.stringify(docData)}\n\n`;
        fs.appendFileSync('debug-log.txt', logMessage);
      } catch (e) {
        console.error('Failed to write to debug log', e);
      }
    } else {
      console.log('✅ Contrat enregistré dans la GED');
      try {
        const fs = require('fs');
        const logMessage = `[${new Date().toISOString()}] SUCCESS: Contract saved to user_documents\n`;
        fs.appendFileSync('debug-log.txt', logMessage);
      } catch (e) { }
    }

    // 10. Revalidation
    revalidatePath('/compte/(gestion)/locataires');
    revalidatePath(`/compte/(gestion)/locataires/${leaseId}`);

    return {
      success: true,
      contractUrl: uploadResult.url,
    };

  } catch (error) {
    console.error('Erreur generateLeaseContract:', error);

    if (error instanceof ZodError) {
      return {
        success: false,
        error: `Validation échouée: ${(error as any).issues.map((e: any) => e.message).join(', ')}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Télécharge le contrat existant d'un bail
 */
export async function downloadLeaseContract(leaseId: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // 1. Vérification de l'utilisateur
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // 2. Récupérer le bail
    // const supabase = await createServerClient(); // Déjà créé
    const { data: lease, error } = await supabase
      .from('leases')
      .select('id, owner_id, lease_pdf_url')
      .eq('id', leaseId)
      .single();

    if (error || !lease) {
      return { success: false, error: 'Bail introuvable' };
    }

    // 3. Vérifier les permissions
    if (lease.owner_id !== user.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // 4. Vérifier qu'un contrat existe
    if (!lease.lease_pdf_url) {
      return { success: false, error: 'Aucun contrat généré pour ce bail' };
    }

    // Extraction du chemin du fichier depuis l'URL ou reconstruction
    const filePath = `${user.id}/contract-${leaseId}.pdf`;

    // Générer une URL signée temporaire (valide 60 secondes)
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('lease-contracts')
      .createSignedUrl(filePath, 60);

    if (signedError || !signedData) {
      console.error('Erreur signed URL:', signedError);
      return { success: false, error: 'Erreur lors de la génération du lien sécurisé' };
    }

    return {
      success: true,
      url: signedData.signedUrl,
    };

  } catch (error) {
    console.error('Erreur downloadLeaseContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère les données d'un bail pour prévisualisation avant génération
 */
export async function getLeaseDataForContract(leaseId: string): Promise<{
  success: boolean;
  data?: ContractData;
  error?: string;
}> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // const supabase = await createServerClient(); // Déjà créé

    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .select(`
        id,
        owner_id,
        tenant_name,
        tenant_email,
        tenant_phone,
        monthly_amount,
        start_date,
        end_date,
        billing_day,
        property_address,
        properties (
          title,
          location,
          description,
          property_type
        )
      `)
      .eq('id', leaseId)
      .single();

    if (leaseError || !lease || lease.owner_id !== user.id) {
      return { success: false, error: 'Bail introuvable ou non autorisé' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone, company_name, company_address, company_phone, company_email, company_ninea, logo_url, signature_url')
      .eq('id', user.id)
      .single();

    // Note: si erreur profil, on continue peut-être avec defaults? Pour l'instant on garde la logique stricte mais avec message clair.
    if (profileError || !profile) {
      // On peut retourner success:false ou juste des données vides pour le landlord
      console.error("Erreur warning profil:", profileError);
    }

    const fullName = profile?.full_name || '';
    const firstName = fullName.split(' ')[0] || '';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';

    const contractData: ContractData = {
      landlord: {
        firstName: firstName,
        lastName: lastName,
        address: profile?.company_address || 'Adresse non spécifiée',
        phone: profile?.company_phone || profile?.phone || '',
        email: profile?.company_email || user.email || '',
        companyName: profile?.company_name || undefined,
        ninea: profile?.company_ninea || undefined,
      },
      tenant: {
        firstName: lease.tenant_name?.split(' ')[0] || '',
        lastName: lease.tenant_name?.split(' ').slice(1).join(' ') || '',
        phone: lease.tenant_phone || '',
        email: lease.tenant_email || undefined,
      },
      property: {
        address: lease.property_address || (lease.properties as any)?.location?.address || (lease.properties as any)?.location || '',
        description: (lease.properties as any)?.description || (Array.isArray(lease.properties) ? lease.properties[0]?.description : '') || '',
        propertyType: (lease.properties as any)?.property_type || (Array.isArray(lease.properties) ? lease.properties[0]?.property_type : undefined) as any,
      },
      lease: {
        monthlyRent: Number(lease.monthly_amount),
        securityDeposit: Number(lease.monthly_amount) * 2,
        depositMonths: 2,
        startDate: new Date(lease.start_date),
        duration: 12,
        billingDay: lease.billing_day || 5,
      },
      signatures: {
        signatureDate: new Date(),
        signatureCity: 'Dakar',
      },
    };

    return {
      success: true,
      data: contractData,
    };

  } catch (error) {
    console.error('Erreur getLeaseDataForContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
