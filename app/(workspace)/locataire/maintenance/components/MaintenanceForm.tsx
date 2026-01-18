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

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `maintenance/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

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
            {/* Category Selection - Visual Grid */}
            <div className="space-y-2">
                <Label className="text-slate-300">Type de problème</Label>
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleCategorySelect(cat.value)}
                            className={`p-3 rounded-xl border text-center transition-all ${selectedCategory === cat.value
                                    ? 'bg-[#F4C430]/20 border-[#F4C430] text-white'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <span className="text-xl block mb-1">{cat.emoji}</span>
                            <span className="text-xs">{cat.label}</span>
                        </button>
                    ))}
                </div>
                {errors.category && <p className="text-sm text-red-400">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label className="text-slate-300">Description détaillée</Label>
                <Textarea
                    placeholder="Décrivez le problème, sa localisation et depuis quand..."
                    className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                    {...register('description')}
                />
                {errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}
            </div>

            {/* Photos */}
            <div className="space-y-3">
                <Label className="text-slate-300">Photos (Obligatoire)</Label>

                <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                            <Image src={src} alt="Preview" fill className="object-cover" />
                        </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/30 cursor-pointer hover:border-[#F4C430]/50 hover:bg-slate-800/50 transition-colors">
                        <Camera className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-[10px] text-slate-500">Ajouter</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>

                {errors.photos && <p className="text-sm text-red-400">{errors.photos.message as string}</p>}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base bg-[#F4C430] hover:bg-[#D4A420] text-black font-semibold"
            >
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
