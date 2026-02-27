import { Metadata } from "next";
import { FAQPageJsonLd } from "@/components/seo/json-ld";
import { DiasporaClient } from "./diaspora-client";

export const metadata: Metadata = {
    title: "Investir au Sénégal depuis l'étranger : Le Guide Diaspora | Dousel",
    description: "Guide complet pour la diaspora sénégalaise : sécurisez votre investissement immobilier (notaire, titres fonciers, achat à distance) avec Dousel Immo.",
};

const faqs = [
    {
        question: "Peut-on acheter un bien au Sénégal sans se déplacer ?",
        answer: "Oui, via une procuration notariée. Nous vous accompagnons dans toutes les démarches avec nos notaires partenaires pour garantir la légalité de la transaction à distance."
    },
    {
        question: "Comment vérifier qu'un terrain possède un Titre Foncier ?",
        answer: "Dousel effectue une vérification rigoureuse auprès de la Direction des Impôts et des Domaines pour confirmer la validité du Titre Foncier ou du Bail avant toute mise en relation."
    },
    {
        question: "Quels sont les frais de notaire au Sénégal ?",
        answer: "Les frais de notaire varient généralement entre 5% et 15% de la valeur du bien, incluant les droits d'enregistrement et les honoraires du notaire."
    }
];

export default function DiasporaPillarPage() {
    return (
        <>
            <FAQPageJsonLd faqs={faqs} />
            <DiasporaClient />
        </>
    );
}
