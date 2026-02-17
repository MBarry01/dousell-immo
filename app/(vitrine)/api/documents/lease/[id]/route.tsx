
import { NextRequest, NextResponse } from 'next/server';
import { generateLeasePDF } from '@/lib/pdf-generator';
import { createClient } from '@/utils/supabase/server';
import { ContractData } from '@/lib/contract-template';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const leaseId = id;

        // 1. Vérifier l'authentification (plus souple pour les nouveaux onglets)
        let { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const { data: { session } } = await supabase.auth.getSession();
            user = session?.user || null;
        }

        if (!user) {
            console.error("Auth failed for lease API: No user session found");
            return NextResponse.json({ error: 'Session expirée ou non trouvée. Veuillez vous reconnecter.' }, { status: 401 });
        }

        // 2. Récupérer les détails du bail et relations
        const { data: lease, error } = await supabase
            .from('leases')
            .select(`
                *,
                properties (
                    id,
                    title,
                    location,
                    description,
                    type,
                    floor,
                    building_name
                ),
                profiles:owner_id (
                    full_name,
                    email,
                    company_name,
                    company_address,
                    company_ninea,
                    birth_date,
                    birth_place
                )
            `)
            .eq('id', leaseId)
            .single();

        if (error || !lease) {
            console.error("Lease not found:", error);
            return NextResponse.json({ error: 'Bail introuvable' }, { status: 404 });
        }

        // Sécurité: vérifier que l'user est le propriétaire ou le locataire (futur)
        // Pour être large, on autorise l'owner du bail ou le locataire (si on avait l'auth locataire liée)
        // Ici on check surtout que c'est l'owner qui demande via /gestion
        if (lease.owner_id !== user.id) {
            console.error(`Access denied: Lease owner is ${lease.owner_id}, requesting user is ${user.id}`);
            return NextResponse.json({ error: 'Accès interdit: Ce bail ne vous appartient pas.' }, { status: 403 });
        }

        const owner = lease.profiles;
        const property = lease.properties;

        if (!owner || !property) {
            return NextResponse.json({ error: 'Données incomplètes (Propriétaire ou Bien)' }, { status: 400 });
        }

        // 3. Mapper vers ContractData
        const contractData: ContractData = {
            landlord: {
                firstName: owner.full_name?.split(' ')[0] || '',
                lastName: owner.full_name?.split(' ').slice(1).join(' ') || '',
                address: owner.company_address || 'Adresse non renseignée',
                phone: '', // Téléphone non stocké sur le profil
                email: owner.email,
                companyName: owner.company_name,
                ninea: owner.company_ninea,
                birthDate: owner.birth_date,
                birthPlace: owner.birth_place
            },
            tenant: {
                firstName: lease.tenant_name?.split(' ')[0] || '',
                lastName: lease.tenant_name?.split(' ').slice(1).join(' ') || '',
                phone: lease.tenant_phone || '',
                email: lease.tenant_email,
                // On n'a pas tout stocké (CNI, birth) dans leases simplifiée, on met des placeholders ou vide
                // Si stocké dans une table tenants séparée, il faudrait fetcher
                nationalId: '',
                address: property.location?.address // Souvent adresse du bien si déjà dedans
            },
            property: {
                address: property.location?.address || '',
                description: property.description || lease.property_address || '', // Fallback
                // Cast to specific ContractData property type, defaulting to 'appartement' if unknown or mismatched
                propertyType: (property.type as ContractData['property']['propertyType']) || 'appartement',
                floor: property.floor,
                buildingName: property.building_name
            },
            lease: {
                monthlyRent: lease.monthly_amount,
                securityDeposit: (lease.monthly_amount * (lease.deposit_months || 2)), // Estimation si pas stocké explicitement
                depositMonths: lease.deposit_months || 2,
                startDate: new Date(lease.start_date),
                duration: lease.duration || 12,
                billingDay: lease.billing_day || 5,
                charges: 0, // Pas géré explicitement
                paymentMethod: 'Virement / Mobile Money'
            },
            signatures: {
                signatureCity: 'Dakar',
                signatureDate: new Date(lease.created_at || new Date()),
                // TODO: Ajouter URLs signatures si stockées
            }
        };

        // 4. Générer le PDF
        const result = await generateLeasePDF(contractData);

        if (!result.success || !result.pdfBytes) {
            throw new Error(result.error || "Echec génération PDF");
        }

        // 5. Retourner le PDF
        return new NextResponse(result.pdfBytes as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Bail_${lease.tenant_name.replace(/\s+/g, '_')}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Erreur génération PDF bail:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du PDF' },
            { status: 500 }
        );
    }
}
