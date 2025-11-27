export default function CGUPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl text-white/80">
      <h1 className="text-3xl font-bold text-white mb-8">Conditions Générales d'Utilisation</h1>
      
      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
        <p>
          Bienvenue sur Doussel Immo. En utilisant notre plateforme, vous acceptez les présentes conditions générales d'utilisation.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">2. Services proposés</h2>
        <p>
          Doussel Immo est une plateforme de mise en relation entre propriétaires, agents immobiliers et particuliers à la recherche de biens immobiliers.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">3. Responsabilités</h2>
        <p>
          Nous nous efforçons de vérifier les annonces publiées, mais nous ne pouvons garantir l'exactitude de toutes les informations. Les utilisateurs sont invités à faire preuve de vigilance.
        </p>
      </section>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-white">4. Paiements</h2>
        <p>
          Certains services sont payants. Les paiements sont sécurisés et traités par notre partenaire PayDunya. Aucun remboursement n'est possible une fois le service consommé.
        </p>
      </section>

      <div className="text-sm text-white/40 mt-12 pt-8 border-t border-white/10">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </div>
    </div>
  );
}
