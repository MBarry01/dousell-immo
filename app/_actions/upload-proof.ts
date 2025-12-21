"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const uploadSchema = z.object({
    proof: z.instanceof(File, { message: "Le fichier est requis" }),
});

export type UploadProofState = {
    success?: boolean;
    message?: string;
    error?: string;
    timestamp?: number;
    data?: { url: string };
};

export async function uploadListingProof(formData: FormData): Promise<UploadProofState> {
    try {
        const file = formData.get("proof");

        // Validation Zod
        const validatedFields = uploadSchema.safeParse({
            proof: file,
        });

        if (!validatedFields.success) {
            return {
                success: false,
                error: validatedFields.error.flatten().fieldErrors.proof?.[0] || "Fichier invalide",
            };
        }

        const validFile = validatedFields.data.proof;

        // Générer un nom de fichier unique et sécurisé
        const fileExt = validFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        // Organisation par année/mois pour éviter un dossier géant
        const date = new Date();
        const filePath = `${date.getFullYear()}/${date.getMonth() + 1}/${fileName}`;

        const supabase = await createClient();

        // Upload dans le bucket "certifications"
        const { error: uploadError } = await supabase.storage
            .from('certifications')
            .upload(filePath, validFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase Storage Error:", uploadError);
            throw new Error("Échec de l'upload vers le cloud");
        }

        // On retourne le chemin du fichier (filePath) qui sera stocké en base
        return {
            success: true,
            data: { url: filePath },
            message: "Document sécurisé et archivé.",
            timestamp: Date.now(),
        };
    } catch (error) {
        console.error("Upload error:", error);
        return {
            success: false,
            error: "Une erreur technique est survenue lors de l'envoi.",
        };
    }
}
