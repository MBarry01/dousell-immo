import { Metadata } from 'next';
import { getBarometerData } from '@/lib/actions/barometre';
import { TrendingUp, MapPin, Home, Info, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 86400; // Cache 24h

export const metadata: Metadata = {
    title: 'Baromètre des prix de l\'immobilier au Sénégal 2026',
    description: 'Consultez les prix moyens au m² à Dakar, Saly et au Sénégal. Données officielles issues des transactions et annonces vérifiées Dousel.',
    alternates: {
        canonical: 'https://www.dousel.com/barometre-prix-immobilier-senegal',
    },
};

export default async function BarometrePage() {
    const data = await getBarometerData();

    const ventes = data.filter(d => d.transaction === 'vente');
    const locations = data.filter(d => d.transaction === 'location');

    const formatter = new Intl.NumberFormat('fr-SN', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0,
    });

    // Schema.org pour les IA (GEO)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        'name': 'Baromètre des prix immobiliers au Sénégal (2026)',
        'description': 'Prix de vente et de location moyens au m² au Sénégal par Dousel.',
        'creator': {
            '@type': 'Organization',
            'name': 'Dousel Immo'
        },
        'includedInDataCatalog': {
            '@type': 'DataCatalog',
            'name': 'Dousel Data'
        },
        'spatialCoverage': {
            '@type': 'Country',
            'name': 'Sénégal'
        },
        'url': 'https://www.dousel.com/barometre-prix-immobilier-senegal',
        // Les IA aiment extraire les data brutes si elles sont bien formattées mentalement 
        // plutôt qu'un CSV, le HTML sémantique suffira car on injecte les tables plus bas.
    };

    return (
        <div className="min-h-screen bg-background pt-28 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Section */}
            <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                    <TrendingUp className="w-4 h-4" />
                    <span>Mise à jour en direct (2026)</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                    Le Baromètre Officiel <br className="hidden md:block" />
                    <span className="text-primary">des Prix Immobiliers au Sénégal</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                    Découvrez les vrais prix du marché (vente et location) au Sénégal.
                    Ces données sont calculées en temps réel à partir de <strong className="text-foreground">centaines d'annonces vérifiées</strong> par Dousel.
                </p>

                <div className="flex justify-center gap-4 text-sm text-muted-foreground items-center">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> Données fiables</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-500" /> Dakar & Régions</span>
                </div>
            </section>

            {/* Tables Section */}
            <section className="px-4 max-w-6xl mx-auto space-y-16">

                {/* VENTES */}
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Home className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Prix à l'Achat</h2>
                            <p className="text-sm text-muted-foreground">Appartements, Villas et Terrains au Sénégal</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Ville / Quartier</th>
                                    <th className="px-4 py-3 font-semibold">Type de Bien</th>
                                    <th className="px-4 py-3 font-semibold text-right">Prix Moyen</th>
                                    <th className="px-4 py-3 font-semibold text-right text-primary">Prix au m²</th>
                                    <th className="px-4 py-3 font-semibold text-center">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {ventes.length > 0 ? ventes.map((v, i) => (
                                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-foreground">{v.city}</td>
                                        <td className="px-4 py-4 text-muted-foreground">{v.type}</td>
                                        <td className="px-4 py-4 text-right font-medium">{formatter.format(v.avgPrice)}</td>
                                        <td className="px-4 py-4 text-right font-bold text-primary">{formatter.format(v.avgPricePerSqm)}/m²</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-block bg-muted px-2 py-1 rounded text-xs">{v.count} annonces</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Données en cours de consolidation pour l'achat. Revenez très vite !
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* LOCATIONS */}
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <Home className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Prix à la Location</h2>
                            <p className="text-sm text-muted-foreground">Loyers mensuels moyens</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Ville / Quartier</th>
                                    <th className="px-4 py-3 font-semibold">Type de Bien</th>
                                    <th className="px-4 py-3 font-semibold text-right">Loyer Moyen</th>
                                    <th className="px-4 py-3 font-semibold text-right text-green-500">Loyer au m²</th>
                                    <th className="px-4 py-3 font-semibold text-center">Volume</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {locations.length > 0 ? locations.map((l, i) => (
                                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-foreground">{l.city}</td>
                                        <td className="px-4 py-4 text-muted-foreground">{l.type}</td>
                                        <td className="px-4 py-4 text-right font-medium">{formatter.format(l.avgPrice)}</td>
                                        <td className="px-4 py-4 text-right font-bold text-green-500">{formatter.format(l.avgPricePerSqm)}/m²</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-block bg-muted px-2 py-1 rounded text-xs">{l.count} annonces</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Données en cours de consolidation pour la location.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </section>

            {/* CTA final */}
            <section className="px-4 py-20 mt-16 text-center border-t border-border bg-card/50">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Prêt à investir dans l'immobilier au Sénégal ?
                </h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Dousel vous accompagne de la recherche jusqu'à la gestion locative digitalisée. L'immobilier 100% sécurisé et transparent, c'est ici.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/recherche" className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
                        Voir nos Biens Vérifiés
                    </Link>
                    <Link href="/a-propos" className="bg-muted text-foreground px-8 py-3 rounded-full font-semibold hover:bg-muted/80 transition-colors">
                        En savoir plus sur Dousel
                    </Link>
                </div>
            </section>

        </div>
    );
}
