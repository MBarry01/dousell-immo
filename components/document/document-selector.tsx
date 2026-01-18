"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Check, Loader2, Image as ImageIcon, FileIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getMyDocuments, uploadDocument } from "@/app/(workspace)/compte/mes-documents/actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Document = {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploaded_at: string;
    source: "manual" | "verification";
};

interface DocumentSelectorProps {
    onSelect: (document: { id: string; url: string; name: string; file_path?: string } | null) => void;
    selectedDocumentId?: string;
    documentType?: string;
    label?: string;
    description?: string;
    className?: string;
}

const documentTypes = [
    { value: "titre_propriete", label: "Titre de Propriété" },
    { value: "bail", label: "Bail" },
    { value: "cni", label: "CNI / Pièce d'identité" },
    { value: "facture", label: "Facture" },
    { value: "attestation", label: "Attestation" },
    { value: "autre", label: "Autre document" },
];

export function DocumentSelector({
    onSelect,
    selectedDocumentId,
    documentType,
    label = "Document justificatif",
    description = "Sélectionnez un document depuis votre coffre-fort ou uploadez-en un nouveau",
    className = "",
}: DocumentSelectorProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | undefined>(selectedDocumentId);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        type: documentType || "titre_propriete",
        file: null as File | null,
    });
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        setSelectedId(selectedDocumentId);
    }, [selectedDocumentId]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const result = await getMyDocuments();
            if (result.success && result.data) {
                const allDocs = result.data as Document[];
                // Filtrer seulement les documents manuels, et par type si spécifié
                const filteredDocs = documentType
                    ? allDocs.filter((doc) => doc.source === "manual" && doc.type === documentType)
                    : allDocs.filter((doc) => doc.source === "manual");
                setDocuments(filteredDocs);
            } else {
                toast.error("Erreur lors du chargement des documents");
            }
        } catch (error) {
            console.error("Error loading documents:", error);
            toast.error("Impossible de charger les documents");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDocument = (docId: string) => {
        setSelectedId(docId);
        const doc = documents.find((d) => d.id === docId);
        if (doc) {
            onSelect({
                id: doc.id,
                url: doc.url,
                name: doc.name,
            });
        }
    };

    const handleDeselectDocument = () => {
        setSelectedId(undefined);
        onSelect(null);
    };

    const handleUpload = async () => {
        if (!uploadForm.file) {
            toast.error("Veuillez sélectionner un fichier");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", uploadForm.file);
            formData.append("type", uploadForm.type);

            const result = await uploadDocument(formData);

            if (result.success && result.data) {
                toast.success("Document uploadé avec succès");
                setIsUploadDialogOpen(false);
                setUploadForm({ type: documentType || "titre_propriete", file: null });
                // Recharger la liste
                await loadDocuments();
                // Auto-sélectionner le nouveau document
                const newDoc = result.data as { id?: string };
                if (newDoc.id) {
                    handleSelectDocument(newDoc.id);
                }
            } else {
                toast.error(result.error || "Erreur lors de l'upload");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erreur lors de l'upload du document");
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase();
        if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
        if (["jpg", "jpeg", "png", "webp"].includes(ext || ""))
            return <ImageIcon className="h-5 w-5 text-blue-500" />;
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div>
                <Label className="text-white">{label}</Label>
                {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
            </div>

            {loading ? (
                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-center gap-2 text-white/60">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Chargement des documents...</span>
                    </div>
                </Card>
            ) : documents.length === 0 ? (
                <Card className="p-6 bg-white/5 border-white/10 text-center">
                    <FileText className="h-12 w-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60 mb-4">Aucun document dans votre coffre-fort</p>
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="mx-auto">
                                <Upload className="h-4 w-4 mr-2" />
                                Uploader un document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0118] border-white/10">
                            <DialogHeader>
                                <DialogTitle className="text-white">Uploader un nouveau document</DialogTitle>
                                <DialogDescription className="text-white/60">
                                    Ajoutez un document à votre coffre-fort (PDF, JPG, PNG, max 5 MB)
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label htmlFor="doc-type" className="text-white">
                                        Type de document
                                    </Label>
                                    <Select
                                        value={uploadForm.type}
                                        onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
                                        disabled={!!documentType}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="doc-file" className="text-white">
                                        Fichier
                                    </Label>
                                    <Input
                                        id="doc-file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) =>
                                            setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })
                                        }
                                        className="bg-white/5 border-white/10 text-white cursor-pointer file:cursor-pointer"
                                    />
                                    {uploadForm.file && (
                                        <p className="text-sm text-white/60 mt-1">
                                            {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                                        </p>
                                    )}
                                </div>

                                <Button
                                    onClick={handleUpload}
                                    disabled={!uploadForm.file || uploading}
                                    className="w-full"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Upload en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Uploader
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </Card>
            ) : (
                <div className="space-y-3">
                    <RadioGroup value={selectedId} onValueChange={handleSelectDocument}>
                        <div className="grid gap-2">
                            {documents.map((doc) => (
                                <Card
                                    key={doc.id}
                                    className={`p-4 cursor-pointer transition-all ${selectedId === doc.id
                                        ? "bg-primary/20 border-primary"
                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                        }`}
                                    onClick={() => handleSelectDocument(doc.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value={doc.id} id={doc.id} />
                                        {getFileIcon(doc.name)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">{doc.name}</p>
                                            <p className="text-xs text-white/50">
                                                {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Preview button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (doc.url) {
                                                    setPreviewDoc(doc);
                                                    setIsPreviewOpen(true);
                                                } else {
                                                    toast.error("Lien expiré, veuillez rafraîchir la page");
                                                }
                                            }}
                                            className="hover:bg-blue-500/20 text-blue-400 shrink-0"
                                            title="Prévisualiser le document"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {selectedId === doc.id && (
                                            <Check className="h-5 w-5 text-primary shrink-0" />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </RadioGroup>

                    <div className="flex gap-2">
                        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Uploader un nouveau
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0a0118] border-white/10">
                                <DialogHeader>
                                    <DialogTitle className="text-white">Uploader un nouveau document</DialogTitle>
                                    <DialogDescription className="text-white/60">
                                        Ajoutez un document à votre coffre-fort (PDF, JPG, PNG, max 5 MB)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <Label htmlFor="doc-type" className="text-white">
                                            Type de document
                                        </Label>
                                        <Select
                                            value={uploadForm.type}
                                            onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
                                            disabled={!!documentType}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="doc-file" className="text-white">
                                            Fichier
                                        </Label>
                                        <Input
                                            id="doc-file"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) =>
                                                setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })
                                            }
                                            className="bg-white/5 border-white/10 text-white cursor-pointer file:cursor-pointer"
                                        />
                                        {uploadForm.file && (
                                            <p className="text-sm text-white/60 mt-1">
                                                {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!uploadForm.file || uploading}
                                        className="w-full"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Upload en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Uploader
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {selectedId && (
                            <Button variant="ghost" onClick={handleDeselectDocument} className="flex-1">
                                Désélectionner
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="bg-[#0a0118] border-white/10 max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">{previewDoc?.name}</DialogTitle>
                        <DialogDescription className="text-white/60">
                            {previewDoc && formatFileSize(previewDoc.size)} • {previewDoc && new Date(previewDoc.uploaded_at).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {previewDoc && (
                            <div className="w-full">
                                {previewDoc.name.toLowerCase().endsWith('.pdf') ? (
                                    <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-white/20 rounded-lg bg-white/5">
                                        <FileText className="h-16 w-16 text-blue-400" />
                                        <p className="text-white text-center">
                                            Les PDFs ne peuvent pas être affichés dans le modal pour des raisons de sécurité.
                                        </p>
                                        <Button
                                            onClick={() => {
                                                window.open(previewDoc.url, '_blank');
                                                setIsPreviewOpen(false);
                                            }}
                                            className="bg-blue-500 hover:bg-blue-600 text-white"
                                        >
                                            Ouvrir le PDF dans un nouvel onglet
                                        </Button>
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={previewDoc.url}
                                        alt={previewDoc.name}
                                        className="w-full h-auto rounded-lg border border-white/10"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
