"use client";

import { useState, useTransition } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationStatusBadge } from "./verification-status-badge";
import { submitListingVerification } from "@/app/_actions/verification";
import { cn } from "@/lib/utils";

type VerificationStatus = "pending" | "verified" | "rejected" | null;

type VerificationUploadFormProps = {
  propertyId: string;
  currentStatus: VerificationStatus;
  proofDocumentUrl?: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];

export function VerificationUploadForm({
  propertyId,
  currentStatus,
  proofDocumentUrl,
}: VerificationUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validation du type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error("Format non supporté", {
        description: "Veuillez uploader un fichier PDF, PNG, JPG ou WEBP.",
      });
      return;
    }

    // Validation de la taille
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Fichier trop volumineux", {
        description: "La taille maximale est de 5 Mo.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Aucun fichier sélectionné");
      return;
    }

    if (currentStatus === "pending") {
      toast.error("Une demande est déjà en cours de traitement");
      return;
    }

    startTransition(async () => {
      const result = await submitListingVerification(propertyId, file);

      if (result.success) {
        toast.success("Demande de vérification envoyée", {
          description: "Votre document sera examiné sous peu.",
        });
        setFile(null);
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue.",
        });
      }
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const getFileIcon = () => {
    if (file?.type === "application/pdf") {
      return <FileText className="h-8 w-8 text-primary" />;
    }
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Vérification du bien</CardTitle>
            <CardDescription className="text-white/60">
              Uploader un document de preuve de propriété
            </CardDescription>
          </div>
          {currentStatus && (
            <VerificationStatusBadge status={currentStatus} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage du statut */}
        {currentStatus === "verified" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Votre bien a été vérifié avec succès.</span>
          </div>
        )}

        {currentStatus === "rejected" && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Votre demande de vérification a été refusée. Vous pouvez soumettre un nouveau document.
            </span>
          </div>
        )}

        {currentStatus === "pending" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-amber-300">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Votre demande est en cours de traitement.</span>
          </div>
        )}

        {/* Zone d'upload */}
        {currentStatus !== "pending" && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-colors",
              dragActive
                ? "border-primary bg-primary/10"
                : "border-white/20 bg-white/5",
              file && "border-primary bg-primary/10"
            )}
          >
            <div className="flex flex-col items-center justify-center p-8 text-center">
              {file ? (
                <div className="flex w-full flex-col items-center gap-4">
                  {getFileIcon()}
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-white/60">
                      {(file.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Retirer
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-white/40 mb-4" />
                  <p className="text-sm font-medium text-white mb-1">
                    Glissez-déposez votre document ici
                  </p>
                  <p className="text-xs text-white/60 mb-4">
                    ou cliquez pour sélectionner un fichier
                  </p>
                  <label htmlFor="proof-upload">
                    <input
                      id="proof-upload"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <span>Sélectionner un fichier</span>
                    </Button>
                  </label>
                  <p className="mt-4 text-xs text-white/50">
                    PDF, PNG, JPG, WEBP (max 5 Mo)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bouton de soumission */}
        {file && currentStatus !== "pending" && (
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Envoi en cours..." : "Soumettre la vérification"}
          </Button>
        )}

        {/* Lien vers le document existant */}
        {proofDocumentUrl && currentStatus !== null && (
          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
            <p className="text-xs text-white/60 mb-2">Document uploadé :</p>
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certifications/${proofDocumentUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Voir le document
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
