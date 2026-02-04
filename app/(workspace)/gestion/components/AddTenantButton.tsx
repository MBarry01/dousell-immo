"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, ChevronDown, Upload, User, FileSpreadsheet, X, AlertCircle, ShieldCheck, Mail, Wallet, FileText, Check, ArrowRight, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { createNewLease, confirmPayment, sendWelcomePack } from "../actions";
import { UpgradeModal } from "@/components/gestion/UpgradeModal";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { GenerateContractModal } from '@/components/contracts/GenerateContractModal';
import { generateLeaseContract } from '@/lib/actions/contract-actions';
import { getPremiumBranding } from '../config/actions';
import confetti from 'canvas-confetti';
import { PropertySelector } from './PropertySelector';
import { type VacantProperty, getAllTeamProperties } from '../actions/property-selector';
import { fuzzyMatchProperty } from '../utils/property-matching';

interface AddTenantButtonProps {
    ownerId: string;
    trigger?: React.ReactNode;
    profile?: any; // To allow flexibility with Supabase types
    initialData?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        amount?: number;
        day?: number;
        startDate?: string;
        endDate?: string;
    };
}

const FIRST_TENANT_KEY = 'dousell_first_tenant_created';

export function AddTenantButton({ ownerId, trigger, initialData, profile }: AddTenantButtonProps) {
    const [open, setOpen] = useState(false);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProfileAlert, setShowProfileAlert] = useState(false);

    const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Contract Generation Flow State
    const [showContractPrompt, setShowContractPrompt] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    const [createdLease, setCreatedLease] = useState<{ id: string, name: string, amount: number, depositMonths: number } | null>(null);

    const router = useRouter();

    // Controlled state for rent amount to allow auto-fill
    const [rentAmount, setRentAmount] = useState<string | number>(initialData?.amount || '');

    // Reset rent amount when opening/closing
    useEffect(() => {
        if (open && initialData?.amount) setRentAmount(initialData.amount);
    }, [open, initialData]);

    // Confetti celebration for first tenant creation - Golden luxury effect (Desktop optimized)
    const triggerConfetti = useCallback(() => {
        // Palette dorée luxe
        const goldColors = [
            '#F4C430', // Or Dousell (primary)
            '#FFD700', // Or pur
            '#DAA520', // Goldenrod
            '#B8860B', // Dark goldenrod
            '#FFC107', // Amber
            '#FFECB3', // Or clair / champagne
        ];

        // Détection desktop pour ajuster l'intensité
        const isDesktop = window.innerWidth >= 1024;
        const particleMultiplier = isDesktop ? 1.5 : 1;

        // Burst initial central - plus large sur desktop
        confetti({
            particleCount: Math.floor(120 * particleMultiplier),
            spread: isDesktop ? 100 : 70,
            origin: { y: 0.6, x: 0.5 },
            colors: goldColors,
            shapes: ['circle', 'square'],
            scalar: isDesktop ? 1.4 : 1.2,
            gravity: 0.8,
            ticks: 350,
            drift: 0,
        });

        // Bursts supplémentaires sur desktop (gauche et droite)
        if (isDesktop) {
            setTimeout(() => {
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.7, x: 0.25 },
                    colors: goldColors,
                    shapes: ['circle'],
                    scalar: 1.2,
                    gravity: 0.9,
                });
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.7, x: 0.75 },
                    colors: goldColors,
                    shapes: ['circle'],
                    scalar: 1.2,
                    gravity: 0.9,
                });
            }, 200);
        }

        // Canons latéraux dorés
        const duration = isDesktop ? 3000 : 2500;
        const end = Date.now() + duration;

        const frame = () => {
            // Canon gauche
            confetti({
                particleCount: isDesktop ? 3 : 2,
                angle: 60,
                spread: 50,
                origin: { x: 0, y: 0.65 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.1 : 0.9,
                gravity: 1,
            });
            // Canon droit
            confetti({
                particleCount: isDesktop ? 3 : 2,
                angle: 120,
                spread: 50,
                origin: { x: 1, y: 0.65 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.1 : 0.9,
                gravity: 1,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Burst final après 1.5s - Grand finale
        setTimeout(() => {
            confetti({
                particleCount: Math.floor(80 * particleMultiplier),
                spread: isDesktop ? 140 : 100,
                origin: { y: 0.5, x: 0.5 },
                colors: goldColors,
                shapes: ['circle'],
                scalar: isDesktop ? 1.8 : 1.5,
                gravity: 0.5,
                ticks: 250,
            });
        }, 1500);
    }, []);

    const handleTriggerClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Check if profile has minimal information (just company name is enough) via props (optimistic)
        const isProfileComplete = profile && (profile.full_name || profile.company_name);

        if (isProfileComplete) {
            setOpen(true);
            return;
        }

        // 2. If prop check fails, double check with server action (bypasses cache)
        const toastId = toast.loading("Vérification du profil...");
        try {
            const result = await getPremiumBranding();
            toast.dismiss(toastId);

            if (result.success && result.data) {
                const fresh = result.data;
                if (fresh.full_name || fresh.company_name) {
                    setOpen(true);
                    return;
                }
            }
        } catch (err) {
            console.error("Error checking profile", err);
            toast.dismiss(toastId);
        }

        setShowProfileAlert(true);
    };

    const renderTrigger = () => {
        // ... existing renderTrigger 
        if (trigger) {
            if (React.isValidElement(trigger)) {
                return React.cloneElement(trigger as React.ReactElement<any>, {
                    onClick: (e: React.MouseEvent) => {
                        const childProps = (trigger as React.ReactElement<any>).props;
                        if (childProps.onClick) childProps.onClick(e);
                        handleTriggerClick(e);
                    }
                });
            }
            return <span onClick={handleTriggerClick} className="cursor-pointer">{trigger}</span>;
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-9 px-2 sm:px-4 font-medium text-sm transition-all shadow-sm">
                        <Plus className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Ajouter</span>
                        <ChevronDown className="w-3 h-3 ml-1 sm:ml-2 opacity-70" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border min-w-[200px] p-1 shadow-lg">
                    <DropdownMenuItem
                        onClick={handleTriggerClick}
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                    >
                        <User className="w-4 h-4" />
                        <span>Ajouter un locataire</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setBulkImportOpen(true)}
                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent focus:bg-accent focus:text-accent-foreground"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Ajouter en masse</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // ... existing handleSubmit
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const tenantNameVal = formData.get('tenant_name') as string;
        const monthlyAmount = Number(formData.get('monthly_amount'));
        const depositMonths = Number(formData.get('deposit_months')) || 2;

        // Note: property_id and other hidden fields from PropertySelector are automatically in formData

        // ... rest of logic
        const data = {
            owner_id: ownerId,
            tenant_name: tenantNameVal,
            tenant_phone: formData.get('tenant_phone') as string,
            tenant_email: formData.get('tenant_email') as string,
            property_address: formData.get('property_address') as string, // Will be filled by hidden input from PropertySelector
            property_id: formData.get('property_id') as string, // Will be filled by hidden input from PropertySelector
            monthly_amount: monthlyAmount,
            billing_day: Number(formData.get('billing_day')) || 5,
            start_date: formData.get('start_date') as string,
            end_date: formData.get('end_date') as string || null,
            status: 'active' as const,
            deposit_months: depositMonths,
            create_new_property: formData.get('create_new_property'),
            new_property_title: formData.get('new_property_title'),
            new_property_address: formData.get('new_property_address'),
            new_property_price: formData.get('new_property_price'),
        };

        const result = await createNewLease(data);
        // ... rest of function
        setLoading(false);

        if (result.success && result.id) {
            // ... (rest of success logic)
            const isFirstTenant = !localStorage.getItem(FIRST_TENANT_KEY);
            if (isFirstTenant) {
                localStorage.setItem(FIRST_TENANT_KEY, 'true');
                triggerConfetti();
            }
            toast.success('Locataire créé ! Place à la configuration...');

            setCreatedLease({
                id: result.id,
                name: tenantNameVal,
                amount: monthlyAmount,
                depositMonths: depositMonths
            });
            setOpen(false);

            setTimeout(() => {
                setShowOnboardingWizard(true);
            }, 100);

            router.refresh();
        } else {
            if (result.upgradeRequired) {
                setShowUpgradeModal(true);
            }
            const errorMsg = result.error || 'Erreur lors de la création';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <>
            {renderTrigger()}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="z-[100] fixed top-[4%] left-[50%] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] w-[90vw] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden bg-card border-border text-foreground px-4 pt-4 pb-24 sm:p-6 outline-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-foreground">
                            {initialData ? "Nouveau Bail (Démo)" : "Nouveau Bail"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {initialData ? "Ces données sont pré-remplies pour tester la création." : "Remplissez les informations pour créer un nouveau bail"}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        {/* Zone d'erreur critique */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                                <span className="text-red-500 mt-0.5">⚠️</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-destructive">Erreur Bloquante</h4>
                                    <p className="text-sm text-destructive/90">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">
                                    Nom complet <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="tenant_name"
                                    placeholder="ex: Amadou Ndiaye"
                                    defaultValue={initialData?.name}
                                    required
                                    className="bg-transparent border-border text-foreground focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Téléphone</label>
                                <Input
                                    name="tenant_phone"
                                    placeholder="ex: +221 77..."
                                    defaultValue={initialData?.phone}
                                    className="bg-transparent border-border text-foreground focus-visible:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80">
                                Email <span className="text-destructive">*</span>
                                <span className="text-xs text-muted-foreground ml-2">(pour l&apos;envoi des quittances)</span>
                            </label>
                            <Input
                                name="tenant_email"
                                type="email"
                                placeholder="ex: locataire@email.com"
                                defaultValue={initialData?.email}
                                required
                                className="bg-transparent border-border text-foreground focus-visible:ring-primary"
                            />
                        </div>

                        {/* REPLACED ADDRESS INPUT WITH PROPERTY SELECTOR */}
                        <PropertySelector
                            onPropertySelect={(property) => {
                                if (property) {
                                    setRentAmount(property.price);
                                }
                            }}
                            onCreateNew={(newProp) => {
                                setRentAmount(newProp.price);
                            }}
                            defaultAddress={initialData?.address}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">
                                    Loyer (FCFA) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="monthly_amount"
                                    type="number"
                                    placeholder="500000"
                                    value={rentAmount}
                                    onChange={(e) => setRentAmount(e.target.value)}
                                    required
                                    className="bg-transparent border-border text-foreground font-mono focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Jour de paiement</label>
                                <Input
                                    name="billing_day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    defaultValue={initialData?.day || 5}
                                    className="bg-transparent border-border text-foreground focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">
                                    Début bail <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    name="start_date"
                                    type="date"
                                    defaultValue={initialData?.startDate}
                                    required
                                    className="bg-transparent border-border text-foreground h-10 w-full px-3 block focus-visible:ring-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1 dark:[&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80">
                                Fin bail <span className="text-destructive">*</span>
                                <span className="text-xs text-muted-foreground ml-2">(pour les alertes juridiques J-180 et J-90)</span>
                            </label>
                            <Input
                                name="end_date"
                                type="date"
                                defaultValue={initialData?.endDate}
                                required
                                className="bg-transparent border-border text-foreground h-10 w-full px-3 block focus-visible:ring-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:p-1 dark:[&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>

                        {/* Caution Field */}
                        <div className="bg-muted/30 p-3 rounded-lg border border-border">
                            <label className="text-sm font-medium text-foreground/80 flex justify-between">
                                <span>Mois de caution</span>
                                <span className="text-xs text-primary">Recommandé: 2 mois</span>
                            </label>
                            <div className="flex gap-2 mt-2">
                                {[1, 2, 3].map((m) => (
                                    <label key={m} className="flex-1 cursor-pointer">
                                        <input type="radio" name="deposit_months" value={m} className="peer hidden" defaultChecked={m === 2} />
                                        <div className="h-9 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary peer-checked:font-bold transition-all text-sm">
                                            {m} Mois
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base font-semibold rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Création en cours...</span>
                                    </div>
                                ) : (
                                    "Confirmer & Créer le Bail"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog >

            {/* PROMPT: Generate Contract? */}
            <Dialog open={showContractPrompt} onOpenChange={setShowContractPrompt}>
                <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Générer le contrat de bail ?</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Le locataire a été créé avec succès. Souhaitez-vous générer et personnaliser le contrat de bail maintenant ?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowContractPrompt(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Non, plus tard
                        </Button>
                        <Button
                            onClick={() => {
                                setShowContractPrompt(false);
                                // Small delay to prevent body scroll locking issues between modals
                                setTimeout(() => setShowContractModal(true), 150);
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Oui, générer le contrat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL: Generate Contract */}
            {
                createdLease && (
                    <GenerateContractModal
                        leaseId={createdLease.id}
                        tenantName={createdLease.name}
                        open={showContractModal}
                        onOpenChange={setShowContractModal}
                        onSuccess={() => {
                            // Contract generated successfully
                            setShowContractModal(false);
                        }}
                    />
                )
            }
            {/* ALERT: Profile Incomplete */}
            <Dialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
                <DialogContent className="sm:max-w-md bg-card border-destructive/50 text-foreground shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <span>⚠️ Profil Incomplet</span>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-2">
                            Pour créer des baux valides, vous devez d&apos;abord renseigner votre nom ou raison sociale dans la configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowProfileAlert(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Annuler
                        </Button>

                        <Button
                            onClick={() => router.push('/gestion/config')}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Compléter mon profil
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* BULK IMPORT DIALOG */}
            <BulkImportDialog
                open={bulkImportOpen}
                onOpenChange={setBulkImportOpen}
                ownerId={ownerId}
                onSuccess={() => {
                    setBulkImportOpen(false);
                    router.refresh();
                }}
            />

            {/* ONBOARDING WIZARD */}
            <TenantOnboardingWizard
                open={showOnboardingWizard}
                onOpenChange={setShowOnboardingWizard}
                leaseData={createdLease}
                profile={profile}
                onComplete={() => {
                    setShowOnboardingWizard(false);
                    // Force full page reload with cache bypass to show updated data
                    // Using location.href instead of reload() to ensure fresh fetch
                    window.location.href = window.location.pathname + '?t=' + Date.now();
                }}
            />
            {/* Upgrade Modal */}
            <UpgradeModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                propertiesCount={10}
            />
        </>
    );
}


// --- ONBOARDING WIZARD COMPONENT ---

function TenantOnboardingWizard({ open, onOpenChange, leaseData, profile, onComplete }: any) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [contractGenerated, setContractGenerated] = useState(false);

    // State for Step 1 - Par défaut les deux sont cochés (cas d'usage standard)
    const [stats, setStats] = useState({ rentPaid: true, depositPaid: true });

    // IMPORTANT: Reset wizard state when dialog opens
    useEffect(() => {
        if (open) {
            console.log("[Wizard] Dialog opened - resetting states");
            setStep(1);
            setContractGenerated(false);
            // Par défaut les deux sont cochés (caution + premier loyer = cas standard)
            setStats({ rentPaid: true, depositPaid: true });
            setLoading(false);
        }
    }, [open]);

    if (!leaseData) return null;

    const totalDeposit = leaseData.amount * leaseData.depositMonths;
    const totalRent = leaseData.amount;
    const grandTotal = totalDeposit + totalRent;

    // Confirm payments using server action (properly invalidates cache)
    const handleConfirmPayments = async () => {
        // Vérifier qu'au moins une case est cochée
        if (!stats.depositPaid && !stats.rentPaid) {
            toast.error("Veuillez cocher au moins un paiement à valider");
            return;
        }

        setLoading(true);
        console.log("[Wizard] handleConfirmPayments called - depositPaid:", stats.depositPaid, "rentPaid:", stats.rentPaid);
        try {
            // Use the server action confirmPayment with silent=true to skip individual emails
            // (all documents will be sent together in the welcome pack)
            if (stats.depositPaid) {
                console.log("[Wizard] Confirming deposit payment for lease:", leaseData.id);
                const result = await confirmPayment(leaseData.id, undefined, 0, new Date().getFullYear(), true);
                console.log("[Wizard] Deposit confirmation result:", result);
                if (!result.success) {
                    toast.error(`Erreur caution: ${result.error}`);
                }
            }

            if (stats.rentPaid) {
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                console.log("[Wizard] Confirming rent payment for lease:", leaseData.id, "month:", currentMonth, "year:", currentYear);
                const result = await confirmPayment(leaseData.id, undefined, currentMonth, currentYear, true);
                console.log("[Wizard] Rent confirmation result:", result);
                if (!result.success) {
                    toast.error(`Erreur loyer: ${result.error}`);
                }
            }

            // Forcer l'invalidation du cache via l'API pour s'assurer que les données sont fraîches
            try {
                await fetch('/api/clear-cache', { method: 'DELETE' });
                console.log("[Wizard] Cache cleared via API");
            } catch (cacheErr) {
                console.warn("[Wizard] Cache clear failed (non-blocking):", cacheErr);
            }

            console.log("[Wizard] Moving to step 2");
            setStep(2);
        } catch (e) {
            console.error("[Wizard] Error in handleConfirmPayments:", e);
            toast.error("Erreur lors de l'encaissement");
        } finally {
            setLoading(false);
        }
    };

    // Generate contract and then send pack
    const handleGenerateAndSendPack = async () => {
        setLoading(true);
        console.log("[Wizard] handleGenerateAndSendPack called - contractGenerated:", contractGenerated);
        try {
            // Step 1: Generate contract if not done
            if (!contractGenerated) {
                console.log("[Wizard] Generating contract for lease:", leaseData.id);
                toast.loading("Génération du contrat...", { id: 'contract' });
                const contractResult = await generateLeaseContract({ leaseId: leaseData.id });
                console.log("[Wizard] Contract generation result:", contractResult);
                if (contractResult.success) {
                    setContractGenerated(true);
                    toast.success("Contrat généré !", { id: 'contract' });
                    // Small delay to ensure DB is updated before sendWelcomePack fetches the lease
                    console.log("[Wizard] Waiting 500ms for DB to update...");
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.error("[Wizard] Contract generation failed:", contractResult.error);
                    toast.error(contractResult.error || "Erreur génération contrat", { id: 'contract' });
                    // Continue anyway - pack can be sent without contract
                }
            }

            // Step 2: Send welcome pack (with contract attached if available)
            console.log("[Wizard] Sending welcome pack for lease:", leaseData.id);
            toast.loading("Envoi du pack de bienvenue...", { id: 'pack' });
            const packResult = await sendWelcomePack(leaseData.id);
            console.log("[Wizard] Welcome pack result:", packResult);
            toast.success("Pack de bienvenue envoyé ! 🎉", { id: 'pack' });
            onComplete();
        } catch (e) {
            console.error("[Wizard] Error in handleGenerateAndSendPack:", e);
            toast.error("Erreur lors de l'envoi", { id: 'pack' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onComplete()}>
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 overflow-hidden mb-safe shadow-2xl">
                <DialogTitle className="sr-only">Assistant de Démarrage Locataire</DialogTitle>
                <DialogDescription className="sr-only">
                    Finalisez l&apos;entrée de votre nouveau locataire en confirmant les paiements et en envoyant le pack de bienvenue.
                </DialogDescription>
                <div className="bg-primary p-6 text-primary-foreground">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        Assistant de Démarrage
                    </h2>
                    <p className="opacity-90 text-sm mt-1">Finalisons l&apos;entrée de votre locataire {leaseData.name}</p>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between border border-border">
                                <div>
                                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Total à encaisser</p>
                                    <p className="text-3xl font-bold text-primary">{grandTotal.toLocaleString()} FCFA</p>
                                </div>
                                <Wallet className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-3">
                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${stats.depositPaid ? 'border-primary bg-primary/10' : 'border-border hover:border-accent'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${stats.depositPaid ? 'border-primary bg-primary' : 'border-muted-foreground/50'}`}>
                                        {stats.depositPaid && <Check className="w-4 h-4 text-primary-foreground" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={stats.depositPaid} onChange={(e) => setStats({ ...stats, depositPaid: e.target.checked })} />
                                    <div className="flex-1">
                                        <div className="font-semibold text-foreground">Caution ({leaseData.depositMonths} mois)</div>
                                        <div className="text-sm text-muted-foreground">Garantie locative</div>
                                    </div>
                                    <div className="font-mono font-bold text-lg">{totalDeposit.toLocaleString()}</div>
                                </label>

                                <label className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${stats.rentPaid ? 'border-primary bg-primary/10' : 'border-border hover:border-accent'}`}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${stats.rentPaid ? 'border-primary bg-primary' : 'border-muted-foreground/50'}`}>
                                        {stats.rentPaid && <Check className="w-4 h-4 text-primary-foreground" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={stats.rentPaid} onChange={(e) => setStats({ ...stats, rentPaid: e.target.checked })} />
                                    <div className="flex-1">
                                        <div className="font-semibold text-foreground">Premier Loyer</div>
                                        <div className="text-sm text-muted-foreground">Mois en cours</div>
                                    </div>
                                    <div className="font-mono font-bold text-lg">{totalRent.toLocaleString()}</div>
                                </label>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button onClick={handleConfirmPayments} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 text-lg shadow-md">
                                    {loading ? <Loader2 className="animate-spin" /> : "Valider les Encaissements"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onComplete}
                                    disabled={loading}
                                    className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Passer (encaisser plus tard)
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 text-center py-4">
                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10" />
                            </div>

                            <h3 className="text-2xl font-bold text-foreground">Paiements enregistrés !</h3>
                            <p className="text-muted-foreground text-lg">Un seul email sera envoyé avec tous les documents.</p>

                            <div className="bg-muted p-6 rounded-xl text-left space-y-4 border border-border">
                                <h4 className="font-semibold text-foreground border-b border-border pb-2 mb-2">Le Pack de Bienvenue inclura :</h4>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <FileText className="w-5 h-5 text-primary" /> Contrat de Bail (PDF)
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Mail className="w-5 h-5 text-primary" /> Lien d&apos;accès à l&apos;Espace Locataire
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <FileText className="w-5 h-5 text-primary" /> Récapitulatif du bail et des paiements
                                </div>
                            </div>

                            <div className="pt-2 space-y-3">
                                <Button onClick={handleGenerateAndSendPack} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 text-lg shadow-md">
                                    {loading ? <Loader2 className="animate-spin" /> : "Générer & Envoyer le Pack 🚀"}
                                </Button>
                                <Button variant="ghost" onClick={onComplete} className="w-full text-muted-foreground hover:text-foreground">
                                    Passer (envoyer manuellement plus tard)
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- BULK IMPORT DIALOG COMPONENT ---

interface BulkImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ownerId: string;
    onSuccess: () => void;
}

interface ParsedTenant {
    nom: string;
    email: string;
    telephone?: string;
    adresse: string;
    loyer: number;
    jour_paiement?: number;
    date_debut: string;
    date_fin?: string;
    mois_caution?: number;
    error?: string;
    // Auto-matching
    property_name?: string;
    matched_property_id?: string;
    matched_property_title?: string;
    // Auto-création de bien
    will_create_property?: boolean; // true = bien sera créé automatiquement
}

function BulkImportDialog({ open, onOpenChange, ownerId, onSuccess }: BulkImportDialogProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Upload, 2=Mapping, 3=Review
    const [rawData, setRawData] = useState<Record<string, any>[]>([]);
    const [csvColumns, setCsvColumns] = useState<string[]>([]);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [parsedData, setParsedData] = useState<ParsedTenant[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-matching: tous les biens de l'équipe
    const [teamProperties, setTeamProperties] = useState<VacantProperty[]>([]);
    const [orphanCount, setOrphanCount] = useState(0);

    // System fields that can be mapped
    const SYSTEM_FIELDS = [
        { key: 'nom', label: 'Locataire (Nom)', required: true },
        { key: 'email', label: 'Email', required: true },
        { key: 'property_name', label: 'Nom du Bien (auto-matching)', required: false, hint: 'Si trouvé → lié automatiquement' },
        { key: 'adresse', label: 'Adresse (fallback)', required: false, hint: 'Utilisé si bien non trouvé' },
        { key: 'loyer', label: 'Loyer (Montant)', required: true },
        { key: 'telephone', label: 'Téléphone', required: false },
        { key: 'date_debut', label: 'Date de début', required: false },
        { key: 'date_fin', label: 'Date de fin', required: false },
        { key: 'jour_paiement', label: 'Jour de paiement', required: false },
        { key: 'mois_caution', label: 'Mois de caution', required: false },
    ];

    // Reset state when dialog closes, load properties when opens
    useEffect(() => {
        if (!open) {
            setStep(1);
            setRawData([]);
            setCsvColumns([]);
            setColumnMappings({});
            setParsedData([]);
            setFileName('');
            setErrors([]);
            setImportProgress(0);
            setOrphanCount(0);
        } else {
            // Charger tous les biens de l'équipe pour l'auto-matching
            getAllTeamProperties().then((result) => {
                if (result.success && result.data) {
                    setTeamProperties(result.data);
                }
            });
        }
    }, [open]);

    // Step 1: Parse CSV and extract columns
    const parseFile = async (file: File) => {
        setErrors([]);
        setFileName(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet);

            if (jsonData.length === 0) {
                setErrors(['Le fichier est vide ou ne contient pas de données valides.']);
                return;
            }

            // Extract column names from first row
            const columns = Object.keys(jsonData[0]);
            setCsvColumns(columns);
            setRawData(jsonData);

            // Auto-suggest mappings based on column names
            const autoMappings: Record<string, string> = {};
            const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            columns.forEach(col => {
                const normCol = normalize(col);
                // Check for matches
                if (['locataire', 'nom', 'name', 'tenant'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'nom';
                } else if (['email', 'mail', 'courriel'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'email';
                } else if (['bien', 'adresse', 'address', 'logement', 'appartement'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'adresse';
                } else if (['loyer', 'montant', 'rent', 'prix', 'amount', 'fcfa'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'loyer';
                } else if (['telephone', 'phone', 'tel', 'mobile'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'telephone';
                } else if (['date_debut', 'debut', 'start'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'date_debut';
                } else if (['date_fin', 'fin', 'end'].some(k => normCol.includes(k))) {
                    autoMappings[col] = 'date_fin';
                }
            });

            setColumnMappings(autoMappings);
            setStep(2); // Go to mapping step
        } catch (err) {
            console.error('Error parsing file:', err);
            setErrors(['Erreur lors de la lecture du fichier. Vérifiez le format.']);
        }
    };

    // Step 2: Apply mappings and validate with AUTO-MATCHING
    const applyMappings = () => {
        const today = new Date().toISOString().split('T')[0];
        let orphans = 0;

        const mapped: ParsedTenant[] = rawData.map((row, index) => {
            // Find which CSV column maps to which system field
            const getValue = (systemField: string): any => {
                const csvCol = Object.entries(columnMappings).find(([, v]) => v === systemField)?.[0];
                return csvCol ? row[csvCol] : undefined;
            };

            // Format date helper
            const formatDate = (value: any): string => {
                if (!value) return '';
                const strVal = String(value).trim();

                // DD/MM/YYYY
                const dmyMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (dmyMatch) {
                    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
                }
                // YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return strVal;
                // French months
                const months: Record<string, string> = {
                    'janvier': '01', 'jan': '01', 'février': '02', 'fevrier': '02', 'mars': '03',
                    'avril': '04', 'mai': '05', 'juin': '06', 'juillet': '07', 'juil': '07',
                    'août': '08', 'aout': '08', 'septembre': '09', 'sept': '09', 'octobre': '10',
                    'novembre': '11', 'décembre': '12', 'decembre': '12'
                };
                const lowerVal = strVal.toLowerCase();
                for (const [monthName, monthNum] of Object.entries(months)) {
                    if (lowerVal.includes(monthName)) {
                        const yearMatch = lowerVal.match(/\d{4}/);
                        if (yearMatch) return `${yearMatch[0]}-${monthNum}-01`;
                    }
                }
                return '';
            };

            const nom = String(getValue('nom') || '').trim();
            const email = String(getValue('email') || '').trim();
            const propertyName = String(getValue('property_name') || '').trim();
            const adresse = String(getValue('adresse') || '').trim();
            const loyerRaw = getValue('loyer');
            const loyer = Number(String(loyerRaw || 0).replace(/[^0-9.]/g, ''));

            // 🔍 AUTO-MATCHING : Chercher le bien correspondant
            let matchedPropertyId: string | undefined;
            let matchedPropertyTitle: string | undefined;
            let willCreateProperty = false;

            if (propertyName && teamProperties.length > 0) {
                const matched = fuzzyMatchProperty(propertyName, teamProperties);
                if (matched) {
                    matchedPropertyId = matched.id;
                    matchedPropertyTitle = matched.title;
                }
            }

            // Si pas de match par nom, essayer avec l'adresse
            if (!matchedPropertyId && adresse && teamProperties.length > 0) {
                const matchedByAddress = fuzzyMatchProperty(adresse, teamProperties);
                if (matchedByAddress) {
                    matchedPropertyId = matchedByAddress.id;
                    matchedPropertyTitle = matchedByAddress.title;
                }
            }

            // 🏠 AUTO-CRÉATION : Si pas de match mais nom de bien OU adresse fourni → on le créera
            if (!matchedPropertyId && (propertyName || adresse)) {
                willCreateProperty = true;
                // Utiliser le nom du bien ou l'adresse comme titre du futur bien
                matchedPropertyTitle = propertyName || adresse;
            }

            // Compter les orphelins (vraiment sans bien : rien à créer)
            if (!matchedPropertyId && !willCreateProperty) {
                orphans++;
            }

            // Collect custom fields (unmapped columns)
            const customData: Record<string, any> = {};
            csvColumns.forEach(col => {
                const mapping = columnMappings[col];
                if (mapping === 'custom' || (!mapping && row[col] !== undefined && row[col] !== '')) {
                    customData[col] = row[col];
                }
            });

            const tenant: ParsedTenant & { custom_data?: Record<string, any> } = {
                nom,
                email,
                telephone: String(getValue('telephone') || '').trim() || undefined,
                adresse: adresse || propertyName, // Fallback: utiliser property_name comme adresse
                loyer,
                jour_paiement: Number(getValue('jour_paiement')) || 5,
                date_debut: formatDate(getValue('date_debut')) || today,
                date_fin: formatDate(getValue('date_fin')),
                mois_caution: Number(getValue('mois_caution')) || 2,
                // Auto-matching results
                property_name: propertyName,
                matched_property_id: matchedPropertyId,
                matched_property_title: matchedPropertyTitle,
                // Auto-création
                will_create_property: willCreateProperty,
            };

            // Only add custom_data if there's something
            if (Object.keys(customData).length > 0) {
                (tenant as any).custom_data = customData;
            }

            // Validate - adresse non requise si bien matché ou sera créé
            const missingFields: string[] = [];
            if (!nom) missingFields.push('Locataire');
            if (!email) missingFields.push('Email');
            if (!matchedPropertyId && !willCreateProperty && !adresse) missingFields.push('Bien ou Adresse');
            if (!loyer || loyer <= 0) missingFields.push('Loyer');

            if (missingFields.length > 0) {
                tenant.error = `Ligne ${index + 2}: champs manquants (${missingFields.join(', ')})`;
            }

            return tenant;
        });

        setOrphanCount(orphans);
        setParsedData(mapped);
        setStep(3);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
                parseFile(file);
            } else {
                setErrors(['Format non supporté. Utilisez CSV, XLSX ou XLS.']);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    const handleImport = async () => {
        const validData = parsedData.filter(t => !t.error);
        if (validData.length === 0) {
            toast.error('Aucune donnée valide à importer');
            return;
        }

        setLoading(true);
        setImportProgress(0);
        let successCount = 0;
        let linkedCount = 0;
        let createdCount = 0; // Biens créés automatiquement
        let orphanImportCount = 0;
        const importErrors: string[] = [];

        for (let i = 0; i < validData.length; i++) {
            const tenant = validData[i] as ParsedTenant & { custom_data?: Record<string, any> };
            try {
                // 🏠 Si will_create_property → on crée le bien on-the-fly
                const shouldCreateProperty = tenant.will_create_property && (tenant.property_name || tenant.adresse);

                const result = await createNewLease({
                    owner_id: ownerId,
                    tenant_name: tenant.nom,
                    tenant_phone: tenant.telephone || '',
                    tenant_email: tenant.email,
                    // Si bien existant matché → vide, sinon adresse
                    property_address: tenant.matched_property_id ? '' : (shouldCreateProperty ? '' : tenant.adresse),
                    property_id: tenant.matched_property_id || undefined,
                    monthly_amount: tenant.loyer,
                    billing_day: tenant.jour_paiement || 5,
                    start_date: tenant.date_debut,
                    end_date: tenant.date_fin || null,
                    status: 'active' as const,
                    deposit_months: tenant.mois_caution || 2,
                    custom_data: tenant.custom_data || {},
                    // 🆕 Auto-création de bien
                    ...(shouldCreateProperty && {
                        create_new_property: true,
                        new_property_title: tenant.property_name || tenant.adresse, // Nom ou adresse comme titre
                        new_property_address: tenant.adresse || tenant.property_name,
                        new_property_price: tenant.loyer,
                    }),
                });

                if (result.success) {
                    successCount++;
                    if (tenant.matched_property_id) {
                        linkedCount++;
                    } else if (shouldCreateProperty) {
                        createdCount++;
                    } else {
                        orphanImportCount++;
                    }
                } else {
                    importErrors.push(`${tenant.nom}: ${result.error}`);
                }
            } catch (err) {
                importErrors.push(`${tenant.nom}: Erreur inattendue`);
            }

            setImportProgress(Math.round(((i + 1) / validData.length) * 100));
        }

        setLoading(false);

        if (successCount > 0) {
            const linkedMsg = linkedCount > 0 ? `${linkedCount} liés` : '';
            const createdMsg = createdCount > 0 ? `${createdCount} biens créés` : '';
            const orphanMsg = orphanImportCount > 0 ? `${orphanImportCount} à lier` : '';
            const details = [linkedMsg, createdMsg, orphanMsg].filter(Boolean).join(' • ');
            toast.success(`${successCount} locataire(s) importé(s)${details ? ` (${details})` : ''}`);
        }
        if (importErrors.length > 0) {
            setErrors(importErrors);
        } else {
            onSuccess();
        }
    };

    const validCount = parsedData.filter(t => !t.error).length;
    const errorCount = parsedData.filter(t => t.error).length;

    // Check if required fields are mapped
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(columnMappings);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    const canProceed = missingRequired.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-[100] sm:max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        <FileSpreadsheet className="w-5 h-5 inline-block mr-2" />
                        Importer des locataires en masse
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {step === 1 && "Étape 1/3 : Sélectionnez votre fichier CSV ou Excel"}
                        {step === 2 && "Étape 2/3 : Faites correspondre vos colonnes aux champs système"}
                        {step === 3 && "Étape 3/3 : Vérifiez et importez"}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-accent bg-muted/20'
                            }`}
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium text-foreground">
                            Glissez votre fichier ici
                        </p>
                        <p className="text-sm mt-1 text-muted-foreground">
                            ou cliquez pour sélectionner
                        </p>
                        <p className="text-xs mt-3 text-muted-foreground">
                            Formats acceptés : CSV, XLSX, XLS
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Step 2: Column Mapping */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-5 h-5 text-primary" />
                                <span className="font-medium">{fileName}</span>
                                <span className="text-sm text-muted-foreground">
                                    ({rawData.length} lignes)
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep(1)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted/50 border-border">
                            <p className="text-sm font-medium mb-3 text-foreground">
                                Faites correspondre vos colonnes :
                            </p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {csvColumns.map((col) => (
                                    <div key={col} className="flex items-center gap-3">
                                        <div className="flex-1 px-3 py-2 rounded text-sm font-mono truncate bg-card border border-border">
                                            {col}
                                        </div>
                                        <span className="text-muted-foreground">→</span>
                                        <select
                                            value={columnMappings[col] || ''}
                                            onChange={(e) => setColumnMappings({ ...columnMappings, [col]: e.target.value })}
                                            className="flex-1 px-3 py-2 rounded text-sm bg-card text-foreground border-border"
                                        >
                                            <option value="">-- Ignorer --</option>
                                            {SYSTEM_FIELDS.map(f => (
                                                <option key={f.key} value={f.key}>
                                                    {f.label} {f.required ? '*' : ''}
                                                </option>
                                            ))}
                                            <option value="custom">📦 Champ personnalisé</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Missing required fields warning */}
                        {missingRequired.length > 0 && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-sm text-destructive">
                                        Champs obligatoires non mappés : {missingRequired.map(f => SYSTEM_FIELDS.find(sf => sf.key === f)?.label).join(', ')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <Button variant="ghost" onClick={() => setStep(1)}>
                                Retour
                            </Button>
                            <Button
                                onClick={applyMappings}
                                disabled={!canProceed}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            >
                                Valider le mapping
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Import */}
                {step === 3 && (
                    <div className="space-y-4">
                        {/* Stats avec auto-matching et auto-création */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="p-3 rounded-lg bg-muted/50 border border-border">
                                <p className="text-2xl font-bold text-foreground">{validCount}</p>
                                <p className="text-xs text-muted-foreground">Valides</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                <p className="text-2xl font-bold text-green-600">
                                    {parsedData.filter(t => !t.error && t.matched_property_id).length}
                                </p>
                                <p className="text-xs text-green-700">Liés</p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                <p className="text-2xl font-bold text-primary">
                                    {parsedData.filter(t => !t.error && t.will_create_property).length}
                                </p>
                                <p className="text-xs text-primary">À créer</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                <p className="text-2xl font-bold text-orange-600">{orphanCount}</p>
                                <p className="text-xs text-orange-700">Orphelins</p>
                            </div>
                        </div>

                        {/* Info biens à créer */}
                        {parsedData.filter(t => !t.error && t.will_create_property).length > 0 && (
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-primary" />
                                    <span className="text-sm text-primary">
                                        {parsedData.filter(t => !t.error && t.will_create_property).length} bien(s) seront créés automatiquement et liés aux locataires.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info orphelins */}
                        {orphanCount > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm text-orange-700">
                                        {orphanCount} bail(s) sans bien. Vous pourrez les lier manuellement après.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {(errors.length > 0 || errorCount > 0) && (
                            <div className="p-3 rounded-lg max-h-32 overflow-y-auto bg-destructive/10 border border-destructive/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-sm font-medium text-destructive">Erreurs détectées</span>
                                </div>
                                <ul className="text-xs space-y-1 text-destructive">
                                    {parsedData.filter(t => t.error).slice(0, 10).map((t, i) => (
                                        <li key={i}>• {t.error}</li>
                                    ))}
                                    {errors.map((e, i) => (
                                        <li key={`err-${i}`}>• {e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table avec statut de liaison */}
                        {validCount > 0 && (
                            <div className="border rounded-lg overflow-hidden border-border">
                                <div className="px-3 py-2 text-xs font-medium bg-muted text-muted-foreground">
                                    Aperçu ({Math.min(validCount, 5)} sur {validCount})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50">
                                                <th className="px-3 py-2 text-left font-medium">Locataire</th>
                                                <th className="px-3 py-2 text-left font-medium">Bien</th>
                                                <th className="px-3 py-2 text-right font-medium">Loyer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.filter(t => !t.error).slice(0, 5).map((t, i) => (
                                                <tr key={i} className="border-t border-border">
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium text-foreground">{t.nom}</div>
                                                        <div className="text-xs text-muted-foreground">{t.email}</div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {t.matched_property_id ? (
                                                            // Bien existant trouvé
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                                                                <Check className="w-3 h-3" />
                                                                {t.matched_property_title}
                                                            </span>
                                                        ) : t.will_create_property ? (
                                                            // Bien sera créé automatiquement
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                                <Plus className="w-3 h-3" />
                                                                {t.property_name}
                                                                <span className="text-[10px] opacity-70">(nouveau)</span>
                                                            </span>
                                                        ) : (
                                                            // Orphelin - pas de bien
                                                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                                ⚠ {t.adresse || 'Sans bien'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-foreground">{t.loyer.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Progress bar */}
                        {loading && (
                            <div className="space-y-2">
                                <div className="w-full h-2 rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all duration-300"
                                        style={{ width: `${importProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                    Import en cours... {importProgress}%
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between pt-2">
                            <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>
                                Modifier le mapping
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={validCount === 0 || loading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                Importer {validCount} locataire{validCount > 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Errors display (for Step 1) */}
                {step === 1 && errors.length > 0 && (
                    <ul className="text-sm text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        {errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                )}
            </DialogContent>
        </Dialog>
    );
}

