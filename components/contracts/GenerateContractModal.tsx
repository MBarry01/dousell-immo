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
    children: React.ReactNode;
}

export function GenerateContractModal({ leaseId, tenantName, onSuccess, children }: GenerateContractModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'standard' | 'custom'>('standard');

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
                link.download = `Contrat_Bail_${tenantName?.replace(/\s+/g, '_') || 'Brouillon'}.pdf`;
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
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className={mode === 'custom' ? "w-[95vw] sm:w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100" : "w-[95vw] sm:w-full sm:max-w-md bg-slate-900 border-slate-800 text-slate-100"}>
                <DialogHeader>
                    <DialogTitle className="text-slate-100">
                        Générer le Contrat de Bail {tenantName ? `- ${tenantName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                {mode === 'standard' ? (
                    <div className="space-y-4 py-4">
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-sm text-slate-300">
                            <p className="font-medium mb-2 text-white">Génération Standard (Recommandé)</p>
                            <p className="mb-3">Le contrat sera généré avec les clauses juridiques standards conformes au droit sénégalais (COCC / Loi 2014) et les décrets 2023.</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handlePreview}
                                disabled={loading}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-100 h-8 text-xs w-full sm:w-auto"
                            >
                                <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Prévisualiser le modèle
                            </Button>
                        </div>

                        <div className="bg-blue-950/20 p-3 rounded border border-blue-900/30 flex items-start gap-3">
                            <div className="mt-1 bg-blue-900/30 text-blue-400 rounded-full p-1 shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                            </div>
                            <div className="text-xs text-slate-400 min-w-0 break-words">
                                <span className="font-semibold text-blue-400">Option Avancée :</span> Vous avez besoin d'ajouter une clause spécifique (piscine, jardin) ou de modifier un article ? Passez en mode personnalisation.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* SECTION 1 : Articles Standards */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                <h3 className="font-semibold text-slate-200">Clauses Standards</h3>
                                <Button variant="ghost" size="sm" onClick={() => setMode('standard')} className="text-xs h-7 text-slate-400 hover:text-white hover:bg-slate-800">Retour au Standard</Button>
                            </div>

                            <div className="grid gap-4">
                                {(Object.keys(DEFAULT_CONTRACT_TEXTS) as Array<keyof typeof DEFAULT_CONTRACT_TEXTS>).map((key) => {
                                    const label = key.replace(/_/g, ' ').replace('article', 'Article').replace(/\d+/, (match) => match + ' :');
                                    return (
                                        <div key={key} className="space-y-2">
                                            <Label className="text-slate-300 capitalize">{label}</Label>
                                            <Textarea
                                                value={texts[key] ?? DEFAULT_CONTRACT_TEXTS[key]}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                className="min-h-[100px] resize-y bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500 placeholder:text-slate-500 w-full"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 2 : Clauses Particulières */}
                        <div className="space-y-4 bg-blue-950/20 p-4 rounded-lg border border-blue-900/30">
                            <h3 className="font-semibold text-blue-400">Conditions Particulières (Ajout)</h3>
                            <p className="text-xs text-blue-300">
                                Ajoutez ici des règles spécifiques (ex: Jardin, Piscine, Animaux interdits, Interdiction de fumer...).
                            </p>
                            <Textarea
                                value={customClause}
                                onChange={(e) => setCustomClause(e.target.value)}
                                placeholder="Ex: Le locataire s'engage à entretenir la piscine..."
                                className="h-32 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 w-full"
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    {mode === 'standard' ? (
                        <>
                            <div className="mr-auto">
                                <Button variant="outline" onClick={() => setMode('custom')} className="border-slate-700 text-slate-300 hover:bg-slate-800">Personnaliser</Button>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading} className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90">
                                {loading ? "Traitement..." : "Générer Standard"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mr-auto">
                                <Button variant="ghost" onClick={handlePreview} disabled={loading} className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30">
                                    Prévisualiser les modifications
                                </Button>
                            </div>
                            <Button variant="outline" onClick={() => setMode('standard')} className="border-slate-700 text-slate-300 hover:bg-slate-800">Annuler</Button>
                            <Button onClick={handleGenerate} disabled={loading} className="bg-[#F4C430] text-black hover:bg-[#F4C430]/90">
                                {loading ? "Traitement..." : "Valider et Générer"}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
