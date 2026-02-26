"use server";

import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/mail";
import { trackServerEvent, EVENTS } from "@/lib/analytics";

interface UpgradeFormData {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyNinea?: string;
}

/**
 * Upgrade a prospect to Pro status
 *
 * Actions performed:
 * 1. Set pro_status to 'trial'
 * 2. Set pro_trial_ends_at to 14 days from now
 * 3. Enable gestion_locative
 * 4. Create a team with the provided info
 * 5. Add user as team owner
 * 6. Send welcome email
 *
 * Per WORKFLOW_PROPOSAL.md section 4.4, REMAINING_TASKS.md 2.3
 */
export async function upgradeToProAction(formData: UpgradeFormData) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Vous devez être connecté pour effectuer cette action." };
  }

  // Check current status
  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.pro_status === "trial" || profile?.pro_status === "active") {
    return { error: "Votre compte est déjà activé en Pro." };
  }

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // 1. Update profile to Pro
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      pro_status: "trial",
      pro_trial_ends_at: trialEndsAt.toISOString(),
      gestion_locative_enabled: true,
      gestion_locative_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile Update Error:", profileError);
    return { error: "Erreur lors de la mise à jour du profil." };
  }

  // 2. Create team with provided info
  const companyName = formData.companyName || `${profile?.full_name?.split(" ")[0] || "Mon"}'s Agency`;
  const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "agency";
  const slug = `${slugBase}-${Math.floor(Math.random() * 10000)}`;

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: companyName,
      slug: slug,
      company_address: formData.companyAddress || null,
      company_phone: formData.companyPhone || null,
      company_ninea: formData.companyNinea || null,
      created_by: user.id,
      status: "active",
    })
    .select()
    .single();

  if (teamError) {
    console.error("Team Creation Error:", teamError);
    // Continue anyway - team can be created later
  } else if (teamData) {
    // 3. Link user to team as owner
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamData.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      });

    if (memberError) {
      console.error("Team Member Error:", memberError);
    }
  }

  // 4. Send welcome email (non-blocking)
  try {
    const userName = profile?.full_name?.split(" ")[0] || "Cher client";
    const trialEndFormatted = trialEndsAt.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await sendEmail({
      to: user.email!,
      subject: "Bienvenue dans Dousel Pro ! Votre essai gratuit est activé",
      html: generateWelcomeProEmailHtml(userName, companyName, trialEndFormatted),
    });
  } catch (emailError) {
    // Don't fail the upgrade if email fails
    console.error("Welcome email error:", emailError);
  }

  // 5. Track analytics event
  trackServerEvent(EVENTS.UPGRADE_COMPLETED, {
    user_id: user.id,
    from: "compte",
    plan: "trial",
    trial_ends_at: trialEndsAt.toISOString(),
  });
  console.log(`[UPGRADE] User ${user.id} upgraded to Pro (trial until ${trialEndsAt.toISOString()})`);

  return { success: true };
}

/**
 * Generate HTML for Pro welcome email
 */
function generateWelcomeProEmailHtml(userName: string, companyName: string, trialEnd: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousell.com";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue dans Dousel Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: #F4C430; margin-bottom: 8px;">
                Dousel Pro
              </div>
              <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #F4C430, #d4a820); margin: 0 auto; border-radius: 2px;"></div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px; font-weight: 600;">
                Bienvenue ${userName} !
              </h1>
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Votre compte <strong style="color: #F4C430;">${companyName}</strong> est maintenant activé.
                Vous avez accès à toutes les fonctionnalités Pro jusqu'au <strong style="color: #ffffff;">${trialEnd}</strong>.
              </p>

              <!-- Features -->
              <div style="background-color: #27272a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="color: #ffffff; font-weight: 600; margin-bottom: 16px;">
                  Ce que vous pouvez faire maintenant :
                </div>
                <ul style="color: #a1a1aa; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Ajouter vos biens immobiliers</li>
                  <li>Gérer vos locataires et baux</li>
                  <li>Générer des contrats automatisés</li>
                  <li>Suivre les loyers en temps réel</li>
                  <li>Créer des quittances digitales</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/gestion" style="display: inline-block; background-color: #F4C430; color: #000000; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px;">
                      Accéder à mon tableau de bord
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #27272a; border-top: 1px solid #3f3f46;">
              <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
                Des questions ? Répondez simplement à cet email.<br>
                <a href="${baseUrl}" style="color: #F4C430; text-decoration: none;">dousell.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
