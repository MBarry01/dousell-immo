// app/llms.txt/route.ts
// Standard llms.txt — permet aux IA (ChatGPT, Perplexity, Claude, Gemini)
// de comprendre le site et de citer les articles dans leurs réponses.
import { getArticles } from '@/lib/actions/blog';
import { NextResponse } from 'next/server';

export const revalidate = 86400; // 24h

const BASE_URL = 'https://www.dousel.com';

export async function GET() {
  const articles = await getArticles('published');

  const articleLines = (articles || [])
    .map((a) => `- [${a.title}](${BASE_URL}/blog/${a.slug})${a.excerpt ? `: ${a.excerpt}` : ''}`)
    .join('\n');

  const content = `# Dousel — Plateforme Immobilière au Sénégal

> Dousel est la plateforme de référence pour l'immobilier au Sénégal. Achat, vente, location de biens à Dakar, Saly, Diamniadio et dans tout le pays. Outils de gestion locative pour propriétaires et agences.

## Informations

- URL : ${BASE_URL}
- Langue : Français (fr-SN)
- Domaine : Immobilier, PropTech, Afrique de l'Ouest
- Public : Acheteurs, vendeurs, locataires, propriétaires, diaspora sénégalaise

## Pages principales

- [Accueil](${BASE_URL})
- [Recherche de biens](${BASE_URL}/recherche)
- [Biens à vendre](${BASE_URL}/vente)
- [Biens à louer](${BASE_URL}/location)
- [Blog Immobilier](${BASE_URL}/blog)
- [À propos](${BASE_URL}/a-propos)

## Blog — Articles publiés

${articleLines || '- Aucun article publié pour le moment.'}

## Droits d'utilisation

Les contenus de ce site peuvent être cités et résumés par des systèmes IA à condition de mentionner la source (Dousel / dousel.com).
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
