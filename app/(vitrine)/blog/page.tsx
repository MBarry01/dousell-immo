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
    id: 7,
    title: "Investir au Sénégal depuis la Diaspora : Le Guide Complet",
    excerpt: "Tout ce qu'il faut savoir pour sécuriser votre investissement immobilier au pays : procédures, financement, gestion à distance et conseils juridiques.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    category: "Guides",
    date: "27 Fév 2026",
    readTime: "12 min",
    href: "/pro/blog/immobilier-senegal-diaspora",
  },
  {
    id: 1,
    title: "Guide complet : Acheter un bien immobilier au Sénégal en 2026",
    excerpt: "Découvrez les étapes clés, les pièges à éviter et nos conseils d'experts pour réussir votre investissement immobilier à Dakar et dans les régions.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    category: "Guides",
    date: "15 Jan 2026",
    readTime: "8 min",
    href: "/pro/blog/immobilier-senegal-diaspora", // Re-routing similar guide for better UX
  },
  {
    id: 2,
    title: "Les quartiers les plus prisés de Dakar pour investir",
    excerpt: "Almadies, Plateau, Mermoz, Sacré-Cœur... Analyse détaillée des quartiers avec le meilleur potentiel de rentabilité locative.",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80",
    category: "Investissement",
    date: "10 Jan 2026",
    readTime: "6 min",
    href: "#",
  },
  {
    id: 3,
    title: "Tout savoir sur le bail au Sénégal : droits et obligations",
    excerpt: "Propriétaires et locataires, connaissez vos droits ! Un guide complet sur la législation sénégalaise en matière de location.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    category: "Juridique",
    date: "5 Jan 2026",
    readTime: "10 min",
    href: "#",
  },
  {
    id: 4,
    title: "Comment estimer la valeur de votre bien immobilier ?",
    excerpt: "Les critères essentiels pour évaluer correctement votre propriété et maximiser votre prix de vente.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    category: "Conseils",
    date: "28 Déc 2025",
    readTime: "5 min",
    href: "#",
  },
  {
    id: 5,
    title: "Saly et la Petite Côte : le boom de l'immobilier balnéaire",
    excerpt: "Focus sur le marché immobilier de la Petite Côte, ses opportunités et les projets qui transforment la région.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    category: "Marché",
    date: "20 Déc 2025",
    readTime: "7 min",
    href: "#",
  },
  {
    id: 6,
    title: "Digitalisation : Comment la technologie révolutionne l'immobilier",
    excerpt: "Visites virtuelles, signatures électroniques, paiements en ligne... Les innovations qui changent le secteur.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    category: "Innovation",
    date: "15 Déc 2025",
    readTime: "6 min",
    href: "#",
  },
];


const categories = ["Tous", "Guides", "Investissement", "Juridique", "Conseils", "Marché", "Innovation"];

export default function BlogPage() {
  return (
    <div className="space-y-12 py-10">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-card via-background to-background p-8 text-white shadow-2xl sm:p-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,196,48,0.1)_0%,_transparent_50%)]" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#F4C430]">
            Blog Immobilier
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Conseils, guides et actualités
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
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
        className="flex flex-wrap gap-2"
      >
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${i === 0
              ? "bg-[#F4C430] text-black"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {articles.map((article, index) => (
          <motion.article
            key={article.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5"
          >
            <_Link href={(article as any).href || "#"} className="block h-full">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#F4C430] px-3 py-1 text-xs font-medium text-black">
                  <Tag className="h-3 w-3" />
                  {article.category}
                </span>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {article.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-[#F4C430] transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="mb-4 text-sm text-white/60 line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="inline-flex items-center gap-1 text-sm font-medium text-[#F4C430] group-hover:gap-2 transition-all">
                  Lire l&apos;article
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </_Link>
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
        className="rounded-[36px] border border-white/10 bg-gradient-to-r from-[#F4C430]/10 via-card to-card p-8 text-center sm:p-12"
      >
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Restez informé
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Recevez nos derniers articles et conseils immobiliers directement dans votre boîte mail.
        </p>
        <form className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Votre email"
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-white placeholder:text-white/40 focus:border-[#F4C430]/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-[#F4C430] px-6 py-3 font-semibold text-black transition-all hover:bg-[#E5B82A]"
          >
            S&apos;abonner
          </button>
        </form>
      </motion.section>
    </div>
  );
}
