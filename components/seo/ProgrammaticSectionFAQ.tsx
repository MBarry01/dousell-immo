"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Property } from "@/types/property";

interface ProgrammaticSectionFAQProps {
    city: string;
    type?: string;
    mode?: 'location' | 'vente';
    properties: Property[];
}

const formatCityName = (city: string) => {
    if (!city) return "";
    const particles = ["de", "du", "des", "le", "la", "les", "en", "au", "aux", "d'", "l'"];
    return city
        .toLowerCase()
        .split(/(\s+|-)/) // Keep separators to preserve structure
        .map(word => {
            // Check if it's a particle (and not the first word)
            if (particles.includes(word.toLowerCase())) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
};

export function ProgrammaticSectionFAQ({ city, properties }: ProgrammaticSectionFAQProps) {

    // --- LOGIQUE SMART PRICING (Analyse Interne + Externe) ---
    const getPriceByRooms = () => {
        const groups: Record<string, { total: number; count: number; order: number }> = {};
        let hasData = false;

        properties.forEach((p) => {
            // On ignore les prix aberrants (ex: 0 ou 1 FCFA) et < 10000
            if (!p.price || p.price < 10000) return;

            let roomKey = "Autres";
            let sortOrder = 99; // Par défaut à la fin

            const typeStr = p.details.type || "";
            const rooms = p.specs.rooms;
            const typeLower = typeStr.toLowerCase();

            // CAS TERRAINS (Souvent à part) -> On exclut selon la demande
            if (typeLower.includes('terrain')) {
                // roomKey = "Terrains nus";
                // sortOrder = 100;
                return; // On ne l'affiche pas
            }
            // CAS STUDIOS
            else if (typeLower.includes('studio') || rooms === 1) {
                roomKey = "Studio / 1 Pièce";
                sortOrder = 1;
            }
            // CAS APPARTEMENTS / VILLAS AVEC PIÈCES
            else if (rooms && rooms > 1) {
                roomKey = `${rooms} Pièces`;
                sortOrder = rooms;
            }
            // SI ON NE SAIT PAS -> On exclut selon la demande
            else {
                return;
            }

            if (!groups[roomKey]) groups[roomKey] = { total: 0, count: 0, order: sortOrder };
            groups[roomKey].total += p.price;
            groups[roomKey].count += 1;
            hasData = true;
        });

        if (!hasData) return null;

        // On génère l'affichage HTML (Liste à puces)
        return Object.entries(groups)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, data]) => {
                const avg = Math.round(data.total / data.count);
                return `<li class="mb-2 flex items-center">
        <span class="w-2 h-2 bg-primary rounded-full mr-3"></span>
        <span class="font-medium text-foreground min-w-[120px]">${key}</span>
        <span class="text-muted-foreground mx-2">:</span>
        <strong class="text-primary">${new Intl.NumberFormat('fr-FR').format(avg)} FCFA</strong>
      </li>`;
            })
            .join('');
    };

    // Calculs
    const pricingBreakdown = getPriceByRooms();
    const globalAverage = properties.length > 0
        ? Math.round(properties.reduce((acc, curr) => acc + curr.price, 0) / properties.length)
        : 0;

    const count = properties.length;
    // Formatage du nom de la ville
    const formattedCity = formatCityName(city);

    // --- CONTENU DES QUESTIONS ---
    const faqItems = [
        {
            question: `Quel est le prix du loyer à ${formattedCity} selon la taille ?`,
            answer: pricingBreakdown
                ? `Voici les moyennes de loyer constatées à ${formattedCity} :<br/><ul class="mt-4 pl-2">${pricingBreakdown}</ul>`
                : `Le prix moyen global est de ${new Intl.NumberFormat('fr-FR').format(globalAverage)} FCFA. Cependant, ce chiffre peut varier selon qu'il s'agisse d'un studio ou d'une villa.`
        },
        {
            question: `Quels types de biens sont disponibles à ${formattedCity} ?`,
            answer: `Notre plateforme regroupe une large sélection à ${formattedCity}. Actuellement, vous pouvez trouver des offres allant du studio meublé à la villa familiale. Toutes nos annonces internes sont vérifiées.`
        },
        {
            question: `Comment louer à ${formattedCity} via Doussel Immo ?`,
            answer: `C'est simple et sécurisé : 1. Choisissez votre bien ci-dessus. 2. Déposez votre dossier numérique en ligne (plus besoin de photocopies). 3. Une fois validé par l'agence ou le propriétaire, signez votre bail électroniquement.`
        }
    ];

    return (
        <section className="py-12 bg-background border-t border-border/50 mt-12">
            <div className="container max-w-4xl mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
                    Questions fréquentes sur l'immobilier à <span className="text-primary">{formattedCity}</span>
                </h2>

                <Accordion type="single" collapsible className="w-full bg-card rounded-lg shadow-sm border border-border px-6 py-2">
                    {faqItems.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b-border last:border-0">
                            <AccordionTrigger className="text-left font-semibold text-foreground text-lg py-4 hover:no-underline hover:text-primary transition-colors">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-4">
                                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
