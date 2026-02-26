"use server";

import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "./mail-gmail";
import { getBaseUrl } from "./utils";

// Supabase Admin Client (pour modifier auth.users)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Génère un token de vérification et l'envoie par email via Nodemailer
 * @param userId - ID de l'utilisateur Supabase
 * @param email - Email de l'utilisateur
 * @param fullName - Nom complet de l'utilisateur
 * @returns Promise avec le résultat
 */
export async function sendConfirmationEmail(
  userId: string,
  email: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Générer un token unique
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    // Utiliser upsert pour créer ou mettre à jour le profil avec le token
    // Cela évite les problèmes de timing avec le trigger Supabase
    console.log("📝 Sauvegarde du token de vérification pour:", userId);

    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          email_verification_token: verificationToken,
          email_verification_expires: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
          ignoreDuplicates: false, // Mettre à jour si existe
        }
      )
      .select();

    console.log("📝 Résultat upsert:", { upsertData, upsertError });

    if (upsertError) {
      console.error("❌ Erreur upsert:", upsertError.message);
      // On continue quand même pour envoyer l'email
    } else {
      console.log("✅ Token sauvegardé avec succès:", verificationToken.substring(0, 8) + "...");
    }

    // Construire le lien de vérification
    const baseUrl = getBaseUrl();
    const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    // Envoyer l'email via Nodemailer
    const emailHtml = generateConfirmationEmailHTML(fullName, verificationLink);

    const emailResult = await sendEmail({
      to: email,
      subject: "Confirmez votre compte Dousel",
      html: emailHtml,
    });

    if (emailResult.error) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailResult.error);
      return { success: false, error: emailResult.error };
    }

    console.log(`✅ Email de confirmation envoyé à ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Vérifie un token de confirmation d'email et confirme l'utilisateur
 * @param token - Token de vérification
 * @returns Promise avec le résultat
 */
export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    console.log("🔍 verifyEmailToken - Début de la vérification");
    console.log("🔍 Token recherché:", token);

    const supabaseAdmin = getSupabaseAdmin();

    // Trouver l'utilisateur avec ce token
    const { data: profile, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id, email_verification_expires, email_verification_token")
      .eq("email_verification_token", token)
      .single();

    console.log("🔍 Résultat recherche profil:", { profile, findError });

    if (findError || !profile) {
      console.error("❌ Token non trouvé:", findError);
      console.error("❌ Détails:", { token, findError: findError?.message, code: findError?.code });
      return { success: false, error: "Lien de vérification invalide ou expiré" };
    }

    // Vérifier l'expiration
    const expiresAt = new Date(profile.email_verification_expires);
    if (expiresAt < new Date()) {
      return { success: false, error: "Le lien de vérification a expiré. Veuillez vous réinscrire." };
    }

    // Confirmer l'utilisateur via l'API Admin Supabase
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error("❌ Erreur lors de la confirmation:", confirmError);
      return { success: false, error: "Erreur lors de la confirmation du compte" };
    }

    // Nettoyer le token (optionnel mais recommandé)
    await supabaseAdmin
      .from("profiles")
      .update({
        email_verification_token: null,
        email_verification_expires: null,
      })
      .eq("id", profile.id);

    console.log(`✅ Compte vérifié avec succès pour l'utilisateur ${profile.id}`);
    return { success: true, message: "Votre compte a été confirmé avec succès !" };
  } catch (error) {
    console.error("❌ Erreur inattendue lors de la vérification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Génère le HTML de l'email de confirmation
 */
function generateConfirmationEmailHTML(fullName: string, verificationLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre compte</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #f59e0b;
      padding-bottom: 25px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #05080c;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content {
      margin: 30px 0;
      text-align: center;
    }
    .content h2 {
      color: #05080c;
      margin-bottom: 20px;
    }
    .content p {
      margin: 15px 0;
      color: #555;
      font-size: 16px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
    }
    .button:hover {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }
    .link-fallback {
      margin-top: 25px;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 25px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 13px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 Dousel</h1>
      <p>L'immobilier de confiance au Sénégal</p>
    </div>
    
    <div class="content">
      <h2>Bienvenue, ${fullName} !</h2>
      
      <p>Merci de vous être inscrit(e) sur Dousel.</p>
      <p>Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
      
      <div class="button-container">
        <a href="${verificationLink}" class="button">
          ✅ Confirmer mon compte
        </a>
      </div>
      
      <div class="warning">
        ⚠️ Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette inscription, ignorez cet email.
      </div>
      
      <div class="link-fallback">
        <strong>Le bouton ne fonctionne pas ?</strong><br>
        Copiez et collez ce lien dans votre navigateur :<br>
        <a href="${verificationLink}" style="color: #f59e0b;">${verificationLink}</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Dousel</strong></p>
      <p>Votre partenaire immobilier à Dakar</p>
      <p style="font-size: 11px; color: #999;">
        Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
