/**
 * Edge Function Supabase pour vérifier les mots de passe via HIBP
 * Déployer avec: supabase functions deploy hibp-password-check
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

// CORS headers pour autoriser les requêtes depuis localhost et le domaine de production
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ou spécifier votre domaine
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  password: string;
}

interface HIBPResponse {
  breached: boolean;
  count?: number;
}

/**
 * Vérifie un mot de passe via l'API HIBP (Have I Been Pwned)
 * Utilise le k-anonymity model pour ne jamais envoyer le mot de passe complet
 */
async function checkPasswordHIBP(password: string): Promise<HIBPResponse> {
  try {
    // 1. Hash SHA-1 du mot de passe
    const sha1Hash = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();

    // 2. Prendre les 5 premiers caractères (prefix)
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // 3. Appeler l'API HIBP avec le prefix
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "Dousel-Immo-App",
        },
      }
    );

    if (!response.ok) {
      console.error("HIBP API error:", response.status, response.statusText);
      throw new Error(`HIBP API returned ${response.status}`);
    }

    const text = await response.text();

    // 4. Chercher le suffix dans les résultats
    const lines = text.split("\n");
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return {
          breached: true,
          count,
        };
      }
    }

    return {
      breached: false,
    };
  } catch (error) {
    console.error("Error checking HIBP:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Vérifier que c'est une requête POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parser le body
    const body: RequestBody = await req.json();
    const { password } = body;

    // Validation
    if (!password || typeof password !== "string" || password.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier le mot de passe
    const result = await checkPasswordHIBP(password);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



