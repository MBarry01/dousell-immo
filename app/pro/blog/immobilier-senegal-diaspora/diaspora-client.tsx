"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Scale, RefreshCw, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AGENCY_PHONE_CLEAN } from "@/lib/constants";

type FAQ = {
    question: string;
    answer: string;
};

export function DiasporaClient() {
    const whatsappLink = `https://wa.me/${AGENCY_PHONE_CLEAN}?text=${encodeURIComponent("Bonjour, j'ai parcouru le Guide Diaspora Dousel et j'aimerais parler à un conseiller pour mon projet immobilier au Sénégal.")}`;

    return (
        <div className="min-h-screen bg-[#050505] text-white/90">
            {/* Hero Section */}
            <section className="relative min-h-[80vh] flex items-center py-24 px-4 overflow-hidden border-b border-white/5">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/diaspora-hero.png"
                        alt="Luxurious Villa in Dakar"
                        fill
                        className="object-cover opacity-40"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-[#050505]/40 to-[#050505]" />
                </div>

                <div className="container mx-auto max-w-5xl relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20">
                            Spécial Diaspora Sénégalaise
                        </span>
                        <h1 className="text-4xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent leading-tight">
                            Investir au Sénégal en toute sécurité depuis l'étranger
                        </h1>
                        <p className="text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Accédez au marché immobilier dakarois avec la même sérénité que si vous étiez sur place. Expertise juridique, biens vérifiés et accompagnement personnalisé de A à Z.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button asChild className="bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-bold h-14 px-8 rounded-xl text-lg shadow-lg shadow-primary/20">
                                <Link href="/recherche?transaction=vente">
                                    Consulter les annonces vérifiées
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="border-white/20 h-14 px-8 rounded-xl text-lg backdrop-blur-sm hover:bg-white/5 transition-all">
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-primary" />
                                    Parler à un conseiller
                                </a>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trust Pillars */}
            <section className="py-24 container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="group space-y-4 p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all hover:bg-white/[0.07]">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-10 h-10 text-[#F4C430]" />
                        </div>
                        <h3 className="text-2xl font-bold">Sécurité Juridique</h3>
                        <p className="text-white/60 leading-relaxed text-lg">
                            Zéro compromis sur la légalité. Nous ne listons que des biens dont les titres de propriété (TF, Bail) ont été audités par nos experts.
                        </p>
                    </div>
                    <div className="group space-y-4 p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all hover:bg-white/[0.07]">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Scale className="w-10 h-10 text-[#F4C430]" />
                        </div>
                        <h3 className="text-2xl font-bold">Processus Notarié</h3>
                        <p className="text-white/60 leading-relaxed text-lg">
                            Nous collaborons avec les meilleures études notariales de Dakar pour garantir un transfert de propriété fluide, sécurisé et incontestable.
                        </p>
                    </div>
                    <div className="group space-y-4 p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all hover:bg-white/[0.07]">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <RefreshCw className="w-10 h-10 text-[#F4C430]" />
                        </div>
                        <h3 className="text-2xl font-bold">Achat à Distance</h3>
                        <p className="text-white/60 leading-relaxed text-lg">
                            De la visite virtuelle 4K à la signature par procuration, nous digitalisons tout le parcours d'achat pour la diaspora.
                        </p>
                    </div>
                </div>
            </section>

            {/* Deep Content Section */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4 max-w-4xl prose prose-invert prose-yellow prose-lg">
                    <h2 className="text-4xl font-bold text-white mb-10 text-center">Guide Immobilier Sénégal pour la Diaspora</h2>

                    <p className="text-xl text-white/70 leading-relaxed">
                        Investir dans l'immobilier au Sénégal est une priorité pour de nombreux Sénégalais vivant en France, aux États-Unis ou au Canada. Que ce soit pour construire une résidence secondaire, préparer sa retraite ou générer des revenus locatifs, les opportunités sont nombreuses à Dakar, Saly et dans le nouveau pôle de Diamniadio.
                    </p>

                    <div className="my-16 space-y-12">
                        <section>
                            <h3 className="text-[#F4C430] text-2xl font-bold flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-sm">1</span>
                                Comprendre les Titres de Propriété
                            </h3>
                            <p>
                                Au Sénégal, la sécurité de votre investissement dépend du type de titre. Le <strong>Titre Foncier (TF)</strong> est le graal de la propriété immobilière : il est définitif et inattaquable. Le <strong>Bail</strong> est un contrat de location longue durée avec l'État, souvent transformable en TF. Dousel vous aide à décrypter ces documents pour éviter les mauvaises surprises.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-[#F4C430] text-2xl font-bold flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-sm">2</span>
                                Le Rôle Central du Notaire
                            </h3>
                            <p>
                                Le notaire est le garant de votre transaction. Au Sénégal, seul l'acte notarié permet de sécuriser le transfert de propriété. Ne versez jamais d'acompte directement à un vendeur sans passer par un compte séquestre notarié. Dousel vous met en relation avec des offices certifiés.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-[#F4C430] text-2xl font-bold flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center text-sm">3</span>
                                Financement pour les Non-Résidents
                            </h3>
                            <p>
                                Le transfert de fonds doit respecter les réglementations de l'UEMOA. Nous vous conseillons sur les meilleures pratiques pour transférer votre apport personnel en toute sécurité et sur les solutions de crédit immobilier disponibles pour les Sénégalais de l'extérieur via nos banques partenaires.
                            </p>
                        </section>
                    </div>

                    <div className="not-prose my-20 p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 group-hover:bg-primary/20 transition-all" />
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-primary/20">
                                        <FileText className="w-8 h-8 text-[#F4C430]" />
                                    </div>
                                    <h4 className="text-3xl font-bold">Télécharger le Guide complet</h4>
                                </div>
                                <p className="text-white/70 text-lg mb-0">
                                    Recevez gratuitement notre guide exclusif : <br /><strong className="text-white font-bold">"10 étapes pour acheter au Sénégal depuis l'étranger sans stress"</strong>.
                                </p>
                            </div>
                            <div className="w-full md:w-auto flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        placeholder="votre@email.com"
                                        className="h-14 w-full sm:w-64 rounded-2xl bg-black/40 border border-white/10 px-6 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 transition-all"
                                    />
                                    <Button className="bg-[#F4C430] hover:bg-[#F4C430]/90 text-black font-bold h-14 px-8 rounded-2xl shadow-xl shadow-primary/10">
                                        Recevoir le guide
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white/30 text-center sm:text-left">
                                    En téléchargeant ce guide, vous acceptez notre politique de confidentialité.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Destinations Grid */}
            <section className="py-32 container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Où investir en ce moment ?</h2>
                    <p className="text-xl text-white/50 max-w-2xl mx-auto">Explorez nos analyses détaillées et opportunités par zone géographique stratégique.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[
                        { city: "Dakar", desc: "La valeur refuge. Une demande locative insatiable.", slug: "dakar" },
                        { city: "Saly & Petite Côte", desc: "Le paradis des résidences secondaires et balnéaires.", slug: "saly" },
                        { city: "Diamniadio", desc: "La nouvelle ville. Un investissement d'avenir au pôle technologique.", slug: "diamniadio" },
                    ].map((item) => (
                        <Link key={item.slug} href={`/immobilier/${item.slug}`} className="group p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/40 transition-all relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MapPin className="w-24 h-24 text-primary" />
                            </div>
                            <MapPin className="w-12 h-12 text-[#F4C430] mb-8 group-hover:scale-110 transition-transform" />
                            <h4 className="text-3xl font-bold mb-4">{item.city}</h4>
                            <p className="text-white/50 text-lg mb-10 leading-relaxed">{item.desc}</p>
                            <span className="text-sm font-bold text-primary flex items-center gap-3 group-hover:gap-5 transition-all">
                                Explorer la zone <RefreshingIcon className="w-5 h-5" />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 bg-primary/5 border-t border-white/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Prêt à lancer votre projet ?</h2>
                    <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
                        Ne laissez pas la distance être un frein à votre patrimoine. Nos conseillers Diaspora vous rappellent sous 24h.
                    </p>
                    <Button asChild size="lg" className="rounded-2xl h-16 px-12 text-xl font-bold bg-[#F4C430] text-black">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                            Démarrer mon accompagnement
                        </a>
                    </Button>
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
