import { NextRequest, NextResponse } from "next/server";
import { notifyAccessExpiring } from "@/lib/notifications/access-control-notifications";
import { headers } from "next/headers";

/**
 * API Route: Envoyer notification d'expiration
 *
 * Appelée par l'Edge Function CRON cleanup-access-control
 * ou manuellement pour tester
 *
 * POST /api/cron/send-expiring-notification
 * Body: { teamId, userId, permission, expiresAt }
 * Header: Authorization: Bearer CRON_SECRET_KEY
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const cronSecretKey = process.env.CRON_SECRET_KEY;
    if (!cronSecretKey) {
      console.error('[send-expiring-notification] CRON_SECRET_KEY manquant');
      return NextResponse.json({ success: false, error: 'Config error' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecretKey}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parser le body
    const body = await request.json();
    const { teamId, userId, permission, expiresAt } = body;

    if (!teamId || !userId || !permission || !expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: teamId, userId, permission, expiresAt",
        },
        { status: 400 }
      );
    }

    // Envoyer la notification
    const result = await notifyAccessExpiring({
      teamId,
      userId,
      permission,
      expiresAt,
    });

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Send Expiring Notification] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Permet GET pour tester l'endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: "Send Expiring Notification API",
    method: "POST",
    body: {
      teamId: "uuid",
      userId: "uuid",
      permission: "string",
      expiresAt: "ISO date string",
    },
  });
}
