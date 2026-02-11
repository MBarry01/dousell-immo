"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, Target, Check, ArrowRight, ArrowLeft, Upload, PenTool, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitOnboarding } from "@/app/pro/start/actions";
import { createClient } from "@/utils/supabase/client";

type Step = "user" | "agency" | "goals" | "confirmation";

interface WizardData {
    // User Step
    fullName: string;
    email: string;
    phone: string;
    password: string;

    // Agency Step
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyNinea: string;
    companyEmail: string;
    logoUrl: string;
    signatureUrl: string;

    // Goals Step
    propertyTypes: string[];
    teamSize: string;
}

const STEPS = [
    { id: "user", label: "Vous", icon: User },
    { id: "agency", label: "Agence", icon: Building2 },
    { id: "goals", label: "Besoins", icon: Target },
    { id: "confirmation", label: "Fin", icon: Check },
];

export function WizardForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [direction, setDirection] = useState<number>(0);
    const [isPending, setIsPending] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
    const [data, setData] = useState<WizardData>({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        companyNinea: "",
        companyEmail: "",
        logoUrl: "",
        signatureUrl: "",
        propertyTypes: [],
        teamSize: "",
    });

    // Detecter si l'utilisateur est deja connecte et pre-remplir
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Verifier si l'utilisateur a déjà une équipe active
                // Si oui, on le redirige directement vers le dashboard gestion
                const { data: memberships } = await supabase
                    .from("team_members")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("status", "active")
                    .limit(1);

                if (memberships && memberships.length > 0) {
                    console.log("Onboarding: Utilisateur a déjà une équipe, redirection...");
                    router.push("/gestion");
                    return;
                }

                setIsLoggedIn(true);
                setLoggedInUserId(user.id);

                // Pre-remplir depuis le profil et les metadonnees
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name, phone")
                    .eq("id", user.id)
                    .single();

                setData(prev => ({
                    ...prev,
                    fullName: profile?.full_name || user.user_metadata?.full_name || prev.fullName,
                    email: user.email || prev.email,
                    phone: profile?.phone || user.user_metadata?.phone || prev.phone,
                }));
            }
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async () => {
        setIsPending(true);
        try {
            const result = await submitOnboarding(data, loggedInUserId);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.success) {
                toast.success(isLoggedIn ? "Espace de gestion activé !" : "Compte créé avec succès !");
                router.push("/gestion");
            }
        } catch (error) {
            toast.error("Une erreur inattendue est survenue.");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    };

    const skipToConfirmation = () => {
        setDirection(1);
        setCurrentStep(STEPS.length - 1); // Aller directement à la confirmation
    };

    const updateData = (field: keyof WizardData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            {/* Progress Bar */}
            <div className="mb-8 md:mb-12">
                <div className="flex items-center justify-between relative px-4">
                    {/* Background line */}
                    <div className="absolute left-4 right-4 top-5 h-0.5 bg-gray-700/50 rounded-full" />
                    {/* Active progress line */}
                    <div
                        className="absolute left-4 top-5 h-0.5 bg-gradient-to-r from-primary via-amber-400 to-amber-300 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(244,196,48,0.5)]"
                        style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 2rem)` }}
                    />
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index <= currentStep;
                        const isCurrent = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                                <div
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                                        ? "bg-primary border-primary text-black"
                                        : isActive
                                            ? "bg-gray-900 border-primary text-primary shadow-[0_0_15px_rgba(244,196,48,0.4)]"
                                            : "bg-gray-900 border-gray-700 text-gray-500"
                                        } ${isCurrent ? "scale-110" : ""}`}
                                >
                                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <span className={`text-xs md:text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-gray-500"
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900/50 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex-1 p-6 md:p-10 relative">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="h-full"
                        >
                            {currentStep === 0 && (
                                <StepUser data={data} updateData={updateData} isLoggedIn={isLoggedIn} />
                            )}
                            {currentStep === 1 && (
                                <StepAgency data={data} updateData={updateData} />
                            )}
                            {currentStep === 2 && (
                                <StepGoals data={data} updateData={updateData} />
                            )}
                            {currentStep === 3 && (
                                <StepConfirmation data={data} isLoggedIn={isLoggedIn} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-6 md:px-10 md:py-8 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-900/30 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 0 || isPending}
                        className={`text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white ${currentStep === 0 ? 'invisible' : ''}`}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                    </Button>

                    <div className="flex items-center gap-3">
                        {/* Bouton Passer - visible sur étapes Agency (1) et Goals (2) */}
                        {(currentStep === 1 || currentStep === 2) && (
                            <Button
                                variant="ghost"
                                onClick={skipToConfirmation}
                                className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                                Passer
                            </Button>
                        )}

                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-black rounded-xl px-8"
                                onClick={handleSubmit}
                                disabled={isPending}
                            >
                                {isPending ? "Création..." : "Commencer l'essai"} <Check className="w-5 h-5 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-black rounded-xl px-8"
                                onClick={nextStep}
                            >
                                Suivant <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepUser({ data, updateData, isLoggedIn }: { data: WizardData, updateData: any, isLoggedIn: boolean }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isLoggedIn ? "Vos informations" : "Créez votre compte administrateur"}
                </h2>
                <p className="text-slate-500 dark:text-gray-400">
                    {isLoggedIn
                        ? "Vérifiez vos informations avant de continuer. Vous pouvez les modifier si nécessaire."
                        : "Ces identifiants vous serviront à accéder à votre espace de gestion."}
                </p>
            </div>

            {isLoggedIn && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Vous êtes déjà connecté. Ces champs sont pré-remplis depuis votre compte.</span>
                </div>
            )}

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label>Nom complet du référent</Label>
                    <Input
                        placeholder="Ex: Babacar Diop"
                        value={data.fullName}
                        onChange={(e) => updateData("fullName", e.target.value)}
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Email professionnel</Label>
                        <Input
                            type="email"
                            placeholder="contact@monagence.sn"
                            value={data.email}
                            onChange={(e) => updateData("email", e.target.value)}
                            disabled={isLoggedIn}
                            className={`h-12 bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700 ${isLoggedIn ? "opacity-60 cursor-not-allowed" : ""}`}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Téléphone mobile</Label>
                        <PhoneInput
                            placeholder="77 000 00 00"
                            value={data.phone}
                            onChange={(val) => updateData("phone", val)}
                            className="bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700"
                            defaultCountry="SN"
                        />
                    </div>
                </div>

                {!isLoggedIn && (
                    <div className="space-y-2">
                        <Label>Mot de passe</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => updateData("password", e.target.value)}
                            className="h-12 bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function StepAgency({ data, updateData }: { data: WizardData; updateData: any }) {
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [signatureMode, setSignatureMode] = useState<"upload" | "draw">("upload");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Initialize canvas
    useEffect(() => {
        if (signatureMode === "draw" && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * 2;
            canvas.height = rect.height * 2;
            ctx.scale(2, 2);
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, rect.width, rect.height);
        }
    }, [signatureMode]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ("touches" in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, rect.width, rect.height);
        setHasDrawn(false);
        updateData("signatureUrl", "");
    };

    const saveDrawnSignature = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setUploadingSignature(true);
        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast.error("Erreur lors de la création de l'image");
                setUploadingSignature(false);
                return;
            }
            try {
                const file = new File([blob], "signature.png", { type: "image/png" });
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "signature");
                const response = await fetch("/api/branding/upload", { method: "POST", body: formData });
                const result = await response.json();
                if (result.success) {
                    updateData("signatureUrl", result.url);
                    toast.success("Signature enregistrée!");
                } else {
                    toast.error(result.error || "Erreur lors de l'upload");
                }
            } catch {
                toast.error("Erreur lors de l'upload de la signature");
            } finally {
                setUploadingSignature(false);
            }
        }, "image/png");
    };

    const handleFileUpload = async (file: File, type: "logo" | "signature") => {
        const isLogo = type === "logo";
        isLogo ? setUploadingLogo(true) : setUploadingSignature(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", type);
            const response = await fetch("/api/branding/upload", { method: "POST", body: formData });
            const result = await response.json();
            if (result.success) {
                updateData(isLogo ? "logoUrl" : "signatureUrl", result.url);
                toast.success(`${isLogo ? "Logo" : "Signature"} enregistré!`);
            } else {
                toast.error(result.error || "Erreur lors de l'upload");
            }
        } catch {
            toast.error("Erreur lors de l'upload du fichier");
        } finally {
            isLogo ? setUploadingLogo(false) : setUploadingSignature(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurez votre Agence</h2>
                <p className="text-slate-500 dark:text-gray-400">Ces informations apparaîtront sur vos contrats et quittances.</p>
            </div>

            {/* Info de base */}
            <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nom de l&apos;agence</Label>
                        <Input placeholder="Ex: Immobilière du Sud" value={data.companyName} onChange={(e) => updateData("companyName", e.target.value)} className="h-11 bg-slate-50 dark:bg-gray-800" />
                    </div>
                    <div className="space-y-2">
                        <Label>Adresse du siège</Label>
                        <Input placeholder="Ex: 123 Rue de la République" value={data.companyAddress} onChange={(e) => updateData("companyAddress", e.target.value)} className="h-11 bg-slate-50 dark:bg-gray-800" />
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Téléphone de l&apos;agence</Label>
                        <PhoneInput placeholder="33 800 00 00" value={data.companyPhone} onChange={(val) => updateData("companyPhone", val)} className="bg-slate-50 dark:bg-gray-800" defaultCountry="SN" />
                    </div>
                    <div className="space-y-2">
                        <Label>NINEA (optionnel)</Label>
                        <Input placeholder="Ex: 0000000 0 00" value={data.companyNinea} onChange={(e) => updateData("companyNinea", e.target.value)} className="h-11 bg-slate-50 dark:bg-gray-800" />
                    </div>
                </div>
            </div>

            {/* Logo & Signature - Optionnel */}
            <div className="border-t border-slate-200 dark:border-gray-700 pt-6">
                <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                    <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary px-2 py-0.5 rounded-full">Optionnel</span>
                    Ajoutez votre logo et signature pour personnaliser vos documents
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Logo Upload */}
                    <div className="p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-primary font-medium text-sm mb-3">
                            <Building2 className="w-4 h-4" /> Logo de l&apos;Agence
                        </div>
                        <label className="block cursor-pointer">
                            <div className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${data.logoUrl ? "border-primary/50 bg-primary/5" : "border-slate-300 dark:border-gray-600 hover:border-primary/50"} ${uploadingLogo ? "opacity-50" : ""}`}>
                                {data.logoUrl ? (
                                    <img src={data.logoUrl} alt="Logo" className="max-h-20 object-contain" />
                                ) : uploadingLogo ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-gray-500 mb-1" />
                                        <p className="text-xs text-gray-500">Cliquez pour ajouter</p>
                                    </>
                                )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo")} disabled={uploadingLogo} />
                        </label>
                        {data.logoUrl && (
                            <Button variant="ghost" size="sm" className="mt-2 text-red-400 text-xs" onClick={() => updateData("logoUrl", "")}>
                                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                            </Button>
                        )}
                    </div>

                    {/* Signature Upload */}
                    <div className="p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-purple-500 font-medium text-sm mb-3">
                            <PenTool className="w-4 h-4" /> Signature Numérique
                        </div>
                        <div className="flex gap-1 p-0.5 bg-slate-200 dark:bg-gray-700 rounded-lg mb-3">
                            <button onClick={() => setSignatureMode("upload")} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${signatureMode === "upload" ? "bg-purple-600 text-white" : "text-gray-500"}`}>
                                <Upload className="w-3 h-3 inline mr-1" /> Importer
                            </button>
                            <button onClick={() => setSignatureMode("draw")} className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${signatureMode === "draw" ? "bg-purple-600 text-white" : "text-gray-500"}`}>
                                <PenTool className="w-3 h-3 inline mr-1" /> Dessiner
                            </button>
                        </div>
                        {signatureMode === "upload" ? (
                            <label className="block cursor-pointer">
                                <div className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${data.signatureUrl ? "border-purple-500/50 bg-purple-500/5" : "border-slate-300 dark:border-gray-600 hover:border-purple-500/50"}`}>
                                    {data.signatureUrl ? (
                                        <img src={data.signatureUrl} alt="Signature" className="max-h-16 object-contain" />
                                    ) : uploadingSignature ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-gray-500 mb-1" />
                                            <p className="text-xs text-gray-500">Importez votre signature</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "signature")} disabled={uploadingSignature} />
                            </label>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <canvas ref={canvasRef} className="w-full h-24 bg-white border rounded-xl cursor-crosshair touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                                    {!hasDrawn && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-gray-400 text-xs">Signez ici</p></div>}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={clearCanvas} className="flex-1 text-xs h-8">Effacer</Button>
                                    <Button size="sm" onClick={saveDrawnSignature} disabled={!hasDrawn || uploadingSignature} className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs h-8">
                                        {uploadingSignature ? <Loader2 className="w-3 h-3 animate-spin" /> : "Valider"}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {data.signatureUrl && signatureMode === "upload" && (
                            <Button variant="ghost" size="sm" className="mt-2 text-red-400 text-xs" onClick={() => updateData("signatureUrl", "")}>
                                <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Aperçu Document */}
            {(data.logoUrl || data.signatureUrl || data.companyName) && (
                <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800/60 dark:to-gray-700/40 rounded-2xl">
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Aperçu sur vos documents</p>
                    <div className="bg-white text-black rounded-xl p-4 text-sm">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                {data.logoUrl ? <img src={data.logoUrl} alt="Logo" className="h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[8px] text-gray-400">Logo</div>}
                                <div>
                                    <p className="font-bold text-xs">{data.companyName || "Votre agence"}</p>
                                    <p className="text-[9px] text-gray-500">{data.companyAddress || "Adresse"} | {data.companyPhone || "Téléphone"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-gray-400">QUITTANCE DE LOYER</p>
                                <p className="text-xs font-bold text-green-600">PAYÉ ✓</p>
                            </div>
                        </div>
                        <div className="text-center py-2 text-gray-400 text-xs">[Contenu du document...]</div>
                        <div className="flex justify-end pt-3 border-t border-gray-200">
                            {data.signatureUrl ? <img src={data.signatureUrl} alt="Signature" className="h-10 object-contain" /> : <div className="w-16 h-10 border-b-2 border-gray-300 flex items-end justify-center text-[8px] text-gray-400 pb-1">Signature</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function StepGoals({ data, updateData }: { data: WizardData, updateData: any }) {
    const teamSizes = [
        { value: "solo", label: "Solo", description: "Je travaille seul(e)" },
        { value: "2-5", label: "2-5 personnes", description: "Petite équipe" },
        { value: "5+", label: "5+ personnes", description: "Grande agence" }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Votre Équipe</h2>
                <p className="text-slate-500 dark:text-gray-400">Combien de personnes travailleront sur ce compte ?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teamSizes.map((size) => (
                    <div
                        key={size.value}
                        onClick={() => updateData("teamSize", size.value)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-center h-32 ${data.teamSize === size.value
                            ? "border-primary bg-primary/10 dark:bg-primary/20"
                            : "border-slate-200 dark:border-gray-800 hover:border-primary/50"
                            }`}
                    >
                        <span className="font-bold text-slate-900 dark:text-white text-lg">{size.label}</span>
                        <span className="text-xs text-slate-500 dark:text-gray-400">{size.description}</span>
                        {data.teamSize === size.value && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-black">
                                <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepConfirmation({ data, isLoggedIn }: { data: WizardData, isLoggedIn: boolean }) {
    return (
        <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-6">
                <Check className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Tout est prêt !</h2>
            <p className="text-lg text-slate-600 dark:text-gray-300 max-w-lg mx-auto">
                C&apos;est parti, {data.fullName.split(' ')[0]} ! <br />
                En cliquant sur &quot;Commencer&quot;, nous allons créer votre espace pour <strong>{data.companyName || "votre agence"}</strong>.
            </p>

            <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl text-left max-w-sm mx-auto border border-slate-100 dark:border-gray-800">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Email compte</span>
                        <span className="font-medium">{data.email}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Formule</span>
                        <span className="font-medium text-primary">Essai Gratuit 14 jours</span>
                    </div>
                </div>
            </div>
            {!isLoggedIn && (
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-4">
                    En créant ce compte, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité.
                </p>
            )}
        </div>
    );
}
