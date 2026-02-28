'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DEFAULT_CONTRACT_TEXTS, ContractTexts } from '@/lib/contract-defaults';
import { generateLeaseContract } from '@/lib/actions/contract-actions';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, PlusCircle, CheckCircle2, RotateCcw } from "lucide-react";


interface GenerateContractModalProps {
    leaseId: string;
    tenantName?: string;
    onSuccess?: (url: string) => void;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    autoOpen?: boolean;
}

export function GenerateContractModal({ leaseId, tenantName, onSuccess, children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: GenerateContractModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'standard' | 'custom'>('standard');

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    // State local initialisé avec les textes par défaut
    const [texts, setTexts] = useState<ContractTexts>(DEFAULT_CONTRACT_TEXTS);
    const [customClause, setCustomClause] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Si mode standard, on envoie customTexts vide (ou undefined) pour utiliser les défauts
            // Si mode custom, on envoie les textes modifiés
            const payload = mode === 'custom' ? {
                ...texts,
                custom_clauses: customClause
            } : {}; // Vide = défauts côté serveur/générateur

            const result = await generateLeaseContract({
                leaseId,
                customTexts: payload
            });

            if (result.success) {
                setOpen(false);
                setMode('standard'); // Reset mode
                toast.success("Contrat généré avec succès");
                if (result.contractUrl && onSuccess) {
                    onSuccess(result.contractUrl);
                }
            } else {
                toast.error(result.error || "Erreur lors de la génération");
            }
        } catch (error) {
            console.error("Erreur", error);
            toast.error("Une erreur inattendue est survenue");
        } finally {
            setLoading(false);
        }
    };

    // Fonction générique pour modifier un article
    const handleChange = (key: keyof ContractTexts, value: string) => {
        setTexts(prev => ({ ...prev, [key]: value }));
    };

    const handlePreview = async () => {
        setLoading(true);
        try {
            // Preview : Standard ou Custom selon le mode
            const payload = mode === 'custom' ? {
                ...texts,
                custom_clauses: customClause
            } : {};

            const result = await generateLeaseContract({
                leaseId,
                customTexts: payload,
                preview: true // Mode preview
            });

            if (result.success && result.pdfBase64) {
                // Conversion Base64 -> Blob -> URL
                const binStr = atob(result.pdfBase64);
                const len = binStr.length;
                const arr = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }
                const blob = new Blob([arr], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                // Pour Mobile/PWA : window.open est souvent bloqué. On force le téléchargement/ouverture via lien.
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank'; // Ouvrir dans un nouvel onglet
                // link.download = ... // On laisse le navigateur décider (affichage)
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Nettoyage après un court délai pour laisser le temps au téléchargement de démarrer
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            } else {
                toast.error(result.error || "Erreur de prévisualisation");
            }
        } catch (error) {
            console.error("Erreur preview", error);
            toast.error("Erreur technique lors de la prévisualisation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className={cn(
                "flex flex-col p-0 overflow-hidden bg-card border-border text-foreground w-[95vw] sm:w-full",
                mode === 'custom' ? "max-w-3xl h-[90vh] sm:h-auto sm:max-h-[85vh]" : "sm:max-w-md"
            )}>
                <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-border shrink-0">
                    <DialogTitle className="pr-6 text-lg sm:text-xl leading-tight">
                        Générer le Contrat de Bail {tenantName ? `- ${tenantName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    {mode === 'standard' ? (
                        <div className="p-4 sm:p-6 space-y-4 py-2">
                            <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 text-sm text-muted-foreground">
                                <p className="font-bold mb-2 text-foreground text-lg">Génération Rapide</p>
                                <p className="mb-5 leading-relaxed text-base">Modèle standard 100% conforme au droit sénégalais (COCC) et décrets 2023.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handlePreview}
                                    disabled={loading}
                                    className="bg-muted hover:bg-muted/80 text-foreground h-10 text-sm w-full sm:w-auto font-semibold rounded-xl"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Aperçu du modèle type
                                </Button>
                            </div>

                            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex items-start gap-4">
                                <div className="mt-1 bg-primary/10 text-primary rounded-full p-2 shrink-0">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    <span className="font-bold text-primary block text-base mb-1">Besoin de modifier ?</span>
                                    Personnalisez chaque article ou ajoutez vos propres clauses (piscine, jardin, etc.) via le mode avancé.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Header sticky for Custom Mode */}
                            <div className="bg-muted/10 sticky top-0 z-20 px-4 py-3 flex justify-between items-center border-b border-border backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-1.5 rounded-full">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Éditeur de Clauses</h3>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setMode('standard')} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                                    Annuler
                                </Button>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                                {(Object.keys(DEFAULT_CONTRACT_TEXTS) as Array<keyof typeof DEFAULT_CONTRACT_TEXTS>).map((key) => {
                                    const label = key.replace(/_/g, ' ').replace('article', 'Article').replace(/\d+/, (match) => match + ' :');
                                    const isModified = texts[key] !== DEFAULT_CONTRACT_TEXTS[key];

                                    return (
                                        <AccordionItem key={key} value={key} className="border-b border-border/50 px-4 last:border-0 hover:bg-primary/[0.02] transition-colors">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-3 text-left">
                                                    <span className={cn(
                                                        "text-sm sm:text-base font-semibold capitalize",
                                                        isModified ? "text-primary font-bold" : "text-foreground"
                                                    )}>
                                                        {label}
                                                    </span>
                                                    {isModified && (
                                                        <span className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            Modifié
                                                        </span>
                                                    )}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-6">
                                                <div className="space-y-4">
                                                    <Textarea
                                                        value={texts[key] ?? DEFAULT_CONTRACT_TEXTS[key]}
                                                        onChange={(e) => handleChange(key, e.target.value)}
                                                        className="min-h-[180px] sm:min-h-[220px] resize-none bg-muted/20 border-border text-foreground focus:ring-1 focus:ring-primary/40 p-4 text-base leading-relaxed rounded-xl custom-scrollbar border-0 ring-1 ring-border shadow-inner"
                                                        placeholder={`Détails de l'${label.toLowerCase()}...`}
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground text-xs hover:text-primary h-8 gap-2"
                                                            onClick={() => handleChange(key, DEFAULT_CONTRACT_TEXTS[key])}
                                                            disabled={!isModified}
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Réinitialiser
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>

                            {/* SECTION 2 : Clauses Particulières */}
                            <div className="p-4 sm:p-6 bg-primary/[0.03] border-t border-border mt-auto">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-primary/20 p-1.5 rounded-full">
                                        <PlusCircle className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-primary">Conditions Particulières</h3>
                                </div>
                                <Textarea
                                    value={customClause}
                                    onChange={(e) => setCustomClause(e.target.value)}
                                    placeholder="Ex: Entretien de la piscine à la charge du locataire..."
                                    className="h-32 bg-card border-border text-foreground placeholder:text-muted-foreground w-full text-base p-4 focus:ring-1 focus:ring-primary/20 rounded-xl shadow-sm border-0 ring-1 ring-border"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-border bg-background shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                    {mode === 'standard' ? (
                        <>
                            <div className="sm:mr-auto mb-2 sm:mb-0">
                                <Button variant="outline" onClick={() => setMode('custom')} className="w-full sm:w-auto border-border text-muted-foreground hover:bg-muted h-12 rounded-xl font-semibold px-6">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Personnaliser
                                </Button>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-bold px-10 shadow-lg shadow-primary/20">
                                {loading ? "Création..." : "Générer Standard"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="sm:mr-auto flex flex-col sm:flex-row gap-3">
                                <Button variant="ghost" onClick={handlePreview} disabled={loading} className="w-full sm:w-auto text-primary hover:text-primary/80 hover:bg-primary/10 h-12 rounded-xl font-bold px-6">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Aperçu Final
                                </Button>
                                <Button variant="outline" onClick={() => setMode('standard')} className="w-full sm:w-auto border-border text-muted-foreground hover:bg-muted h-12 rounded-xl px-6">Annuler</Button>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-bold px-10 shadow-lg shadow-primary/20">
                                {loading ? "Création..." : "Valider et Générer"}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
