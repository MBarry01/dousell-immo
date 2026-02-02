import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/access-control/my-permissions
 *
 * Récupère les permissions temporaires actives de l'utilisateur connecté
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Récupérer les permissions temporaires actives
    const { data: permissions, error } = await supabase
      .from("temporary_permissions")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });

    if (error) {
      console.error("[API] Error fetching permissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions: permissions || [],
    });
  } catch (error: any) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
