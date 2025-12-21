"use server";

import { z } from "zod";

const uploadSchema = z.object({
    proof: z.instanceof(File, { message: "Le fichier est requis" }),
});

export type UploadProofState = {
    success?: boolean;
    message?: string;
    error?: string;
    timestamp?: number;
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

        // SIMULATION (2 secondes)
        // TODO: Connecter ici le Webhook n8n pour analyse IA (OCR, Vérification nom/titre)
        // Ex: await fetch('https://n8n.doussel.com/webhook/verify-doc', { method: 'POST', body: formData })
        await new Promise((resolve) => setTimeout(resolve, 2000));

        return {
            success: true,
            message: "Document sécurisé et en cours d'analyse.",
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
