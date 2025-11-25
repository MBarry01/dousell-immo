/**
 * Vérification côté serveur du token Cloudflare Turnstile
 */

export async function verifyTurnstileToken(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error("❌ TURNSTILE_SECRET_KEY n'est pas définie");
    return {
      success: false,
      error: "Configuration Turnstile manquante",
    };
  }

  if (!token) {
    return {
      success: false,
      error: "Token Turnstile manquant",
    };
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur Turnstile API:", data);
      return {
        success: false,
        error: "Erreur lors de la vérification Turnstile",
      };
    }

    if (!data.success) {
      console.warn("⚠️ Vérification Turnstile échouée:", data);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = "Vérification anti-robot échouée. Veuillez réessayer.";
      
      if (data["error-codes"] && Array.isArray(data["error-codes"])) {
        const errorCodes = data["error-codes"];
        if (errorCodes.includes("timeout-or-duplicate")) {
          errorMessage = "Le code de vérification a expiré. Veuillez actualiser la page et réessayer.";
        } else if (errorCodes.includes("invalid-input-response")) {
          errorMessage = "Vérification invalide. Veuillez réessayer.";
        } else if (errorCodes.includes("invalid-input-secret")) {
          errorMessage = "Erreur de configuration. Veuillez contacter le support.";
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de la vérification Turnstile:", error);
    return {
      success: false,
      error: "Erreur lors de la vérification. Veuillez réessayer.",
    };
  }
}

