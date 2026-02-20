'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const CATEGORIES = [
    { value: 'plomberie', label: 'Plomberie', emoji: '🔧' },
    { value: 'electricite', label: 'Électricité', emoji: '⚡' },
    { value: 'maconnerie', label: 'Maçonnerie', emoji: '🧱' },
    { value: 'climatisation', label: 'Climatisation', emoji: '❄️' },
    { value: 'electromenager', label: 'Électroménager', emoji: '🔌' },
    { value: 'autre', label: 'Autre', emoji: '📋' },
];

export function MaintenanceForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: '',
            description: ''
        }
    });

    const handleCategorySelect = (value: string) => {
        setSelectedCategory(value);
        setValue('category', value, { shouldValidate: true });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setValue('photos', files, { shouldValidate: true });
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

        const imageCompressionModule = await import('browser-image-compression');
        const imageCompression = imageCompressionModule.default || imageCompressionModule;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                // Initialisation avec le fichier d'origine en cas de fallback nécessaire
                let fileToUpload: File | Blob = file;
                let thumbToUpload: File | Blob | null = null;
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                let finalExt = fileExt;

                try {
                    // Compression optimisée (WebP, 1600px max)
                    const mainOptions = {
                        maxSizeMB: 0.4,
                        maxWidthOrHeight: 1600,
                        useWebWorker: true,
                        initialQuality: 0.8,
                        fileType: 'image/webp'
                    };

                    const thumbOptions = {
                        maxSizeMB: 0.05,
                        maxWidthOrHeight: 400,
                        useWebWorker: true,
                        initialQuality: 0.6,
                        fileType: 'image/webp'
                    };

                    toast.loading(`Compression image ${i + 1}/${files.length}...`, { id: 'compressing' });

                    // Exécution séquentielle
                    fileToUpload = await imageCompression(file, mainOptions);
                    thumbToUpload = await imageCompression(file, thumbOptions);
                    finalExt = "webp";

                    toast.dismiss('compressing');
                } catch (compressionError) {
                    console.warn("Échec de la compression client, fallback sur le fichier original", compressionError);
                    toast.dismiss('compressing');
                }

                const baseName = `maintenance/${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const fileName = `${baseName}.${finalExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('properties')
                    .upload(fileName, fileToUpload);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw new Error(`Erreur upload image ${i + 1}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('properties')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);

                // Upload du thumbnail asynchrone (nom avec -thumb)
                if (thumbToUpload) {
                    const thumbName = `${baseName}-thumb.${finalExt}`;
                    await supabase.storage
                        .from('properties')
                        .upload(thumbName, thumbToUpload, { cacheControl: '31536000' });
                }

            } catch (err) {
                toast.dismiss('compressing');
                console.error("Erreur traitement photo:", err);
                throw new Error(`Erreur lors du traitement de l'image ${i + 1}`);
            }
        }
        return uploadedUrls;
    };

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const photoUrls = await uploadPhotos(data.photos);

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
            router.push('/locataire/maintenance');

        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue lors de l'envoi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
                <Label className="text-zinc-700 font-medium">Type de problème</Label>
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleCategorySelect(cat.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${selectedCategory === cat.value
                                ? 'bg-zinc-900 border-zinc-900 text-white'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                                }`}
                        >
                            <span className="text-xl block mb-1">{cat.emoji}</span>
                            <span className="text-xs font-medium">{cat.label}</span>
                        </button>
                    ))}
                </div>
                {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-3">
                <Label className="text-zinc-700 font-medium">Description détaillée</Label>
                <Textarea
                    placeholder="Décrivez le problème, sa localisation et depuis quand..."
                    className="min-h-[120px] bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-200 rounded-xl"
                    {...register('description')}
                />
                {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
            </div>

            {/* Photos */}
            <div className="space-y-3">
                <Label className="text-zinc-700 font-medium">Photos (Obligatoire)</Label>

                <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200">
                            <Image src={src} alt="Preview" fill className="object-cover" />
                        </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-colors">
                        <Camera className="w-6 h-6 text-zinc-400 mb-1" />
                        <span className="text-[10px] text-zinc-500 font-medium">Ajouter</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>

                {errors.photos && (
                    <p className="text-sm text-red-600">{errors.photos.message as string}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                    </>
                ) : (
                    "Envoyer le signalement"
                )}
            </Button>
        </form>
    );
}
