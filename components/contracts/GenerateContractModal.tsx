'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DEFAULT_CONTRACT_TEXTS, ContractTexts } from '@/lib/contract-defaults';
import { generateLeaseContract } from '@/lib/actions/contract-actions';
import { toast } from "sonner";


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
            <DialogContent className={mode === 'custom' ? "w-[95vw] sm:w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border text-foreground" : "w-[95vw] sm:w-full sm:max-w-md bg-card border-border text-foreground"}>
                <DialogHeader>
                    <DialogTitle>
                        Générer le Contrat de Bail {tenantName ? `- ${tenantName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'standard' ? (
                    <div className="space-y-4 py-4">
                        <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm text-muted-foreground">
                            <p className="font-medium mb-2 text-foreground">Génération Standard (Recommandé)</p>
                            <p className="mb-3">Le contrat sera généré avec les clauses juridiques standards conformes au droit sénégalais (COCC / Loi 2014) et les décrets 2023.</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePreview}
                                disabled={loading}
                                className="bg-muted hover:bg-muted/80 text-foreground h-8 text-xs w-full sm:w-auto"
                            >
                                <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Prévisualiser le modèle
                            </Button>
                        </div>

                        <div className="bg-primary/5 p-3 rounded border border-primary/10 flex items-start gap-3">
                            <div className="mt-1 bg-primary/10 text-primary rounded-full p-1 shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                            </div>
                            <div className="text-xs text-muted-foreground min-w-0 break-words">
                                <span className="font-semibold text-primary">Option Avancée :</span> Vous avez besoin d&apos;ajouter une clause spécifique (piscine, jardin) ou de modifier un article ? Passez en mode personnalisation.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* SECTION 1 : Articles Standards */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border pb-2">
                                <h3 className="font-semibold text-foreground">Clauses Standards</h3>
                                <Button variant="ghost" size="sm" onClick={() => setMode('standard')} className="text-xs h-7 text-muted-foreground hover:text-foreground hover:bg-muted">Retour au Standard</Button>
                            </div>

                            <div className="grid gap-8">
                                {(Object.keys(DEFAULT_CONTRACT_TEXTS) as Array<keyof typeof DEFAULT_CONTRACT_TEXTS>).map((key) => {
                                    const label = key.replace(/_/g, ' ').replace('article', 'Article').replace(/\d+/, (match) => match + ' :');
                                    return (
                                        <div key={key} className="space-y-6">
                                            <Label className="text-muted-foreground capitalize text-base font-medium">{label}</Label>
                                            <Textarea
                                                value={texts[key] ?? DEFAULT_CONTRACT_TEXTS[key]}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                className="min-h-[100px] resize-y bg-muted/30 border-border text-foreground focus:ring-primary placeholder:text-muted-foreground w-full"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 2 : Clauses Particulières */}
                        <div className="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-semibold text-primary">Conditions Particulières (Ajout)</h3>
                            <p className="text-xs text-muted-foreground">
                                Ajoutez ici des règles spécifiques (ex: Jardin, Piscine, Animaux interdits, Interdiction de fumer...).
                            </p>
                            <Textarea
                                value={customClause}
                                onChange={(e) => setCustomClause(e.target.value)}
                                placeholder="Ex: Le locataire s'engage à entretenir la piscine..."
                                className="h-32 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground w-full"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    {mode === 'standard' ? (
                        <>
                            <div className="mr-auto">
                                <Button variant="outline" onClick={() => setMode('custom')} className="border-border text-muted-foreground hover:bg-muted">Personnaliser</Button>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {loading ? "Traitement..." : "Générer Standard"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mr-auto">
                                <Button variant="ghost" onClick={handlePreview} disabled={loading} className="text-primary hover:text-primary/80 hover:bg-primary/10">
                                    Prévisualiser les modifications
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setMode('standard')} className="border-border text-muted-foreground hover:bg-muted">Annuler</Button>
                            <Button onClick={handleGenerate} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {loading ? "Traitement..." : "Valider et Générer"}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
