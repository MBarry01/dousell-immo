"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Sophie M.",
        role: "Locataire à Mermoz",
        text: "Trouver un appartement à Dakar n'a jamais été aussi simple. Le processus de visite virtuelle m'a fait gagner un temps précieux !",
        rating: 5,
    },
    {
        name: "Jean-Pierre D.",
        role: "Locataire à Saly",
        text: "Une transparence totale sur les frais et un état des lieux numérique très rassurant. Je recommande vivement.",
        rating: 5,
    },
    {
        name: "Aminata F.",
        role: "Locataire au Plateau",
        text: "Le paiement du loyer par Wave intégré est un vrai plus. Plus besoin de courir après les reçus.",
        rating: 4,
    },
];

export default function TenantTestimonials() {
    return (
        <section className="py-24 bg-zinc-900 border-y border-white/5">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-white mb-16">
                    Ils ont trouvé leur bonheur avec <span className="text-[#F4C430]">Dousel</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-black/50 p-8 rounded-2xl border border-white/5 relative"
                        >
                            <div className="flex justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, starIndex) => (
                                    <Star
                                        key={starIndex}
                                        className={`w-4 h-4 ${starIndex < t.rating ? "text-[#F4C430] fill-[#F4C430]" : "text-gray-600"}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-300 italic mb-6">&quot;{t.text}&quot;</p>
                            <div>
                                <div className="font-bold text-white">{t.name}</div>
                                <div className="text-sm text-gray-500">{t.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
