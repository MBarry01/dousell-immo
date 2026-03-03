// Run with: npx tsx scripts/seed-blog-article.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sampleArticle = {
  title: "Investir dans l'immobilier au Sénégal : Le guide complet 2026",
  slug: "investir-immobilier-senegal-guide-2026",
  excerpt: "Tout ce que vous devez savoir pour investir intelligemment dans l'immobilier sénégalais en 2026 : zones à fort potentiel, démarches juridiques, et conseils pratiques.",
  status: "published",
  published_at: new Date().toISOString(),
  template: "standard",
  category: "Guides",
  author_name: "Équipe Doussel",
  meta_title: "Investir dans l'immobilier au Sénégal 2026 — Guide Complet",
  meta_description: "Guide complet pour investir dans l'immobilier au Sénégal en 2026. Zones prisées, démarches, prix au m², conseils pour la diaspora.",
  read_time_minutes: 8,
  blocks: [
    { id: "b1", type: "heading", level: 1, text: "Investir dans l'immobilier au Sénégal : Le guide complet 2026" },
    { id: "b2", type: "paragraph", text: "Le marché immobilier sénégalais connaît une croissance soutenue depuis plusieurs années. Entre l'émergence de Dakar comme hub régional, le développement de nouvelles zones résidentielles et l'intérêt croissant de la diaspora, les opportunités d'investissement n'ont jamais été aussi nombreuses." },
    { id: "b3", type: "callout", title: "Ce que vous allez apprendre", items: ["Les zones à fort potentiel de valorisation en 2026", "Les démarches juridiques pour un achat sécurisé", "Les prix moyens au m² par quartier", "Les pièges à éviter pour les investisseurs de la diaspora"] },
    { id: "b4", type: "heading", level: 2, text: "Pourquoi investir au Sénégal en 2026 ?" },
    { id: "b5", type: "paragraph", text: "Le Sénégal affiche une stabilité politique et économique enviable en Afrique de l'Ouest. Avec un taux de croissance du PIB autour de 8% porté par les découvertes pétrolières et gazières, le pays attire de plus en plus d'investisseurs internationaux. Le secteur immobilier profite directement de cette dynamique : demande locative forte, développement d'infrastructures et urbanisation rapide." },
    { id: "b6", type: "quote", text: "Dakar se positionne comme l'une des villes africaines offrant le meilleur rapport rendement/risque pour les investisseurs immobiliers.", author: "Rapport BCEAO 2025" },
    { id: "b7", type: "heading", level: 2, text: "Les zones les plus prometteuses" },
    { id: "b8", type: "table", headers: ["Zone", "Prix moyen au m²", "Rendement locatif", "Potentiel"], rows: [["Almadies / Ngor", "350 000 - 500 000 FCFA", "5-7%", "★★★★★"], ["Plateau / Médina", "200 000 - 350 000 FCFA", "6-8%", "★★★★☆"], ["Diamniadio", "80 000 - 150 000 FCFA", "7-10%", "★★★★★"], ["Saly Portudal", "120 000 - 250 000 FCFA", "8-12%", "★★★★☆"], ["Thiès / Saint-Louis", "50 000 - 100 000 FCFA", "9-12%", "★★★☆☆"]] },
    { id: "b9", type: "heading", level: 2, text: "Les étapes clés d'un achat sécurisé" },
    { id: "b10", type: "list", ordered: true, items: ["Vérification du titre foncier auprès du cadastre", "Levée des servitudes et hypothèques éventuelles", "Signature d'un compromis de vente devant notaire", "Obtention du certificat de propriété", "Enregistrement à la conservation foncière", "Paiement des droits de mutation (10% de la valeur)"] },
    { id: "b11", type: "callout", title: "Conseil pour la diaspora", items: ["Mandatez un notaire local de confiance avant tout versement", "Méfiez-vous des vendeurs qui n'ont qu'un acte de vente sous seing privé", "Le titre foncier (TF) est la seule garantie légale de propriété au Sénégal", "Doussel vous met en relation avec des agents vérifiés"] },
    { id: "b12", type: "cta", text: "Trouver un bien à Dakar", href: "/location", style: "primary" }
  ]
};

async function main() {
  console.log('Seeding sample article...');
  const { data: existing } = await supabase.from('articles').select('id').eq('slug', sampleArticle.slug).single();
  if (existing) { console.log('Article already exists, skipping.'); return; }
  const { data, error } = await supabase.from('articles').insert(sampleArticle).select().single();
  if (error) { console.error('Error:', error.message); process.exit(1); }
  console.log(`Article créé: ${data.title}`);
  console.log(`   URL: /pro/blog/${data.slug}`);
}

main();
