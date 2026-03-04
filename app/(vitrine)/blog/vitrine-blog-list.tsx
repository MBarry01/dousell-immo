"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { useState } from "react";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dkkirzpxe';

/** Handles both Cloudinary public IDs and full external URLs (Pexels, etc.) */
function coverSrc(id: string | null): string | null {
  if (!id) return null;
  if (id.startsWith('http')) return id;
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_600,q_auto,f_auto/${id}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const ALL_CATEGORIES = ["Tous", "Guides", "Investissement", "Juridique", "Conseils", "Marché", "Innovation"] as const;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  published_at: string | null;
  read_time_minutes: number | null;
  cover_image: string | null;
}

interface VitrineBlogListProps {
  articles: Article[];
}

export function VitrineBlogList({ articles }: VitrineBlogListProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const filtered = activeCategory === "Tous"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

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
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === cat
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
        {filtered.length === 0 && (
          <p className="col-span-3 text-center text-white/50 py-12">
            Aucun article dans cette catégorie pour le moment.
          </p>
        )}
        {filtered.map((article, index) => (
          <motion.article
            key={article.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-card transition-all hover:border-[#F4C430]/30 hover:shadow-lg hover:shadow-[#F4C430]/5 hover:-translate-y-1"
          >
            <Link href={`/blog/${article.slug}`} className="block h-full">

              {/* Vignette de couverture */}
              <div className="relative aspect-[16/9] overflow-hidden">
                {article.cover_image ? (
                  <Image
                    src={coverSrc(article.cover_image)!}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-4xl opacity-20">📰</span>
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Badge catégorie en overlay */}
                {article.category && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#F4C430] px-2.5 py-0.5 text-xs font-bold text-black uppercase tracking-wide">
                    <Tag className="h-3 w-3" />
                    {article.category}
                  </span>
                )}
              </div>

              {/* Contenu */}
              <div className="p-5">
                <div className="mb-3 flex items-center gap-4 text-xs text-white/50">
                  {article.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(article.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {article.read_time_minutes != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.read_time_minutes} min
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-[#F4C430] transition-colors line-clamp-2">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="text-sm text-white/50 line-clamp-2 mb-4">
                    {article.excerpt}
                  </p>
                )}

                <div className="inline-flex items-center gap-1 text-sm font-medium text-[#F4C430] group-hover:gap-2 transition-all mt-2">
                  Lire l&apos;article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
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
