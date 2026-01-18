"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Folder,
    FileText,
    UploadSimple,
    DownloadSimple,
    Trash,
    Funnel,
    MagnifyingGlass,
    House,
    User,
    FilePdf,
    Image as ImageIcon,
    Eye
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { OnboardingTour, useOnboardingTour, TourStep } from "@/components/onboarding/OnboardingTour";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from '@/components/workspace/providers/theme-provider';

import { uploadDocument, deleteDocument, getMyDocuments, getRentalDocuments } from "@/app/(workspace)/compte/mes-documents/actions";
import { getProperties, getLeasesByOwner } from "../actions";

// Types
type RentalDocument = {
    id: string;
    name: string;
    type: string;
    category?: string;
    size: number;
    url: string;
    uploaded_at: string;
    property_id?: string;
    lease_id?: string;
    property_title?: string;
    tenant_name?: string;
    file_name?: string;
};

type Property = {
    id: string;
    title: string;
};

type Lease = {
    id: string;
    property_id: string;
    tenant_name: string;
};

const DOCUMENT_CATEGORIES = [
    { value: "bail", label: "Contrat de Bailli" },
    { value: "quittance", label: "Quittance de Loyer" },
    { value: "etat_lieux", label: "État des Lieux" },
    { value: "facture_travaux", label: "Facture Travaux" },
    { value: "assurance", label: "Assurance" },
    { value: "courrier", label: "Courrier / Avis" },
    { value: "autre", label: "Autre Document" }
];

