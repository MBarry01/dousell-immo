import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole } from "@/lib/permissions";
import { getPerformanceStats } from "@/app/admin/actions";

/**
 * Route API pour récupérer les statistiques de performance selon la période
 * GET /api/admin/performance?days=30
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier les permissions
    await requireAnyRole();

    // Récupérer le paramètre days depuis la query string
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Valider le paramètre
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Paramètre 'days' invalide. Doit être entre 1 et 365." },
        { status: 400 }
      );
    }

    // Récupérer les statistiques
    const stats = await getPerformanceStats(days);

    if (!stats) {
      return NextResponse.json(
        { error: "Impossible de récupérer les statistiques" },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in GET /api/admin/performance:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}




