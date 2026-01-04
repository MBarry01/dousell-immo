import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Conditions Générales d'Utilisation · Dousell Immo",
  description: "Conditions générales d'utilisation de la plateforme Dousell Immo",
};

export default function CGUPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 text-white">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>

      <div className="space-y-6 prose prose-invert prose-lg max-w-none">
        <h1 className="text-4xl font-bold">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-white/70 text-sm">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Objet</h2>
          <p className="text-white/80">
            Les présentes Conditions Générales d&apos;Utilisation (ci-après les &quot;CGU&quot;) régissent l&apos;utilisation de la plateforme Dousell Immo (ci-après la &quot;Plateforme&quot;), un service d&apos;intermédiation immobilière en ligne permettant la mise en relation entre propriétaires, vendeurs et acquéreurs de biens immobiliers à Dakar et au Sénégal.
          </p>
          <p className="text-white/80">
            L&apos;utilisation de la Plateforme implique l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Définitions</h2>
          <div className="space-y-2 text-white/80">
            <p><strong>Plateforme :</strong> Le site web et l&apos;application Dousell Immo accessible à l&apos;adresse dousell-immo.app</p>
            <p><strong>Utilisateur :</strong> Toute personne accédant à la Plateforme</p>
            <p><strong>Propriétaire/Vendeur :</strong> Personne physique ou morale proposant un bien immobilier à la vente ou à la location</p>
            <p><strong>Acheteur/Locataire :</strong> Personne physique ou morale recherchant un bien immobilier</p>
            <p><strong>Annonce :</strong> Publication d&apos;un bien immobilier sur la Plateforme</p>
            <p><strong>Dousell Immo :</strong> La société éditrice de la Plateforme, agissant en qualité d&apos;intermédiaire</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Acceptation des CGU</h2>
          <p className="text-white/80">
            En accédant et en utilisant la Plateforme, vous reconnaissez avoir lu, compris et accepté les présentes CGU. Ces conditions s&apos;appliquent à tous les utilisateurs de la Plateforme, y compris les visiteurs, les utilisateurs inscrits, les propriétaires et les acheteurs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Description du service</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Dousell Immo est une plateforme d&apos;intermédiation immobilière qui permet :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>La consultation d&apos;annonces immobilières à Dakar et au Sénégal</li>
              <li>La mise en relation entre propriétaires/vendeurs et acheteurs/locataires</li>
              <li>Le dépôt d&apos;annonces par les propriétaires (après validation et éventuel paiement)</li>
              <li>La recherche de biens selon des critères personnalisés</li>
              <li>L&apos;estimation gratuite de biens immobiliers</li>
            </ul>
            <p className="mt-4">
              <strong>Dousell Immo agit uniquement en qualité d&apos;intermédiaire.</strong> La Plateforme ne garantit pas la véracité, l&apos;exactitude ou la complétude des informations fournies par les utilisateurs dans leurs annonces.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Inscription et compte utilisateur</h2>
          <div className="space-y-3 text-white/80">
            <h3 className="text-xl font-semibold mt-6">5.1. Création de compte</h3>
            <p>
              Pour déposer une annonce ou accéder à certaines fonctionnalités, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.
            </p>

            <h3 className="text-xl font-semibold mt-6">5.2. Obligations de l&apos;utilisateur</h3>
            <p>Vous vous engagez à :</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fournir des informations exactes et complètes</li>
              <li>Maintenir la sécurité de votre compte</li>
              <li>Notifier immédiatement Dousell Immo en cas d&apos;utilisation non autorisée de votre compte</li>
              <li>Respecter les lois et réglementations en vigueur</li>
              <li>Ne pas utiliser la Plateforme à des fins frauduleuses ou illégales</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Dépôt d&apos;annonces</h2>
          <div className="space-y-3 text-white/80">
            <h3 className="text-xl font-semibold mt-6">6.1. Conditions de dépôt</h3>
            <p>
              Les propriétaires peuvent déposer des annonces sur la Plateforme selon deux modalités :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Mandat Agence (Gratuit) :</strong> Dousell Immo gère la mise en relation et perçoit une commission en cas de transaction réussie</li>
              <li><strong>Diffusion Simple (Payant) :</strong> Le propriétaire gère lui-même les visites. L&apos;annonce est visible pendant 30 jours après validation et paiement</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">6.2. Modération des annonces</h3>
            <p>
              Toutes les annonces déposées par les utilisateurs sont soumises à une modération par Dousell Immo. Nous nous réservons le droit de :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Refuser ou supprimer toute annonce ne respectant pas nos critères de qualité</li>
              <li>Demander des informations complémentaires ou des justificatifs</li>
              <li>Suspendre ou supprimer un compte en cas de manquement aux présentes CGU</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">6.3. Responsabilité du propriétaire</h3>
            <p>
              Le propriétaire garantit que :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les informations fournies dans l&apos;annonce sont exactes et complètes</li>
              <li>Il dispose des droits nécessaires pour proposer le bien à la vente ou à la location</li>
              <li>Les photos sont authentiques et représentent fidèlement le bien</li>
              <li>Le bien est disponible aux conditions indiquées</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Limitation de responsabilité</h2>
          <div className="space-y-3 text-white/80">
            <p>
              <strong>Dousell Immo agit en qualité d&apos;intermédiaire technique.</strong> En conséquence :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Dousell Immo ne garantit pas la véracité, l&apos;exactitude ou la complétude des informations contenues dans les annonces</li>
              <li>Dousell Immo n&apos;est pas responsable des vices cachés, des défauts ou des différences entre l&apos;annonce et le bien réel</li>
              <li>Dousell Immo n&apos;est pas partie aux transactions immobilières entre les utilisateurs</li>
              <li>Dousell Immo ne garantit pas la solvabilité des acheteurs ou la capacité des propriétaires à honorer leurs engagements</li>
              <li>Dousell Immo ne peut être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation de la Plateforme</li>
            </ul>
            <p className="mt-4">
              Il appartient aux parties (propriétaire et acheteur/locataire) de vérifier toutes les informations avant de conclure une transaction. Nous recommandons fortement de :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Visiter le bien avant toute transaction</li>
              <li>Vérifier les titres de propriété et la situation juridique du bien</li>
              <li>Faire appel à un notaire ou un avocat pour les transactions importantes</li>
              <li>Effectuer les vérifications d&apos;usage (état des lieux, diagnostics, etc.)</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Propriété intellectuelle</h2>
          <p className="text-white/80">
            La Plateforme et son contenu (textes, images, logos, design, code source) sont la propriété exclusive de Dousell Immo et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable.
          </p>
          <p className="text-white/80 mt-4">
            Les photos et descriptions des biens restent la propriété de leurs auteurs. En déposant une annonce, le propriétaire autorise Dousell Immo à utiliser ces contenus sur la Plateforme.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Tarification</h2>
          <div className="space-y-3 text-white/80">
            <p>
              La consultation des annonces est gratuite pour tous les utilisateurs.
            </p>
            <p>
              Le dépôt d&apos;annonces peut être :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Gratuit :</strong> Dans le cadre d&apos;un mandat agence (commission sur transaction)</li>
              <li><strong>Payant :</strong> Pour une diffusion simple (montant indiqué lors du dépôt, payable via Wave/OM)</li>
            </ul>
            <p className="mt-4">
              Les tarifs peuvent être modifiés à tout moment. Les tarifs applicables sont ceux en vigueur au moment du dépôt de l&apos;annonce.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">10. Données personnelles</h2>
          <p className="text-white/80">
            Le traitement de vos données personnelles est régi par notre <Link href="/legal" className="text-amber-400 hover:text-amber-300 underline">Politique de Confidentialité</Link>. En utilisant la Plateforme, vous acceptez le traitement de vos données conformément à cette politique.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">11. Résiliation</h2>
          <div className="space-y-3 text-white/80">
            <p>
              Dousell Immo se réserve le droit de suspendre ou résilier votre compte à tout moment en cas de :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violation des présentes CGU</li>
              <li>Publication d&apos;annonces frauduleuses ou inexactes</li>
              <li>Comportement inapproprié ou nuisible à la Plateforme</li>
              <li>Non-paiement des frais dus</li>
            </ul>
            <p className="mt-4">
              Vous pouvez supprimer votre compte à tout moment depuis la section &quot;Mon Compte&quot;.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">12. Droit applicable et juridiction</h2>
          <p className="text-white/80">
            Les présentes CGU sont régies par le droit sénégalais. En cas de litige, et après tentative de résolution amiable, les tribunaux de Dakar seront seuls compétents.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">13. Modifications des CGU</h2>
          <p className="text-white/80">
            Dousell Immo se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur la Plateforme. Votre utilisation continue de la Plateforme après modification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">14. Contact</h2>
          <p className="text-white/80">
            Pour toute question concernant les présentes CGU, vous pouvez nous contacter à :
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

