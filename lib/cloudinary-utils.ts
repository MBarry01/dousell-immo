import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export interface CloudinaryUploadResponse {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
    folder: string;
}

/**
 * Upload common image to Cloudinary
 */
export async function uploadToCloudinary(
    fileBase64: string,
    folder: string = 'general',
    tags: string[] = []
): Promise<{ url: string; publicId: string } | { error: string }> {
    try {
        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
            folder: `doussel/${folder}`,
            tags: tags,
            resource_type: 'auto',
        });

        return {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return { error: 'Failed to upload image to Cloudinary' };
    }
}

/**
 * Upload property image specific transformation
 */
export async function uploadPropertyImage(
    fileBase64: string,
    teamId: string
): Promise<{ url: string; publicId: string } | { error: string }> {
    return uploadToCloudinary(fileBase64, `teams/${teamId}/properties`, ['property']);
}

/**
 * Upload inspection image
 */
export async function uploadInventoryImage(
    fileBase64: string,
    teamId: string,
    reportId: string
): Promise<{ url: string; publicId: string } | { error: string }> {
    return uploadToCloudinary(fileBase64, `teams/${teamId}/inventory/${reportId}`, ['inventory']);
}

export default cloudinary;
