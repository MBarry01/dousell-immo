import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();

    // On récupère le domaine tapé par le visiteur
    const hostname = req.headers.get('host') || '';

    // RÈGLE 1 : Si le visiteur est sur "app.dousel.com" (ou app.doussel.immo)
    if (hostname.startsWith('app.')) {
        // S'il n'est pas déjà dans le dossier /gestion, on l'y envoie en arrière-plan
        if (!url.pathname.startsWith('/gestion')) {
            url.pathname = `/gestion${url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    // RÈGLE 2 : Si le visiteur est sur dousel.com ou dousel.com/pro
    // Next.js charge les pages normalement (app/page.tsx ou app/pro/page.tsx)
    return NextResponse.next();
}

// On demande au middleware de ne pas bloquer les images, CSS et APIs
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
