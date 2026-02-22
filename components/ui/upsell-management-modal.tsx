"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Receipt, BellRing, Wallet, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpsellManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProceed: () => void;
}

export function UpsellManagementModal({
    isOpen,
    onClose,
    onProceed,
}: UpsellManagementModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border bg-card shadow-2xl rounded-2xl [&>button]:z-[60] [&>button]:bg-black/20 [&>button]:text-white hover:[&>button]:bg-black/40 [&>button]:rounded-full [&>button]:top-4 [&>button]:right-4">
                <div className="relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent z-0" />
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

                    <div className="relative z-10 w-full h-32 overflow-hidden bg-black">
                        <img
                            src="/images/bannerUpsell1.png"
                            alt="Gestion Locative"
                            className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 p-6 sm:p-8 pt-6 sm:pt-8 flex flex-col items-center text-center">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center justify-center flex-wrap sm:flex-nowrap">
                            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Félicitations pour votre locataire&nbsp;!</span> <span className="inline-block ml-1">🎉</span>
                        </h2>
                        <p className="text-muted-foreground text-sm mb-8 px-2 leading-relaxed">
                            Maintenant que votre bien est loué, simplifiez-vous la vie. Confiez la gestion administrative à notre plateforme et gagnez en tranquillité.
                        </p>

                        {/* Features List */}
                        <div className="w-full space-y-4 mb-8 text-left">
                            {[
                                { icon: Receipt, title: "Quittances Automatiques", desc: "Générées et envoyées chaque mois" },
                                { icon: BellRing, title: "Suivi des Paiements", desc: "Relances et alertes de retard" },
                                { icon: Wallet, title: "Comptabilité Simplifiée", desc: "Déclaration simplifiée de vos revenus" },
                            ].map((feature, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={feature.title}
                                    className="flex items-start gap-4 p-3 rounded-xl border border-transparent"
                                >
                                    <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary">
                                        <feature.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">{feature.title}</h4>
                                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="w-full flex flex-col gap-3">
                            <Button
                                onClick={() => {
                                    onClose();
                                    router.push("/pro/start"); // Rediriger vers le wizard de gestion locative
                                }}
                                className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group"
                            >
                                Découvrir la Gestion Locative
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    onClose();
                                    onProceed();
                                }}
                                className="w-full text-muted-foreground hover:text-foreground h-10 hover:bg-muted/50 rounded-xl transition-all"
                            >
                                Plus tard, marquer comme loué
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
