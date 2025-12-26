import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'logo' ou 'signature'

        if (!file || !type) {
            return NextResponse.json({ success: false, error: 'Fichier ou type manquant' }, { status: 400 });
        }

        // Vérifier le type de fichier
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Type de fichier non autorisé' }, { status: 400 });
        }

        // Vérifier la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'Fichier trop volumineux (max 2MB)' }, { status: 400 });
        }

        // Générer le nom du fichier
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

        // Convertir le fichier en ArrayBuffer puis en Uint8Array
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload vers le bucket 'branding'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('branding')
            .upload(fileName, uint8Array, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Erreur upload:', uploadError);
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('branding')
            .getPublicUrl(fileName);

        // Mettre à jour le profil avec l'URL
        const updateField = type === 'logo' ? 'logo_url' : 'signature_url';
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ [updateField]: publicUrl })
            .eq('id', user.id);

        if (updateError) {
            console.error('Erreur mise à jour profil:', updateError);
            return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            message: `${type === 'logo' ? 'Logo' : 'Signature'} enregistré avec succès`
        });

    } catch (error) {
        console.error('Erreur API upload branding:', error);
        return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
    }
}
