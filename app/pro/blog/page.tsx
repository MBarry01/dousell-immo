"use client";

import _Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
};

const articles = [
    {
        id: 1,
        title: "Guide complet : Acheter un bien immobilier au Sénégal en 2026",
        excerpt: "Découvrez les étapes clés, les pièges à éviter et nos conseils d'experts pour réussir votre investissement immobilier à Dakar et dans les régions.",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
        category: "Guides",
        date: "15 Jan 2026",
        readTime: "8 min",
    },
    {
        id: 2,
        title: "Les quartiers les plus prisés de Dakar pour investir",
        excerpt: "Almadies, Plateau, Mermoz, Sacré-Cœur... Analyse détaillée des quartiers avec le meilleur potentiel de rentabilité locative.",
        image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
        category: "Investissement",
        date: "10 Jan 2026",
        readTime: "6 min",
    },
    {
        id: 3,
        title: "Tout savoir sur le bail au Sénégal : droits et obligations",
        excerpt: "Propriétaires et locataires, connaissez vos droits ! Un guide complet sur la législation sénégalaise en matière de location.",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
        category: "Juridique",
        date: "5 Jan 2026",
        readTime: "10 min",
    },
    {
        id: 4,
        title: "Comment estimer la valeur de votre bien immobilier ?",
        excerpt: "Les critères essentiels pour évaluer correctement votre propriété et maximiser votre prix de vente.",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
        category: "Conseils",
        date: "28 Déc 2025",
        readTime: "5 min",
    },
    {
        id: 5,
        title: "Saly et la Petite Côte : le boom de l'immobilier balnéaire",
        excerpt: "Focus sur le marché immobilier de la Petite Côte, ses opportunités et les projets qui transforment la région.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        category: "Marché",
        date: "20 Déc 2025",
        readTime: "7 min",
    },
    {
        id: 6,
        title: "Digitalisation : Comment la technologie révolutionne l'immobilier",
        excerpt: "Visites virtuelles, signatures électroniques, paiements en ligne... Les innovations qui changent le secteur.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        category: "Innovation",
        date: "15 Déc 2025",
        readTime: "6 min",
    },
];

const categories = ["Tous", "Guides", "Investissement", "Juridique", "Conseils", "Marché", "Innovation"];

export default function BlogPage() {
    return (
        <main className="bg-black min-h-screen">

            <div className="container mx-auto px-6 pt-32 pb-20">
                {/* Hero Section */}
                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-8 text-white shadow-2xl sm:p-12 mb-12"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,196,48,0.1)_0%,_transparent_50%)]" />

                    <div className="relative z-10">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
                            Blog Immobilier
                        </p>
                        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl font-display">
                            Conseils, guides et actualités
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl font-light">
                            Restez informé sur le marché immobilier sénégalais. Nos experts partagent leurs connaissances pour vous accompagner dans vos projets.
                        </p>
                    </div>
                </motion.section>

                {/* Categories */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-wrap gap-2 mb-12"
                >
                    {categories.map((cat, i) => (
                        <button
                            key={cat}
                            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${i === 0
                                ? "bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/20"
                                : "bg-zinc-900 border border-white/10 text-white/70 hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>

                {/* Articles Grid */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {articles.map((article, index) => (
                        <motion.article
                            key={article.id}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5 hover:-translate-y-1"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-[#F4C430] px-3 py-1 text-xs font-bold text-black uppercase tracking-wide">
                                    <Tag className="h-3 w-3" />
                                    {article.category}
                                </span>
                            </div>

                            <div className="p-6">
                                <div className="mb-4 flex items-center gap-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {article.date}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {article.readTime}
                                    </span>
                                </div>

                                <h3 className="mb-3 text-xl font-bold text-white group-hover:text-[#F4C430] transition-colors line-clamp-2">
                                    {article.title}
                                </h3>

                                <p className="mb-6 text-sm text-white/60 line-clamp-2 leading-relaxed">
                                    {article.excerpt}
                                </p>

                                <div className="flex items-center text-sm font-bold text-[#F4C430] group-hover:gap-2 transition-all">
                                    Lire l&apos;article
                                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </motion.section>

                {/* Newsletter CTA */}
                <motion.section
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-20 rounded-[36px] border border-white/10 bg-gradient-to-r from-[#F4C430]/10 via-zinc-900 to-zinc-900 p-8 text-center sm:p-12 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4C430]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl font-display">
                            Restez informé
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-white/60">
                            Recevez nos derniers articles et conseils immobiliers directement dans votre boîte mail.
                        </p>
                        <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                            <input
                                type="email"
                                placeholder="Votre email professionnel"
                                className="flex-1 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-white placeholder:text-white/40 focus:border-[#F4C430]/50 focus:outline-none focus:ring-1 focus:ring-[#F4C430]/50 transition-all"
                            />
                            <button
                                type="submit"
                                className="rounded-full bg-[#F4C430] px-8 py-3 font-bold text-black transition-all hover:bg-[#E5B82A] hover:scale-105 active:scale-95 shadow-lg shadow-[#F4C430]/20"
                            >
                                S&apos;abonner
                            </button>
                        </form>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
