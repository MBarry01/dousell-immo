"use client";

import { useEffect, useState } from "react";
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
    ImageIcon,
    Eye,
    CaretRight,
    HouseLine,
    CurrencyDollar,
    Wrench,
    FileLock,
    Files,
    Briefcase,
    ShieldCheck
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
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
import { useTheme } from "@/components/theme-provider";

import { uploadDocument, deleteDocument, getMyDocuments, getRentalDocuments, getVerificationDocuments } from "@/app/(workspace)/compte/mes-documents/actions";
import { getProperties, getLeasesByOwner } from "../actions";
import { DocumentsTour } from "@/components/gestion/tours/DocumentsTour";
import { DocumentGridSkeleton } from "../components/PremiumSkeletons";

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
    source?: string;
};

// Composant pour l'icône de dossier visuel (style Premium)
const VisualFolder = ({ className, icon: Icon }: { className?: string, icon?: any }) => (
    <div className={`relative w-14 h-11 ${className}`}>
        {/* Back part (Tab) */}
        <div className="absolute top-0 left-0 w-[40%] h-[30%] bg-amber-600 rounded-t-lg shadow-sm" />
        {/* Main body */}
        <div className="absolute bottom-0 left-0 right-0 h-[85%] bg-amber-400 rounded-xl shadow-md overflow-hidden">
            {/* Front flap lighting */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent" />
        </div>
        {/* Content inside (if any) */}
        {Icon && (
            <div className="absolute bottom-[20%] left-0 right-0 flex justify-center z-10 opacity-70">
                <Icon size={18} className="text-amber-900" weight="bold" />
            </div>
        )}
        {/* Front part (Flap) */}
        <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-amber-300 rounded-xl shadow-inner transform translate-y-[1px]">
            {/* Glossy effect */}
            <div className="absolute top-1 left-3 right-3 h-[1px] bg-white/40" />
        </div>
    </div>
);

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
    { value: "bail", label: "Contrat de Bail" },
    { value: "quittance", label: "Quittance de Loyer" },
    { value: "etat_lieux", label: "État des Lieux" },
    { value: "devis", label: "Devis" },
    { value: "facture_travaux", label: "Facture Travaux" },
    { value: "assurance", label: "Assurance" },
    { value: "courrier", label: "Courrier / Avis" },
    { value: "verification", label: "Vérification / Vault" },
    { value: "autre", label: "Autre Document" }
];

const THEMES = [
    { id: "contracts", label: "Baux & Contrats", icon: FileLock, categories: ["bail"] },
    { id: "finance", label: "Finance & Quittances", icon: CurrencyDollar, categories: ["quittance"] },
    { id: "inventory", label: "États des Lieux", icon: HouseLine, categories: ["etat_lieux"] },
    { id: "technical", label: "Technique & Travaux", icon: Wrench, categories: ["devis", "facture_travaux"] },
    { id: "verification", label: "Vérifications / Vault", icon: ShieldCheck, categories: ["verification"] },
    { id: "admin", label: "Administratif", icon: Files, categories: ["assurance", "courrier", "autre"] },
];

