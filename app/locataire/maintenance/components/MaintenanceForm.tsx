'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Camera, ArrowLeft, Wrench } from 'lucide-react';
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Category Selection */}
            <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Type de problème
                </Label>
                <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleCategorySelect(cat.value)}
                            className={`p-4 rounded-2xl border text-center transition-all duration-300 group relative overflow-hidden ${selectedCategory === cat.value
                                ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-xl shadow-slate-900/20'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-white'
                                }`}
                        >
                            <span className="text-2xl block mb-2 group-hover:scale-125 transition-transform duration-300">{cat.emoji}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                            {selectedCategory === cat.value && (
                                <div className="absolute top-1 right-1">
                                    <div className="w-2 h-2 rounded-full bg-[#F4C430]"></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                {errors.category && (
                    <p className="text-xs font-black text-red-500 uppercase tracking-tight px-1">{errors.category.message}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Description détaillée
                </Label>
                <Textarea
                    placeholder="Décrivez le problème, sa localisation et depuis quand..."
                    className="min-h-[140px] bg-slate-50 border-slate-200 text-[#0F172A] placeholder:text-slate-400 focus:border-[#0F172A] focus:ring-slate-900/5 rounded-2xl p-4 font-medium transition-all"
                    {...register('description')}
                />
                {errors.description && (
                    <p className="text-xs font-black text-red-500 uppercase tracking-tight px-1">{errors.description.message}</p>
                )}
            </div>

            {/* Photos */}
            <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                    Photos (Obligatoire)
                </Label>

                <div className="grid grid-cols-4 gap-3">
                    {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group">
                            <Image src={src} alt="Preview" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-[#0F172A] hover:bg-white transition-all group">
                        <Camera className="w-7 h-7 text-slate-400 mb-1 group-hover:text-[#0F172A] group-hover:scale-110 transition-all duration-300" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#0F172A]">Ajouter</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>

                {errors.photos && (
                    <p className="text-xs font-black text-red-500 uppercase tracking-tight px-1">{errors.photos.message as string}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-sm bg-[#0F172A] hover:bg-[#1e293b] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 active-press transition-all"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Envoi en cours...
                    </>
                ) : (
                    "Envoyer le signalement"
                )}
            </Button>
        </form>
    );
}
