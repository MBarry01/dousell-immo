/**
 * Team Switching Utilities
 * 
 * Permet aux utilisateurs multi-équipes de choisir leur équipe active
 */

import { cookies } from 'next/headers';

const ACTIVE_TEAM_COOKIE = 'dousell_active_team_id';

/**
 * Définit l'équipe active pour l'utilisateur
 * 
 * @param teamId - ID de l'équipe à activer
 */
export async function setActiveTeam(teamId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 jours
        path: '/',
    });
}

/**
 * Récupère l'ID de l'équipe active (si défini)
 * 
 * @returns ID de l'équipe active ou null
 */
export async function getActiveTeamId(): Promise<string | null> {
    const cookieStore = await cookies();
    const teamId = cookieStore.get(ACTIVE_TEAM_COOKIE);
    return teamId?.value || null;
}

/**
 * Supprime la préférence d'équipe active
 */
export async function clearActiveTeam(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(ACTIVE_TEAM_COOKIE);
}
