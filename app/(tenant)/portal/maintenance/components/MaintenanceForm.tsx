'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { createMaintenanceRequest } from '../actions';

const formSchema = z.object({
    category: z.string().min(1, 'Veuillez sélectionner une catégorie'),
    description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
    photos: z.custom<FileList>()
        .refine((files) => files?.length > 0, 'Au moins une photo est obligatoire')
        .refine((files) => files?.length <= 5, 'Maximum 5 photos autorisées')
});

type FormValues = z.infer<typeof formSchema>;

export function MaintenanceForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: '',
            description: ''
        }
    });

    const photos = watch('photos');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setValue('photos', files, { shouldValidate: true });

            // Generate previews
            const newPreviews: string[] = [];
            Array.from(files).forEach(file => {
                newPreviews.push(URL.createObjectURL(file));
            });
            setImagePreviews(newPreviews);
        }
    };

    const uploadPhotos = async (files: FileList): Promise<string[]> => {
        const supabase = createClient();
        const uploadedUrls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `maintenance/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

            // Utilisation du bucket 'properties' par défaut (à changer si un bucket 'maintenance' existe)
            const { error: uploadError } = await supabase.storage
                .from('properties')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error(`Erreur upload image ${i + 1}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('properties')
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl);
        }
        return uploadedUrls;
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            // 1. Upload images
            const photoUrls = await uploadPhotos(data.photos);

            // 2. Create Request
            const result = await createMaintenanceRequest({
                category: data.category,
                description: data.description,
                photoUrls
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Signalement envoyé avec succès !");
            router.push('/portal/maintenance');

        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue lors de l'envoi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-2">
                <Label>Type de problème</Label>
                <Select onValueChange={(val) => setValue('category', val, { shouldValidate: true })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="plomberie">Plomberie (Fuite, Canalisation...)</SelectItem>
                        <SelectItem value="electricite">Électricité (Panne, Prise...)</SelectItem>
                        <SelectItem value="maconnerie">Maçonnerie / Murs</SelectItem>
                        <SelectItem value="electromenager">Électroménager</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Description détaillée</Label>
                <Textarea
                    placeholder="Décrivez le problème, sa localisation et depuis quand..."
                    className="min-h-[120px]"
                    {...register('description')}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-4">
                <Label>Photos (Obligatoire)</Label>

                <div className="grid grid-cols-3 gap-3">
                    {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100">
                            <Image src={src} alt="Preview" fill className="object-cover" />
                        </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-500">Ajouter</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>

                {errors.photos && <p className="text-sm text-red-500">{errors.photos.message as string}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours...
                    </>
                ) : (
                    "Envoyer le signalement"
                )}
            </Button>

        </form>
    );
}