export default function RentalDocumentsPage() {
    const { isDark } = useTheme();
    const { showTour, closeTour, resetTour } = useOnboardingTour('dousell_ged_documents_tour', 1500);
    const [documents, setDocuments] = useState<RentalDocument[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedLeaseFilter, setSelectedLeaseFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Tour Steps
    const tourSteps: TourStep[] = useMemo(() => [
        {
            targetId: 'tour-ged-upload',
            title: 'Ajouter un document',
            description: 'Uploadez vos contrats de bail, quittances, factures et autres documents importants liés à vos biens.',
            imageSrc: 'https://images.unsplash.com/photo-1568234928966-359c35dd8327?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Upload de document'
        },
        {
            targetId: 'tour-ged-search',
            title: 'Recherche & Filtres',
            description: 'Retrouvez rapidement vos documents grâce à la recherche par nom ou filtrez par locataire.',
            imageSrc: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Recherche de documents'
        },
        {
            targetId: 'tour-ged-list',
            title: 'Vos documents',
            description: 'Tous vos documents sont organisés ici. Prévisualisez, téléchargez ou supprimez en un clic.',
            imageSrc: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=600',
            imageAlt: 'Liste des documents'
        }
    ], []);

    // Upload State
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPropertyId, setUploadPropertyId] = useState<string>("");
    const [uploadLeaseId, setUploadLeaseId] = useState<string>("none");
    const [uploadCategory, setUploadCategory] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsResult, propsResult, leasesResult] = await Promise.all([
                getRentalDocuments(),
                getProperties(),
                getLeasesByOwner()
            ]);

            if (docsResult.success) {
                setDocuments(docsResult.data as RentalDocument[]);
            }
            if (propsResult.success) {
                setProperties(propsResult.data || []);
            }
            if (leasesResult.success && leasesResult.data) {
                // Adapt leases structure if needed
                setLeases(leasesResult.data.map((l: any) => ({
                    id: l.id,
                    property_id: l.property_id,
                    tenant_name: l.tenant_name
                })));
            }
        } catch (error) {
            console.error("Error loading GED data:", error);
            toast.error("Erreur lors du chargement des documents");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadPropertyId || !uploadCategory) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("type", "autre"); // Default internal type
        formData.append("category", uploadCategory);
        formData.append("propertyId", uploadPropertyId);
        if (uploadLeaseId && uploadLeaseId !== "none") {
            formData.append("leaseId", uploadLeaseId);
        }

        const result = await uploadDocument(formData);

        if (result.success) {
            toast.success("Document ajouté à la GED");
            setUploadDialogOpen(false);
            setUploadFile(null);
            setUploadCategory("");
            loadData(); // Refresh list
        } else {
            toast.error(result.error || "Erreur lors de l'upload");
        }
        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce document ?")) return;
        const result = await deleteDocument(id);
        if (result.success) {
            toast.success("Document supprimé");
            loadData();
        } else {
            toast.error("Erreur suppression");
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesLease = selectedLeaseFilter === "all" || doc.lease_id === selectedLeaseFilter;
        const docName = doc.name || doc.file_name || '';  // Fallback to file_name if name is missing
        const docCategory = doc.category || '';
        const matchesSearch = docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            docCategory.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLease && matchesSearch;
    });

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes("pdf")) return <FilePdf className="w-6 h-6 text-red-400" weight="duotone" />;
        if (mimeType.includes("image")) return <ImageIcon className="w-6 h-6 text-blue-400" weight="duotone" />;
        return <FileText className="w-6 h-6 text-slate-400" weight="duotone" />;
    };

    return (
        <div className={`min-h-screen p-6 md:p-8 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {/* Premium Onboarding Tour */}
            <OnboardingTour
                steps={tourSteps}
                isOpen={showTour}
                onClose={closeTour}
                onComplete={closeTour}
                storageKey="dousell_ged_documents_tour"
            />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Folder className="text-brand" weight="duotone" />
                            GED & Documents
                        </h1>
                        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Gérez de manière centralisée tous les documents de vos biens locatifs
                        </p>
                    </div>

                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button id="tour-ged-upload" className={`${isDark ? 'bg-brand hover:bg-brand/90 text-black' : 'bg-slate-900 hover:bg-slate-800 text-white'} gap-2`}>
                                <UploadSimple weight="bold" />
                                Nouveau Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={`${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                            <DialogHeader>
                                <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Ajouter un document</DialogTitle>
                                <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                    Liez ce document à une propriété pour une organisation optimale.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Propriété concernée (Obligatoire)</Label>
                                    <Select value={uploadPropertyId} onValueChange={setUploadPropertyId}>
                                        <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                            <SelectValue placeholder="Choisir un bien..." />
                                        </SelectTrigger>
                                        <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}>
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Locataire / Bail (Optionnel)</Label>
                                    <Select value={uploadLeaseId} onValueChange={setUploadLeaseId} disabled={!uploadPropertyId}>
                                        <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                            <SelectValue placeholder="Lier à un locataire..." />
                                        </SelectTrigger>
                                        <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}>
                                            <SelectItem value="none">-- Aucun --</SelectItem>
                                            {leases
                                                .filter(l => l.property_id === uploadPropertyId)
                                                .map(l => (
                                                    <SelectItem key={l.id} value={l.id}>{l.tenant_name}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Catégorie (Obligatoire)</Label>
                                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                                        <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                            <SelectValue placeholder="Type de document..." />
                                        </SelectTrigger>
                                        <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}>
                                            {DOCUMENT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Fichier</Label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className={isDark
                                            ? 'bg-slate-800 border-slate-700 text-white file:bg-slate-700 file:text-white file:border-0'
                                            : 'bg-gray-50 border-gray-300 text-gray-900 file:bg-gray-200 file:text-gray-700 file:border-0'
                                        }
                                    />
                                </div>

                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className={`w-full ${isDark ? 'bg-brand hover:bg-brand/90 text-black' : 'bg-slate-900 hover:bg-slate-800 text-white'} mt-2`}
                                >
                                    {uploading ? "Envoi en cours..." : "Sauvegarder"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <Card id="tour-ged-search" className={`p-4 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                            <Input
                                placeholder="Rechercher un document..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 w-full ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <Select value={selectedLeaseFilter} onValueChange={setSelectedLeaseFilter}>
                                <SelectTrigger className={isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}>
                                    <Funnel className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Filtrer par locataire" />
                                </SelectTrigger>
                                <SelectContent className={isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}>
                                    <SelectItem value="all">Tous les locataires</SelectItem>
                                    {leases.map(lease => (
                                        <SelectItem key={lease.id} value={lease.id}>
                                            {lease.tenant_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Content */}
                <div id="tour-ged-list">
                    {loading ? (
                        <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Chargement de vos documents...</div>
                    ) : filteredDocuments.length === 0 ? (
                        <EmptyState
                            title="Aucun document trouvé"
                            description="Commencez par ajouter des baux, quittances ou factures pour vos biens."
                            actionLabel="Ajouter un document"
                            onAction={() => setUploadDialogOpen(true)}
                            icon={Folder}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocuments.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group relative rounded-xl p-4 transition-all hover:shadow-lg border ${isDark
                                        ? 'bg-slate-900 border-slate-800 hover:border-brand/30 hover:shadow-brand/5'
                                        : 'bg-white border-gray-200 hover:border-brand/30 hover:shadow-brand/5'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
                                            {getFileIcon(doc.type || "")}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`p-1.5 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                                                title="Prévisualiser"
                                            >
                                                <Eye size={18} />
                                            </a>
                                            <a
                                                href={doc.url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`p-1.5 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
                                                title="Télécharger"
                                            >
                                                <DownloadSimple size={18} />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className={`p-1.5 rounded-md ${isDark ? 'hover:bg-red-900/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                                title="Supprimer"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className={`font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-900'}`} title={doc.name}>
                                            {doc.name}
                                        </h3>
                                        <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-brand' : 'text-slate-500'}`}>
                                            {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                                        </p>
                                    </div>

                                    <div className={`mt-4 pt-3 flex items-center justify-between text-xs border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-gray-200 text-gray-500'}`}>
                                        <span className="flex items-center gap-1.5">
                                            {doc.tenant_name && (
                                                <>
                                                    <User size={12} />
                                                    {doc.tenant_name}
                                                </>
                                            )}
                                            {doc.property_title && !doc.tenant_name && (
                                                <>
                                                    <House size={12} />
                                                    {doc.property_title}
                                                </>
                                            )}
                                        </span>
                                        <span>{doc.uploaded_at ? format(new Date(doc.uploaded_at), "d MMM yyyy", { locale: fr }) : 'Date inconnue'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bouton pour relancer le tour */}
            <button
                onClick={resetTour}
                className={`fixed bottom-4 right-4 z-50 p-2.5 rounded-full transition-all duration-200 shadow-lg ${isDark
                        ? 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                        : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                    }`}
                title="Relancer le tutoriel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                </svg>
            </button>
        </div>
    );
}
