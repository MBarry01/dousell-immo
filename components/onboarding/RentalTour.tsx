'use client';

import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./dousell-driver-theme.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

type PageContext = 'dashboard' | 'interventions' | 'legal';

interface RentalTourProps {
    hasProperties?: boolean;
    page: PageContext;
}

export function RentalTour({ hasProperties = true, page }: RentalTourProps) {

    useEffect(() => {
        // 1. Clé unique par page pour mémoriser si le tour a été vu
        const storageKey = `dousell_tour_seen_${page}`;
        const tourSeen = localStorage.getItem(storageKey);

        // 2. Condition de déclenchement :
        // - Si jamais vu sur cette page
        // - ET (pas de propriétés OU contexte spécifique qui ne dépend pas des propriétés)
        const shouldRun = !tourSeen && (page !== 'dashboard' || !hasProperties);

        if (shouldRun) {
            // Définition des étapes selon la page
            let steps: any[] = [];

            if (page === 'dashboard') {
                steps = [
                    {
                        element: '#tour-stats',
                        popover: {
                            title: 'Bienvenue sur votre Gestion ! 👋',
                            description: 'Ici, vous aurez une vue d\'ensemble de vos loyers encaissés et taux d\'occupation.'
                        }
                    },
                    {
                        element: '#tour-add-tenant',
                        popover: {
                            title: 'Gestion des Locataires 👤',
                            description: 'C\'est ici que vous créerez vos baux. Le système générera automatiquement les contrats et quittances.',
                            side: "top",
                        }
                    },
                    {
                        element: '#tour-nav-interventions',
                        popover: {
                            title: 'Suivi des Travaux 🛠️',
                            description: 'Cliquez ici pour gérer les signalements de vos locataires.',
                            side: "bottom",
                        }
                    },
                    {
                        element: '#tour-nav-legal',
                        popover: {
                            title: 'Assistant Juridique ⚖️',
                            description: 'Accédez à vos alertes légales et modèles de documents ici.',
                            side: "bottom",
                            align: 'end'
                        }
                    }
                ];
            } else if (page === 'interventions') {
                steps = [
                    {
                        element: '#tour-intervention-stats',
                        popover: {
                            title: 'Tableau de Bord Maintenance 🔧',
                            description: 'Suivez ici l\'état de toutes vos demandes d\'intervention en temps réel.',
                            side: "bottom",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-intervention-list',
                        popover: {
                            title: 'Liste des Signalements 📋',
                            description: 'Retrouvez ici les détails des pannes signalées par vos locataires.',
                            side: "top"
                        }
                    }
                ];
            } else if (page === 'legal') {
                steps = [
                    {
                        element: '#tour-legal-kpi',
                        popover: {
                            title: 'Indicateurs de Conformité 📊',
                            description: 'Surveillez vos risques juridiques et vos échéances de baux en un coup d\'œil.',
                            side: "bottom"
                        }
                    },
                    {
                        element: '#tour-legal-alerts',
                        popover: {
                            title: 'Radar des Échéances 📡',
                            description: 'Le système vous alerte automatiquement 6 mois et 3 mois avant la fin d\'un bail.',
                            side: "top"
                        }
                    },
                    {
                        element: '#tour-legal-tools',
                        popover: {
                            title: 'Outils Rapides ⚡',
                            description: 'Générez des quittances ou de nouveaux contrats conformes en un clic.',
                            side: "top"
                        }
                    },
                    {
                        element: '#tour-generate-contract',
                        popover: {
                            title: '✨ NOUVEAU : Générateur Juridique',
                            description: 'Plus besoin de Word ! Générez un contrat de bail conforme OHADA/Sénégal directement ici.',
                            side: "left",
                            align: 'center'
                        }
                    },
                    {
                        element: '#tour-legal-reference',
                        popover: {
                            title: 'Cadre Juridique 📚',
                            description: 'Retrouvez ici les délais légaux (préavis, reconduction) et textes de loi applicables au Sénégal.',
                            side: "top"
                        }
                    }
                ];
            }

            if (steps.length > 0) {
                const driverObj = driver({
                    showProgress: true,
                    animate: true,
                    popoverClass: 'dousell-theme',
                    nextBtnText: 'Suivant →',
                    prevBtnText: '← Retour',
                    doneBtnText: 'C\'est compris !',
                    onDestroyed: () => {
                        localStorage.setItem(storageKey, 'true');
                    },
                    steps: steps
                });

                setTimeout(() => {
                    driverObj.drive();
                }, 1000);
            }
        }
    }, [hasProperties, page]);

    const resetTour = () => {
        localStorage.removeItem(`dousell_tour_seen_${page}`);
        window.location.reload();
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={resetTour}
            className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 bg-black/20 backdrop-blur-sm text-white border border-white/10"
            title="Relancer le tutoriel de cette page"
        >
            <HelpCircle className="h-5 w-5" />
        </Button>
    );
}
