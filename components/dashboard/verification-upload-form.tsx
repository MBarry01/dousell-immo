"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, X, FileText, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadVerificationDoc } from "@/app/compte/mes-biens/actions";

type VerificationUploadFormProps = {
  propertyId: string;
  variant?: "default" | "outline" | "ghost";
  currentStatus?: string;
  proofDocumentUrl?: string | null;
};

export function VerificationUploadForm({
  propertyId,
  variant = "outline",
  currentStatus,
  proofDocumentUrl,
}: VerificationUploadFormProps) {
  // Si déjà vérifié, ne rien afficher
  if (currentStatus === 'verified') {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté", {
        description: "Veuillez utiliser un fichier PDF, JPG ou PNG."
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux", {
        description: "La taille maximale est de 5Mo."
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("propertyId", propertyId);

    try {
      const result = await uploadVerificationDoc(formData);

      if (result.error) {
        toast.error("Erreur d'envoi", { description: result.error });
      } else {
        toast.success("Document envoyé !", {
          description: "Votre demande de certification est en cours d'examen."
        });
        setIsOpen(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur inconnue est survenue.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="h-8 border-[#F4C430]/50 text-[#F4C430] hover:bg-[#F4C430]/10 hover:text-[#F4C430]"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Certifier ce bien
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#F4C430]">
            <ShieldCheck className="h-5 w-5" />
            Certification du bien
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Téléchargez votre titre de propriété ou tout document officiel prouvant que vous êtes le propriétaire.
            Ce document restera confidentiel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all p-8
              ${isDragOver
                ? "border-[#F4C430] bg-[#F4C430]/5"
                : "border-white/10 bg-white/5 hover:bg-white/10"
              }
              ${selectedFile ? "border-[#F4C430]/50" : ""}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="verification-file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-[#F4C430]/10 p-3">
                  <FileText className="h-8 w-8 text-[#F4C430]" />
                </div>
                <div>
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-xs text-white/50">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent clicking input again
                    setSelectedFile(null);
                  }}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Changer de fichier
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-white/5 p-3">
                  <Upload className="h-6 w-6 text-white/40" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    Glissez votre document ici
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    ou cliquez pour parcourir
                  </p>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">
                  PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
              className="text-white/60 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90 font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer pour certification"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
