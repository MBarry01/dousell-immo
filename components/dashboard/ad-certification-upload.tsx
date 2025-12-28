"use client";

import { useState, useRef } from "react";
import { ShieldCheck, UploadCloud, Loader2, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadListingProof } from "@/app/_actions/upload-proof";

type AdCertificationUploadProps = {
    className?: string;
    onUploadSuccess?: (url: string) => void;
};

export function AdCertificationUpload({ className, onUploadSuccess }: AdCertificationUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await handleUpload(files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            await handleUpload(files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        // Vérification basique du type (PDF ou Image)
        if (!file.type.includes("pdf") && !file.type.includes("image")) {
            toast.error("Format non supporté", {
                description: "Veuillez uploader un PDF ou une image (JPG, PNG).",
            });
            return;
        }

        // Vérification taille (< 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Fichier trop volumineux", {
                description: "La taille maximale est de 5 Mo.",
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("proof", file);

        try {
            const result = await uploadListingProof(formData);

            if (result.success) {
                setSuccess(true);
                toast.success("Document reçu !", {
                    description: "Analyse en cours par notre système sécurisé.",
                });
                if (onUploadSuccess && result.data?.url) {
                    onUploadSuccess(result.data.url);
                }
            } else {
                toast.error("Erreur d'envoi", {
                    description: result.error || "Impossible d'envoyer le document.",
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erreur technique");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={cn("rounded-xl border border-white/10 bg-zinc-900 overflow-hidden", className)}>
            {/* Header */}
            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">
                        Certifiez votre annonce (Recommandé)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                        Les annonces vérifiées obtiennent le badge &quot;Confiance&quot; et 3x plus de contacts.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center text-center py-4"
                        >
                            <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h4 className="text-white font-medium">Document sécurisé</h4>
                            <p className="text-sm text-zinc-400 mt-1 max-w-[200px]">
                                Votre justificatif est en cours d&apos;analyse. Vous serez notifié sous 24h.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={cn(
                                    "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3",
                                    isDragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-white/10 hover:border-white/20 hover:bg-white/5",
                                    uploading && "opacity-50 pointer-events-none"
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {uploading ? (
                                    <>
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-sm text-zinc-400">Cryptage et envoi en cours...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                            <UploadCloud className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                Glissez votre Titre Foncier ou CNI ici
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                PDF ou JPG (Max 5 Mo)
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="mt-2 h-8 text-xs border-white/10 hover:bg-white/5 hover:text-white">
                                            Parcourir les fichiers
                                        </Button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer info message */}
                <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500 justify-center">
                    <FileText className="h-3 w-3" />
                    <span>Vos documents ne sont jamais rendus publics.</span>
                </div>
            </div>
        </div>
    );
}
