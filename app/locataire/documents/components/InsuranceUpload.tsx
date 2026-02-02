'use client';

import { useState } from 'react';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadInsurance } from '../actions';

interface InsuranceUploadProps {
    leaseId: string;
    existingUrl?: string | null;
}

export function InsuranceUpload({ leaseId, existingUrl }: InsuranceUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    // Si un document existe déjà
    if (existingUrl) {
        return (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Attestation reçue
                <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-emerald-700 underline text-xs">
                    Voir
                </a>
            </div>
        );
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation taille (ex: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Le fichier est trop volumineux (Max 5MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('leaseId', leaseId);

        try {
            const result = await uploadInsurance(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Attestation envoyée avec succès !");
            }
        } catch (error) {
            toast.error("Erreur lors de l'envoi");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                id="insurance-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            <label htmlFor="insurance-upload">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 cursor-pointer"
                    asChild
                    disabled={isUploading}
                >
                    <span>
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        {isUploading ? "Envoi..." : "Ajouter"}
                    </span>
                </Button>
            </label>
        </div>
    );
}
