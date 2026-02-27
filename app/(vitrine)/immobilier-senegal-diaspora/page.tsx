import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, MapPin, Scale, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQPageJsonLd } from "@/components/seo/json-ld";

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
        <div className="min-h-screen bg-[#050505] text-white/90">
            <FAQPageJsonLd faqs={faqs} />

            {/* Hero Section */}
            <section className="relative py-24 px-4 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="container mx-auto max-w-5xl relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                        Investir au Sénégal en toute sécurité depuis la Diaspora
                    </h1>
                    <p className="text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Accédez au marché immobilier dakarois avec la même sérénité que si vous étiez sur place. Expertise juridique, biens vérifiés et accompagnement personnalisé.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button className="bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-bold h-14 px-8 rounded-xl text-lg">
                            Consulter les annonces vérifiées
                        </Button>
                        <Button variant="outline" className="border-white/20 h-14 px-8 rounded-xl text-lg backdrop-blur-sm">
                            Parler à un conseiller
                        </Button>
                    </div>
                </div>
            </section>

            {/* Trust Pillars */}
            <section className="py-20 container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                        <ShieldCheck className="w-12 h-12 text-[#F4C430]" />
                        <h3 className="text-2xl font-bold">Sécurité Juridique</h3>
                        <p className="text-white/60 leading-relaxed">
                            Zéro compromis sur la légalité. Nous ne listons que des biens dont les titres de propriété ont été audités par nos experts.
                        </p>
                    </div>
                    <div className="space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                        <Scale className="w-12 h-12 text-[#F4C430]" />
                        <h3 className="text-2xl font-bold">Processus Notarié</h3>
                        <p className="text-white/60 leading-relaxed">
                            Nous collaborons avec les meilleures études notariales de Dakar pour garantir un transfert de propriété fluide et incontestable.
                        </p>
                    </div>
                    <div className="space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
                        <RefreshCw className="w-12 h-12 text-[#F4C430]" />
                        <h3 className="text-2xl font-bold">Achat à Distance</h3>
                        <p className="text-white/60 leading-relaxed">
                            De la visite virtuelle à la signature via procuration, nous digitalisons le parcours d'achat pour la diaspora.
                        </p>
                    </div>
                </div>
            </section>

            {/* Deep Content Section */}
            <section className="py-20 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4 max-w-4xl prose prose-invert prose-yellow prose-lg">
                    <h2 className="text-3xl font-bold text-white mb-8">Guide Immobilier Sénégal pour la Diaspora</h2>

                    <p>
                        Investir dans l'immobilier au Sénégal est une priorité pour de nombreux Sénégalais vivant en France, aux États-Unis ou au Canada. Que ce soit pour construire une résidence secondaire, préparer sa retraite ou générer des revenus locatifs, les opportunités sont nombreuses à Dakar, Saly et dans le nouveau pôle de Diamniadio.
                    </p>

                    <h3 className="text-[#F4C430]">1. Comprendre les Titres de Propriété</h3>
                    <p>
                        Au Sénégal, la sécurité de votre investissement dépend du type de titre. Le <strong>Titre Foncier (TF)</strong> est le graal de la propriété immobilière : il est définitif et inattaquable. Le <strong>Bail</strong> est un contrat de location longue durée avec l'État, souvent transformable en TF. Dousel vous aide à décrypter ces documents pour éviter les mauvaises surprises.
                    </p>

                    <h3 className="text-[#F4C430]">2. Le Rôle Central du Notaire</h3>
                    <p>
                        Le notaire est le garant de votre transaction. Au Sénégal, seul l'acte notarié permet de sécuriser le transfert de propriété. Ne versez jamais d'acompte directement à un vendeur sans passer par un compte séquestre notarié.
                    </p>

                    <h3 className="text-[#F4C430]">3. Financement et Transfert de Fonds</h3>
                    <p>
                        Le transfert de fonds doit respecter les réglementations de l'UEMOA. Nous vous conseillons sur les meilleures pratiques pour transférer votre apport personnel en toute sécurité et sur les solutions de crédit immobilier disponibles pour les non-résidents.
                    </p>

                    <div className="not-prose my-16 p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-[#F4C430]/10 border border-[#F4C430]/20">
                        <div className="flex items-center gap-4 mb-4">
                            <FileText className="w-8 h-8 text-[#F4C430]" />
                            <h4 className="text-2xl font-bold">Télécharger le Guide PDF</h4>
                        </div>
                        <p className="text-white/70 mb-8 max-w-lg">
                            Recevez notre guide exclusif : "10 étapes pour acheter au Sénégal depuis l'étranger sans stress".
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                className="flex-1 h-12 rounded-xl bg-black/40 border border-white/10 px-4 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50"
                            />
                            <Button className="bg-[#F4C430] text-black font-bold h-12 px-8">Recevoir le guide</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Destinations Grid */}
            <section className="py-24 container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Où investir en ce moment ?</h2>
                    <p className="text-white/50">Découvrez nos analyses par zone géographique</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { city: "Dakar", desc: "La valeur refuge. Forte demande locative.", slug: "dakar" },
                        { city: "Saly & Petite Côte", desc: "Le paradis des résidences secondaires.", slug: "saly" },
                        { city: "Diamniadio", desc: "Le pôle technologique à fort potentiel.", slug: "diamniadio" },
                    ].map((item) => (
                        <Link key={item.slug} href={`/immobilier/${item.slug}`} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                            <MapPin className="w-10 h-10 text-[#F4C430] mb-6 group-hover:scale-110 transition-transform" />
                            <h4 className="text-2xl font-bold mb-2">{item.city}</h4>
                            <p className="text-white/50 mb-6">{item.desc}</p>
                            <span className="text-sm font-bold text-primary flex items-center gap-2">
                                Explorer la zone <RefreshingIcon className="w-4 h-4" />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

function RefreshingIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
