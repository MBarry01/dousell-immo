"use server";

/**
 * Notifications pour le système de contrôle d'accès temporaire
 */

import { sendEmail } from "@/lib/mail";
import { createClient } from "@/utils/supabase/server";
import { AccessRequestNotification } from "@/emails/AccessRequestNotification";
import { AccessApproved } from "@/emails/AccessApproved";
import { AccessRejected } from "@/emails/AccessRejected";
import { AccessExpiring } from "@/emails/AccessExpiring";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dousell.com";

// Récupère les emails des owners et managers d'une équipe
async function getTeamManagersEmails(teamId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: managers } = await supabase
    .from("team_members")
    .select(`
      user_id,
      profiles:user_id(email)
    `)
    .eq("team_id", teamId)
    .in("role", ["owner", "manager"])
    .eq("status", "active");

  if (!managers) return [];

  return managers
    .map((m: any) => m.profiles?.email)
    .filter(Boolean);
}

async function getTeamName(teamId: string): Promise<string> {
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  return team?.name || "Votre équipe";
}

async function getUserInfo(userId: string): Promise<{ email: string; name: string }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  return {
    email: profile?.email || "",
    name: profile?.full_name || profile?.email || "Utilisateur",
  };
}

export async function notifyAccessRequest(data: {
  teamId: string;
  requesterId: string;
  permission: string;
  reason?: string;
}) {
  try {
    const { teamId, requesterId, permission, reason } = data;
    const [managersEmails, teamName, requesterInfo] = await Promise.all([
      getTeamManagersEmails(teamId),
      getTeamName(teamId),
      getUserInfo(requesterId),
    ]);

    if (managersEmails.length === 0) {
      console.warn("[Access Request] No managers found");
      return { success: false };
    }

    await sendEmail({
      to: managersEmails,
      subject: `Nouvelle demande d'accès de ${requesterInfo.name}`,
      react: AccessRequestNotification({
        requesterName: requesterInfo.name,
        requesterEmail: requesterInfo.email,
        permission,
        reason,
        teamName,
        reviewUrl: `${BASE_URL}/gestion/access-control`,
      }),
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Access Request] Error:", error);
    return { success: false };
  }
}

export async function notifyAccessApproved(data: {
  teamId: string;
  requesterId: string;
  permission: string;
  expiresAt: string;
  durationHours: number;
  reviewerId: string;
  reviewNotes?: string;
}) {
  try {
    const { teamId, requesterId, permission, expiresAt, durationHours, reviewerId, reviewNotes } = data;
    const [requesterInfo, reviewerInfo, teamName] = await Promise.all([
      getUserInfo(requesterId),
      getUserInfo(reviewerId),
      getTeamName(teamId),
    ]);

    await sendEmail({
      to: requesterInfo.email,
      subject: "✅ Votre demande d'accès a été approuvée",
      react: AccessApproved({
        userName: requesterInfo.name,
        permission,
        expiresAt,
        durationHours,
        reviewerName: reviewerInfo.name,
        reviewNotes,
        teamName,
        dashboardUrl: `${BASE_URL}/gestion`,
      }),
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Access Approved] Error:", error);
    return { success: false };
  }
}

export async function notifyAccessRejected(data: {
  teamId: string;
  requesterId: string;
  permission: string;
  reviewerId: string;
  reviewNotes?: string;
}) {
  try {
    const { teamId, requesterId, permission, reviewerId, reviewNotes } = data;
    const [requesterInfo, reviewerInfo, teamName] = await Promise.all([
      getUserInfo(requesterId),
      getUserInfo(reviewerId),
      getTeamName(teamId),
    ]);

    await sendEmail({
      to: requesterInfo.email,
      subject: "Votre demande d'accès temporaire",
      react: AccessRejected({
        userName: requesterInfo.name,
        permission,
        reviewerName: reviewerInfo.name,
        reviewNotes,
        teamName,
        contactUrl: `${BASE_URL}/gestion/equipe`,
      }),
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Access Rejected] Error:", error);
    return { success: false };
  }
}

export async function notifyAccessExpiring(data: {
  teamId: string;
  userId: string;
  permission: string;
  expiresAt: string;
}) {
  try {
    const { teamId, userId, permission, expiresAt } = data;
    const expiresAtDate = new Date(expiresAt);
    const hoursRemaining = Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60));

    if (hoursRemaining <= 0) return { success: false };

    const [userInfo, teamName] = await Promise.all([
      getUserInfo(userId),
      getTeamName(teamId),
    ]);

    await sendEmail({
      to: userInfo.email,
      subject: `⏰ Votre accès temporaire expire dans ${hoursRemaining}h`,
      react: AccessExpiring({
        userName: userInfo.name,
        permission,
        expiresAt,
        hoursRemaining,
        teamName,
        requestUrl: `${BASE_URL}/gestion`,
      }),
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Access Expiring] Error:", error);
    return { success: false };
  }
}
