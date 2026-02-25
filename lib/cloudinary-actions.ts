"use server";
import { uploadToCloudinary, uploadPropertyImage, uploadInventoryImage } from './cloudinary-utils';
import { getUserTeamContext } from '@/lib/team-context';

export { uploadToCloudinary, uploadPropertyImage, uploadInventoryImage };

export async function uploadImageAction(
    fileBase64: string,
    folder: string = 'general',
    tags: string[] = []
) {
    return await uploadToCloudinary(fileBase64, folder, tags);
}

export async function uploadPropertyPhotoAction(
    fileBase64: string,
    teamId: string
) {
    // Optionnel: Vérifier les permissions ici via getUserTeamContext
    const context = await getUserTeamContext();
    if (!context || (context.teamId !== teamId && context.role !== 'owner' && context.role !== 'manager')) {
        return { error: 'Non autorisé' };
    }

    return await uploadPropertyImage(fileBase64, teamId);
}

export async function uploadInventoryPhotoAction(
    fileBase64: string,
    teamId: string,
    reportId: string
) {
    const context = await getUserTeamContext();
    if (!context || (context.teamId !== teamId && context.role !== 'owner' && context.role !== 'manager')) {
        return { error: 'Non autorisé' };
    }

    return await uploadInventoryImage(fileBase64, teamId, reportId);
}
