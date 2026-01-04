export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-white/80">
      <h1 className="text-3xl font-bold text-white mb-8">Politique de Confidentialité</h1>
      
      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">1. Collecte des données</h2>
        <p>
          Nous collectons les informations nécessaires au fonctionnement du service : nom, email, numéro de téléphone, et informations sur les biens immobiliers.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">2. Utilisation des données</h2>
        <p>
          Vos données sont utilisées pour :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Gérer votre compte et vos annonces</li>
          <li>Vous mettre en relation avec d&apos;autres utilisateurs</li>
          <li>Améliorer nos services</li>
          <li>Vous envoyer des notifications importantes</li>
        </ul>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">3. Protection des données</h2>
        <p>
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données personnelles.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">4. Vos droits</h2>
        <p>
          Conformément à la législation en vigueur, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Contactez-nous pour exercer ces droits.
        </p>
      </section>

      <div className="text-sm text-white/40 mt-12 pt-8 border-t border-white/10">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </div>
    </div>
  );
}
