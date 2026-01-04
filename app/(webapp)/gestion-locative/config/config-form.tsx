'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, PenTool, Building2, Save, Check, Phone, Mail, MapPin, Loader2, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBranding } from './actions';
import { toast } from 'sonner';

interface BrandingData {
    company_name?: string | null;
    company_address?: string | null;
    company_phone?: string | null;
    company_email?: string | null;
    company_ninea?: string | null;
    logo_url?: string | null;
    signature_url?: string | null;
}

interface ConfigFormProps {
    initialData: BrandingData | null;
}

export function ConfigForm({ initialData }: ConfigFormProps) {
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(initialData?.signature_url || null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [signatureMode, setSignatureMode] = useState<'upload' | 'draw'>('upload');

    // Canvas drawing state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const [formData, setFormData] = useState({
        company_name: initialData?.company_name || '',
        company_address: initialData?.company_address || '',
        company_phone: initialData?.company_phone || '',
        company_email: initialData?.company_email || '',
        company_ninea: initialData?.company_ninea || ''
    });

    // Initialize canvas
    useEffect(() => {
        if (signatureMode === 'draw' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * 2;
            canvas.height = rect.height * 2;
            ctx.scale(2, 2);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
    }, [signatureMode]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, rect.width, rect.height);
        setHasDrawn(false);
        setSignaturePreview(null);
    };

    const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
        const isLogo = type === 'logo';
        isLogo ? setUploadingLogo(true) : setUploadingSignature(true);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('type', type);

            const response = await fetch('/api/branding/upload', {
                method: 'POST',
                body: uploadFormData
            });

            const result = await response.json();

            if (result.success) {
                if (isLogo) {
                    setLogoPreview(result.url);
                } else {
                    setSignaturePreview(result.url);
                }
                toast.success(result.message || `${isLogo ? 'Logo' : 'Signature'} enregistré!`);
            } else {
                toast.error(result.error || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors de l\'upload du fichier');
        } finally {
            isLogo ? setUploadingLogo(false) : setUploadingSignature(false);
        }
    };

    const saveDrawnSignature = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setUploadingSignature(true);

        // Use toBlob instead of fetch(dataUrl) to avoid CSP violation
        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast.error('Erreur lors de la création de l\'image');
                setUploadingSignature(false);
                return;
            }

            try {
                const file = new File([blob], 'signature.png', { type: 'image/png' });

                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                uploadFormData.append('type', 'signature');

                const response = await fetch('/api/branding/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                const result = await response.json();
                console.log('API Response:', result);

                if (result.success) {
                    setSignaturePreview(result.url);
                    toast.success('Signature enregistrée!');
                } else {
                    console.error('Upload failed:', result);
                    toast.error(result.error || 'Erreur lors de l\'upload');
                }
            } catch (error) {
                console.error('Erreur upload:', error);
                toast.error('Erreur lors de l\'upload de la signature');
            } finally {
                setUploadingSignature(false);
            }
        }, 'image/png');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
            handleFileUpload(file, 'logo');
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSignaturePreview(reader.result as string);
            reader.readAsDataURL(file);
            handleFileUpload(file, 'signature');
        }
    };

    const handleSave = async () => {
        setSaving(true);

        const formDataObj = new FormData();
        if (formData.company_name) formDataObj.append('company_name', formData.company_name);
        if (formData.company_address) formDataObj.append('company_address', formData.company_address);
        if (formData.company_phone) formDataObj.append('company_phone', formData.company_phone);
        if (formData.company_email) formDataObj.append('company_email', formData.company_email);
        if (formData.company_ninea) formDataObj.append('company_ninea', formData.company_ninea);

        const result = await updateBranding(formDataObj);

        setSaving(false);
        if (result.success) {
            setSaved(true);
            toast.success('Configuration enregistrée!');
            setTimeout(() => setSaved(false), 3000);
        } else {
            toast.error(result.error || 'Erreur lors de la sauvegarde');
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-10">
            {/* Upload Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section Logo */}
                <section className="space-y-4 p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                            <Building2 className="w-5 h-5" /> Logo de l&apos;Agence
                        </div>
                        {uploadingLogo && (
                            <div className="flex items-center gap-2 text-xs text-blue-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Upload...
                            </div>
                        )}
                    </div>
                    <label className="block">
                        <div className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${logoPreview
                            ? 'border-blue-500/50 bg-blue-500/5'
                            : 'border-gray-700 bg-gray-900/20 hover:border-blue-500/50'
                            } ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="max-h-32 object-contain" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-600 mb-2" />
                                    <p className="text-xs text-gray-500 text-center px-4">
                                        Cliquez pour ajouter votre logo
                                    </p>
                                    <p className="text-[10px] text-gray-600 mt-1">PNG, JPG (max 2MB)</p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                        />
                    </label>
                    {logoPreview && !uploadingLogo && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Logo enregistré
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 text-xs hover:bg-red-500/10"
                                onClick={() => setLogoPreview(null)}
                            >
                                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                            </Button>
                        </div>
                    )}
                </section>

                {/* Section Signature - With Tabs */}
                <section className="space-y-4 p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-purple-400 font-bold">
                            <PenTool className="w-5 h-5" /> Signature Numérique
                        </div>
                        {uploadingSignature && (
                            <div className="flex items-center gap-2 text-xs text-purple-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Upload...
                            </div>
                        )}
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-800 rounded-xl">
                        <button
                            onClick={() => setSignatureMode('upload')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${signatureMode === 'upload'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Upload className="w-4 h-4" /> Importer
                        </button>
                        <button
                            onClick={() => setSignatureMode('draw')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${signatureMode === 'draw'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <PenTool className="w-4 h-4" /> Dessiner
                        </button>
                    </div>

                    {signatureMode === 'upload' ? (
                        /* Upload Mode */
                        <label className="block">
                            <div className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${signaturePreview
                                ? 'border-purple-500/50 bg-purple-500/5'
                                : 'border-gray-700 bg-gray-900/20 hover:border-purple-500/50'
                                } ${uploadingSignature ? 'opacity-50 pointer-events-none' : ''}`}>
                                {signaturePreview ? (
                                    <img src={signaturePreview} alt="Signature" className="max-h-32 object-contain" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-600 mb-2" />
                                        <p className="text-xs text-gray-500 text-center px-4">
                                            Importez votre signature scannée
                                        </p>
                                        <p className="text-[10px] text-gray-600 mt-1">PNG avec fond transparent recommandé</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleSignatureUpload}
                                disabled={uploadingSignature}
                            />
                        </label>
                    ) : (
                        /* Draw Mode */
                        <div className="space-y-2">
                            <div className="relative">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-40 bg-white rounded-2xl cursor-crosshair touch-none"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!hasDrawn && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-gray-400 text-sm">Signez ici avec la souris ou le doigt</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCanvas}
                                    className="flex-1 border-gray-700 text-gray-400"
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> Effacer
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={saveDrawnSignature}
                                    disabled={!hasDrawn || uploadingSignature}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {uploadingSignature ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                        <Check className="w-3 h-3 mr-1" />
                                    )}
                                    Valider
                                </Button>
                            </div>
                        </div>
                    )}

                    {signaturePreview && !uploadingSignature && signatureMode === 'upload' && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Signature enregistrée
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 text-xs hover:bg-red-500/10"
                                onClick={() => setSignaturePreview(null)}
                            >
                                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            {/* Informations Commerciales */}
            <section className="p-6 md:p-8 bg-gray-900/40 rounded-3xl border border-gray-800 space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    Informations de l&apos;émetteur
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Nom commercial / Raison sociale</label>
                        <Input
                            placeholder="ex: SCI Teranga Immo"
                            className="bg-gray-800/50 border-gray-700 h-12"
                            value={formData.company_name}
                            onChange={(e) => handleInputChange('company_name', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">NINEA (optionnel)</label>
                        <Input
                            placeholder="ex: 12345678 A 01"
                            className="bg-gray-800/50 border-gray-700 h-12"
                            value={formData.company_ninea}
                            onChange={(e) => handleInputChange('company_ninea', e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Adresse complète
                    </label>
                    <Input
                        placeholder="ex: Rue 10 x Avenue Cheikh Anta Diop, Dakar"
                        className="bg-gray-800/50 border-gray-700 h-12"
                        value={formData.company_address}
                        onChange={(e) => handleInputChange('company_address', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Téléphone
                        </label>
                        <Input
                            placeholder="ex: +221 77 123 45 67"
                            className="bg-gray-800/50 border-gray-700 h-12"
                            value={formData.company_phone}
                            onChange={(e) => handleInputChange('company_phone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email professionnel
                        </label>
                        <Input
                            type="email"
                            placeholder="ex: contact@monagence.sn"
                            className="bg-gray-800/50 border-gray-700 h-12"
                            value={formData.company_email}
                            onChange={(e) => handleInputChange('company_email', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Aperçu Document */}
            <section className="p-6 md:p-8 bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-3xl border border-gray-700 space-y-4">
                <h2 className="text-lg font-bold">Aperçu sur vos documents</h2>
                <div className="bg-white text-black rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                    Logo
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-sm">{formData.company_name || 'Votre nom commercial'}</p>
                                <p className="text-[10px] text-gray-500">
                                    {formData.company_address || 'Votre adresse'} | {formData.company_phone || 'Votre téléphone'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400">QUITTANCE DE LOYER</p>
                            <p className="text-sm font-bold text-green-600">PAYÉ ✓</p>
                        </div>
                    </div>
                    <div className="text-center py-4 text-gray-400 text-sm">
                        [Contenu du document...]
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        {signaturePreview ? (
                            <img src={signaturePreview} alt="Signature" className="h-12 object-contain" />
                        ) : (
                            <div className="w-24 h-12 border-b-2 border-gray-300 flex items-end justify-center text-[10px] text-gray-400 pb-1">
                                Signature
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Bouton Save */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || uploadingLogo || uploadingSignature}
                    className={`px-10 h-14 text-lg font-bold rounded-2xl transition-all ${saved
                        ? 'bg-green-600 hover:bg-green-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {saving ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enregistrement...</>
                    ) : saved ? (
                        <><Check className="w-5 h-5 mr-2" /> Configuration sauvegardée</>
                    ) : (
                        <><Save className="w-5 h-5 mr-2" /> Enregistrer ma configuration</>
                    )}
                </Button>
            </div>
        </div>
    );
}
