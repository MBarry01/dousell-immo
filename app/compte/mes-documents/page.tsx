"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Shield,
  FileText,
  Download,
  Trash2,
  Upload,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
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
import { uploadDocument, getMyDocuments, deleteDocument, getVerificationDocuments, refreshDocumentUrl } from "./actions";

type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
  source: "manual" | "verification"; // manuel ou depuis certification
};

const documentTypes = [
  { value: "titre_propriete", label: "Titre de Propriété" },
  { value: "bail", label: "Bail / Contrat de Location" },
  { value: "cni", label: "CNI / Passeport" },
  { value: "facture", label: "Facture (Eau, Électricité)" },
  { value: "attestation", label: "Attestation Fiscale" },
  { value: "autre", label: "Autre Document" },
];

export default function MesDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    console.log("🔍 [CLIENT] loadDocuments - Début");
    setLoading(true);
    try {
      // Récupérer les documents manuels
      console.log("🔍 [CLIENT] Appel getMyDocuments()...");
      const manualDocs = await getMyDocuments();
      console.log("🔍 [CLIENT] manualDocs:", manualDocs);

      // Récupérer les documents de certification (annonces certifiées)
      console.log("🔍 [CLIENT] Appel getVerificationDocuments()...");
      const verificationDocs = await getVerificationDocuments();
      console.log("🔍 [CLIENT] verificationDocs:", verificationDocs);

      // Combiner les documents (même si l'un des deux échoue)
      const allDocs = [
        ...(manualDocs.success ? manualDocs.data || [] : []),
        ...(verificationDocs.success ? verificationDocs.data || [] : []),
      ].filter((doc): doc is Document => doc !== null); // Filtrer les valeurs null

      console.log("✅ [CLIENT] Total documents:", allDocs.length);
      console.log("✅ [CLIENT] Documents manuels:", manualDocs.success ? manualDocs.data?.length : 0);
      console.log("✅ [CLIENT] Documents certifiés:", verificationDocs.success ? verificationDocs.data?.length : 0);

      setDocuments(allDocs);

      // Afficher un warning si getVerificationDocuments a échoué
      if (!verificationDocs.success) {
        console.warn("⚠️ [CLIENT] getVerificationDocuments a échoué:", verificationDocs.error);
      }
    } catch (error) {
      console.error("❌ [CLIENT] Exception:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
      console.log("🔍 [CLIENT] loadDocuments - Fin");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      toast.error("Veuillez sélectionner un fichier et un type de document");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", selectedType);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success("Document ajouté au coffre-fort", {
          description: "Votre document est maintenant sécurisé",
        });
        setDialogOpen(false);
        setSelectedFile(null);
        setSelectedType("");
        loadDocuments();
      } else {
        toast.error(result.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      toast.error("Erreur lors de l'upload du document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (url: string, filename: string, docId: string, docSource: "manual" | "verification") => {
    console.group(`🔍 [DEBUG] Téléchargement: ${filename}`);
    console.log("🔗 URL Signée:", url);

    try {
      // 1. Tenter de récupérer le fichier
      const response = await fetch(url);

      console.log("📡 Status HTTP:", response.status);
      console.log("📄 Content-Type:", response.headers.get("content-type"));

      // Si Supabase renvoie une erreur (400, 403, 404) => URL expirée
      if (!response.ok) {
        console.warn("⚠️ URL peut-être expirée, tentative de régénération...");

        // Tenter de régénérer l'URL
        const refreshResult = await refreshDocumentUrl(docId, docSource);

        if (refreshResult.success && refreshResult.data?.url) {
          console.log("✅ URL régénérée, nouvelle tentative de téléchargement...");

          // Réessayer avec la nouvelle URL
          const retryResponse = await fetch(refreshResult.data.url);

          if (!retryResponse.ok) {
            throw new Error(`Erreur HTTP ${retryResponse.status} - Impossible de récupérer le fichier même après régénération`);
          }

          const blob = await retryResponse.blob();
          console.log("📦 Taille du fichier (retry):", blob.size, "octets");

          // Télécharger le fichier
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          console.log("✅ Téléchargement réussi après régénération");
          toast.success("Téléchargement lancé");

          // Recharger les documents pour rafraîchir les URLs
          loadDocuments();
          console.groupEnd();
          return;
        } else {
          throw new Error(`Impossible de régénérer l'URL: ${refreshResult.error}`);
        }
      }

      // 2. Vérifier le contenu
      const blob = await response.blob();
      console.log("📦 Taille du fichier:", blob.size, "octets");
      console.log("📦 Type du Blob:", blob.type);

      // Si le fichier est minuscule (<1KB), c'est souvent une erreur texte cachée
      if (blob.size < 500) {
        const textError = await blob.text();
        console.error("⚠️ Le fichier semble être une erreur texte:", textError);

        // Tenter de régénérer l'URL
        console.warn("⚠️ Fichier trop petit, tentative de régénération...");
        const refreshResult = await refreshDocumentUrl(docId, docSource);

        if (refreshResult.success && refreshResult.data?.url) {
          console.log("✅ URL régénérée, nouvelle tentative...");
          const retryResponse = await fetch(refreshResult.data.url);
          const retryBlob = await retryResponse.blob();

          if (retryBlob.size < 500) {
            toast.error("Fichier corrompu", {
              description: "Le fichier reçu est trop petit ou vide.",
            });
            console.groupEnd();
            return;
          }

          // Télécharger le fichier régénéré
          const downloadUrl = window.URL.createObjectURL(retryBlob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          console.log("✅ Téléchargement réussi après régénération");
          toast.success("Téléchargement lancé");

          // Recharger les documents
          loadDocuments();
          console.groupEnd();
          return;
        }

        toast.error("Fichier corrompu", {
          description: "Le fichier reçu est trop petit ou vide.",
        });
        console.groupEnd();
        return;
      }

      // 3. Créer le téléchargement forcé
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("✅ Téléchargement déclenché");
      toast.success("Téléchargement lancé");
    } catch (error) {
      console.error("❌ Erreur critique:", error);
      toast.error("Erreur de téléchargement", {
        description: error instanceof Error ? error.message : "Impossible de télécharger ce document.",
      });
    } finally {
      console.groupEnd();
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const result = await deleteDocument(documentId);

      if (result.success) {
        toast.success("Document supprimé");
        loadDocuments();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getDocumentIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-black px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 border border-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mes Documents</h1>
              <p className="text-white/60">Coffre-fort numérique ultra-sécurisé</p>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              Chiffré AES-256
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              <Lock className="h-3.5 w-3.5" />
              Confidentiel
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Accès Privé
            </span>
          </div>
        </motion.div>

        {/* Upload Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black hover:bg-primary/90 font-semibold">
                <Upload className="mr-2 h-4 w-4" />
                Ajouter un document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212] border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-white">Ajouter un document</DialogTitle>
                <DialogDescription className="text-white/60">
                  Téléversez un document dans votre coffre-fort sécurisé
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="document-type" className="text-white/70">
                    Type de document
                  </Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="mt-2 bg-background border-white/10 text-white">
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-white/10">
                      {documentTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-white hover:bg-white/10"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file" className="text-white/70">
                    Fichier
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-2 bg-background border-white/10 text-white file:bg-primary file:text-black file:border-0 file:rounded-lg file:px-4 file:py-2 file:font-semibold"
                  />
                  <p className="mt-1 text-xs text-white/50">
                    PDF, JPG ou PNG • Max 5 MB
                  </p>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedType || uploading}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-semibold"
                >
                  {uploading ? "Upload en cours..." : "Ajouter au coffre-fort"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-background border-white/10 p-6 animate-pulse">
                <div className="h-24 bg-white/5 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-background border-white/10 p-12 text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Votre coffre-fort est vide
              </h3>
              <p className="text-white/60 mb-6">
                Commencez par ajouter vos documents importants
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-primary text-black hover:bg-primary/90 font-semibold"
              >
                <Upload className="mr-2 h-4 w-4" />
                Ajouter mon premier document
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="group bg-background border-white/10 p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                      {getDocumentIcon(doc.type)}
                    </div>
                    {doc.source === "verification" && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                        CERTIFIÉ
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-white/50 mb-1">
                    {documentTypes.find((t) => t.value === doc.type)?.label || doc.type}
                  </p>
                  <p className="text-xs text-white/40 mb-4">
                    {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
                      onClick={() => {
                        console.log("👁️ Clic sur Voir - URL:", doc.url);
                        console.log("👁️ Document:", doc.name);
                        if (doc.url) {
                          window.open(doc.url, "_blank", "noopener,noreferrer");
                        } else {
                          console.error("❌ Pas d'URL signée disponible");
                          toast.error("Lien indisponible");
                        }
                      }}
                      disabled={!doc.url}
                      title="Voir le document"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
                      onClick={() => handleDownload(doc.url, doc.name, doc.id, doc.source)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Télécharger
                    </Button>
                    {doc.source === "manual" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-blue-500/5 border-blue-500/20 p-6">
            <div className="flex gap-4">
              <div className="rounded-xl bg-blue-500/10 p-3 border border-blue-500/20 h-fit">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">
                  Vos documents sont en sécurité
                </h3>
                <ul className="space-y-1 text-sm text-white/60">
                  <li>• Chiffrement AES-256 de bout en bout</li>
                  <li>• Accès privé (vous uniquement + administrateurs autorisés)</li>
                  <li>• Stockage sécurisé sur serveurs européens</li>
                  <li>• Les documents de certification sont automatiquement ajoutés ici</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