export default function RentalDocumentsPage() {
    const { isDark } = useTheme();
    const [documents, setDocuments] = useState<RentalDocument[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(true);

    // Navigation state
    const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);
    const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'root' | 'rental' | 'agency'>('root');

    // Filters
    const [selectedLeaseFilter, setSelectedLeaseFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

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
            const [docsResult, propsResult, leasesResult, verifResult] = await Promise.all([
                getRentalDocuments(),
                getProperties(),
                getLeasesByOwner(),
                getVerificationDocuments()
            ]);

            if (docsResult.success) {
                const rentalDocs = docsResult.data as RentalDocument[];
                const verifDocs = (verifResult.success ? verifResult.data : []) as any[];

                // Fusionner en évitant les doublons d'ID
                const allDocs = [...rentalDocs];
                verifDocs.forEach(vd => {
                    if (!allDocs.some(ad => ad.id === vd.id)) {
                        allDocs.push({
                            ...vd,
                            category: 'verification'
                        });
                    }
                });

                setDocuments(allDocs);
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

    // --- LOGIQUE DE NAVIGATION VIRTUELLE ---

    // 1. Filtrer les documents selon la navigation actuelle
    const getVisibleItems = () => {
        // Si recherche active -> Liste plate filtrée
        if (searchQuery) {
            return { type: 'documents', items: filteredDocuments };
        }

        // Niveau 1 : Liste des Propriétés
        if (viewMode === 'root') {
            const rentalDocsCount = documents.filter(d => d.property_id).length;
            const agencyDocsCount = documents.filter(d => !d.property_id).length;

            return {
                type: 'folders',
                items: [
                    {
                        id: 'rental_root',
                        name: 'Coffre-fort',
                        type: 'root_folder',
                        icon: ShieldCheck,
                        count: rentalDocsCount,
                        action: () => setViewMode('rental')
                    },
                    {
                        id: 'agency_root',
                        name: 'Archives de Gestion',
                        type: 'root_folder',
                        icon: Briefcase,
                        count: agencyDocsCount,
                        action: () => {
                            setViewMode('agency');
                            setCurrentPropertyId('orphan');
                        }
                    }
                ]
            };
        }

        if (viewMode === 'rental' && !currentPropertyId) {
            const propsWithDocs = properties.filter(p =>
                documents.some(d => d.property_id === p.id)
            );

            const items = propsWithDocs.map(p => ({
                id: p.id,
                name: p.title,
                type: 'property_folder',
                count: documents.filter(d => d.property_id === p.id).length
            }));

            return { type: 'folders', items };
        }

        // Niveau 2 : Thèmes (Baux, Finance, etc.)
        if (!currentThemeId) {
            const propertyDocs = documents.filter(d =>
                currentPropertyId === 'orphan' ? !d.property_id : d.property_id === currentPropertyId
            );

            const items = THEMES.map(theme => {
                const themeDocs = propertyDocs.filter(d => theme.categories.includes(d.category || ''));
                if (themeDocs.length === 0) return null;
                return {
                    id: theme.id,
                    name: theme.label,
                    type: 'theme_folder',
                    icon: theme.icon,
                    count: themeDocs.length
                };
            }).filter(Boolean);

            return { type: 'folders', items };
        }

        // Niveau 3 : Documents du thème
        const theme = THEMES.find(t => t.id === currentThemeId);
        const finalDocs = documents.filter(d => {
            const matchesProp = currentPropertyId === 'orphan' ? !d.property_id : d.property_id === currentPropertyId;
            const matchesTheme = theme?.categories.includes(d.category || '');
            return matchesProp && matchesTheme;
        });

        return { type: 'documents', items: finalDocs };
    };

    const navigationResult = getVisibleItems();

    const currentPropertyName = currentPropertyId === 'orphan' ? 'Archives de Gestion' : properties.find(p => p.id === currentPropertyId)?.title;
    const currentThemeName = THEMES.find(t => t.id === currentThemeId)?.label;

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
        if (mimeType.includes("image")) return <ImageIcon className={`w-6 h-6 ${isDark ? 'text-brand' : 'text-slate-900'}`} weight="duotone" />;
        return <FileText className="w-6 h-6 text-slate-400" weight="duotone" />;
    };

    return (
        <div className={`min-h-screen p-6 md:p-8 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto space-y-8">


                {/* Header */}
                <div id="tour-ged-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <DocumentsTour />
                    <div>
                        <h1 className={`text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                        <DialogContent className={`${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`} onFocusOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Ajouter un document</DialogTitle>
                                <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                    Liez ce document à une propriété pour une organisation optimale.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label required>Propriété concernée</Label>
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
                                    <Label required>Catégorie</Label>
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

                {/* Breadcrumbs Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto text-sm font-medium">
                    <button
                        onClick={() => { setViewMode('root'); setCurrentPropertyId(null); setCurrentThemeId(null); }}
                        className={`flex items-center gap-1 transition-colors ${viewMode === 'root' ? 'text-brand' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Folder size={18} weight={viewMode === 'root' ? 'fill' : 'regular'} />
                        Accueil
                    </button>

                    {viewMode !== 'root' && (
                        <>
                            <CaretRight size={14} className="text-slate-600" />
                            <button
                                onClick={() => { setCurrentPropertyId(null); setCurrentThemeId(null); setViewMode(viewMode); }}
                                className={`flex items-center gap-1 transition-colors ${!currentPropertyId ? 'text-brand' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {viewMode === 'rental' ? <ShieldCheck size={18} /> : <Briefcase size={18} />}
                                {viewMode === 'rental' ? 'Coffre-fort' : 'Archives de Gestion'}
                            </button>
                        </>
                    )}

                    {currentPropertyId && currentPropertyId !== 'orphan' && (
                        <>
                            <CaretRight size={14} className="text-slate-600" />
                            <button
                                onClick={() => setCurrentThemeId(null)}
                                className={`flex items-center gap-1 transition-colors ${!currentThemeId ? 'text-brand' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <HouseLine size={18} />
                                {currentPropertyName}
                            </button>
                        </>
                    )}

                    {currentThemeId && (
                        <>
                            <CaretRight size={14} className="text-slate-600" />
                            <span className="text-brand flex items-center gap-1">
                                {currentThemeName}
                            </span>
                        </>
                    )}
                </div>

                {/* Content */}
                <div id="tour-ged-list" className="min-h-[400px]">
                    {loading ? (
                        <DocumentGridSkeleton count={6} />
                    ) : navigationResult.items.length === 0 ? (
                        <EmptyState
                            title={currentPropertyId === 'orphan' ? "Votre coffre-fort est vide" : "Ce dossier est vide"}
                            description={currentPropertyId === 'orphan'
                                ? "Uploadez vos documents personnels, d'agence ou de vérification ici."
                                : "Vous n'avez pas encore de documents ici."
                            }
                            actionLabel="Ajouter un document"
                            onAction={() => {
                                if (currentPropertyId === 'orphan') setUploadPropertyId(""); // Ensure it's not linked to a property
                                setUploadDialogOpen(true);
                            }}
                            icon={currentPropertyId === 'orphan' ? Briefcase : Folder}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {navigationResult.type === 'folders' ? (
                                // --- AFFICHAGE DOSSIERS ---
                                (navigationResult.items as any[]).map((item) => {
                                    const FolderIcon = item.icon || Folder;
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (item.action) item.action();
                                                else if (item.type === 'property_folder') setCurrentPropertyId(item.id);
                                                else setCurrentThemeId(item.id);
                                            }}
                                            className={`flex flex-col items-center p-5 rounded-2xl border transition-all text-center ${isDark ? 'bg-slate-900/40 border-slate-800 hover:border-brand/40 hover:bg-slate-900/60' : 'bg-white border-gray-200 hover:border-brand/40 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="mb-4">
                                                <VisualFolder icon={item.icon} />
                                            </div>
                                            <h3 className={`font-black tracking-tighter text-lg leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {item.count} fichier{item.count > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </motion.button>
                                    );
                                })
                            ) : (
                                // --- AFFICHAGE DOCUMENTS ---
                                (navigationResult.items as RentalDocument[]).map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group relative rounded-xl p-4 transition-all hover:shadow-lg border ${isDark
                                            ? 'bg-slate-900 border-slate-800 hover:border-brand/30 hover:shadow-brand/5'
                                            : 'bg-white border-gray-200 hover:border-brand/30 hover:shadow-brand/5'
                                            }`}
                                    >
                                        {/* Lien global cliquable (Stretched link pattern) */}
                                        {doc.url && (
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 z-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                                                aria-label={`Voir le document ${doc.name}`}
                                            />
                                        )}

                                        <div className="flex items-start justify-between mb-3 relative z-10 pointer-events-none">
                                            <div className={`p-2 rounded-lg pointer-events-auto ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
                                                {getFileIcon(doc.type || "")}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`p-1.5 rounded-md ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-brand' : 'hover:bg-gray-100 text-gray-400 hover:text-slate-900'}`}
                                                    title="Prévisualiser"
                                                >
                                                    <Eye size={18} weight="bold" />
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
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Important pour ne pas trigger le lien global (même si z-index gère)
                                                        handleDelete(doc.id);
                                                    }}
                                                    className={`p-1.5 rounded-md ${isDark ? 'hover:bg-red-900/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                                    title="Supprimer"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className={`font-black tracking-tighter truncate ${isDark ? 'text-slate-200' : 'text-gray-900'}`} title={doc.name}>
                                                {doc.name}
                                            </h3>
                                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-brand' : 'text-slate-500'}`}>
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
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
