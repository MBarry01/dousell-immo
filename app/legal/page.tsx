import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Mentions Légales · Dousell Immo",
  description: "Mentions légales et politique de confidentialité de Dousell Immo",
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 text-white">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <div className="space-y-6 prose prose-invert prose-lg max-w-none">
        <h1 className="text-4xl font-bold">Mentions Légales</h1>
        <p className="text-white/70 text-sm">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Informations légales</h2>
          <div className="space-y-2 text-white/80">
            <p>
              <strong>Raison sociale :</strong> Dousell Immo
            </p>
            <p>
              <strong>Siège social :</strong> Sacré-Cœur 3, VDN, Dakar, Sénégal
            </p>
            <p>
              <strong>Téléphone :</strong> +221 33 860 00 00
            </p>
            <p>
              <strong>Email :</strong> contact@dousell.immo
            </p>
            <p>
              <strong>Directeur de publication :</strong> Dousell Immo
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Hébergement</h2>
          <p className="text-white/80">
            Ce site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Collecte et traitement des données personnelles</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Conformément à la réglementation en vigueur au Sénégal et au Règlement Général sur la Protection des Données (RGPD), Dousell Immo s&apos;engage à protéger vos données personnelles.
            </p>
            <h3 className="text-xl font-semibold mt-6">3.1. Données collectées</h3>
            <p>
              Nous collectons les données suivantes lorsque vous utilisez notre plateforme :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Données d&apos;identification : nom, prénom, email, numéro de téléphone</li>
              <li>Données de connexion : adresse IP, cookies, identifiants de session</li>
              <li>Données de navigation : pages visitées, durée de visite, actions effectuées</li>
              <li>Données relatives aux biens : informations sur les propriétés consultées, favoris, demandes d&apos;estimation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">3.2. Finalités du traitement</h3>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Gérer votre compte utilisateur et vos préférences</li>
              <li>Vous permettre de déposer et gérer vos annonces immobilières</li>
              <li>Vous mettre en relation avec des propriétaires et des acheteurs</li>
              <li>Améliorer nos services et votre expérience utilisateur</li>
              <li>Vous envoyer des communications relatives à nos services (avec votre consentement)</li>
              <li>Respecter nos obligations légales et réglementaires</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">3.3. Base légale</h3>
            <p>
              Le traitement de vos données personnelles est fondé sur :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Votre consentement pour les communications marketing</li>
              <li>L&apos;exécution d&apos;un contrat pour la gestion de votre compte et de vos annonces</li>
              <li>Notre intérêt légitime pour l&apos;amélioration de nos services</li>
              <li>Le respect de nos obligations légales</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Cookies et technologies similaires</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Notre site utilise des cookies et technologies similaires pour améliorer votre expérience de navigation.
            </p>
            <h3 className="text-xl font-semibold mt-6">4.1. Types de cookies utilisés</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (authentification, session)</li>
              <li><strong>Cookies analytiques :</strong> Google Analytics pour analyser l&apos;utilisation du site</li>
              <li><strong>Cookies de préférences :</strong> Mémorisation de vos choix (langue, thème)</li>
            </ul>
            <p className="mt-4">
              Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Partage des données</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Vos données peuvent être partagées avec :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Supabase :</strong> Hébergement de la base de données et gestion de l&apos;authentification</li>
              <li><strong>Google :</strong> Services d&apos;authentification (OAuth) et analytics (Google Analytics)</li>
              <li><strong>Prestataires techniques :</strong> Services d&apos;hébergement et d&apos;infrastructure</li>
            </ul>
            <p className="mt-4">
              Nous ne vendons jamais vos données personnelles à des tiers à des fins commerciales.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Vos droits</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Conformément à la réglementation, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Droit d&apos;accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
              <li><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition :</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@dousell.immo" className="text-amber-400 hover:text-amber-300 underline">contact@dousell.immo</a>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Conservation des données</h2>
          <p className="text-white/80">
            Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, et conformément aux obligations légales applicables. Les données de compte sont conservées tant que votre compte est actif. Les données de navigation sont conservées pour une durée maximale de 26 mois.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Sécurité</h2>
          <p className="text-white/80">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte, destruction ou altération. Cependant, aucune méthode de transmission sur Internet n&apos;est 100% sécurisée.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Modifications</h2>
          <p className="text-white/80">
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Contact</h2>
          <p className="text-white/80">
            Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, vous pouvez nous contacter à :
          </p>
          <div className="mt-4 space-y-2 text-white/80">
            <p><strong>Email :</strong> <a href="mailto:contact@dousell.immo" className="text-amber-400 hover:text-amber-300 underline">contact@dousell.immo</a></p>
            <p><strong>Téléphone :</strong> +221 33 860 00 00</p>
            <p><strong>Adresse :</strong> Sacré-Cœur 3, VDN, Dakar, Sénégal</p>
          </div>
        </section>
      </div>
    </div>
  );
}

