/**
 * Vérification HIBP (Have I Been Pwned) pour les mots de passe
 * Appelle l'Edge Function Supabase hibp-password-check
 */

// Construire l'URL de l'Edge Function à partir de l'URL Supabase
// Exemple: https://blyanhulvwpdfpezlaji.supabase.co -> https://blyanhulvwpdfpezlaji.functions.supabase.co/hibp-password-check
const getHIBPFunctionURL = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  
  // Extraire le projet ID de l'URL Supabase
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) return null;
  
  const projectId = match[1];
  return `https://${projectId}.functions.supabase.co/hibp-password-check`;
};

const HIBP_FN_URL = getHIBPFunctionURL();

export type HIBPResponse = {
  breached: boolean;
  count?: number;
};

export type HIBPResult = {
  success: boolean;
  breached: boolean;
  count?: number;
  error?: string;
};

/**
 * Retry helper avec exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoffMs = 300
): Promise<Response> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        // Treat 5xx as retryable, 4xx as fatal
        if (res.status >= 500) {
          throw new Error(`Server error ${res.status}`);
        }
        // For 4xx, return response so caller can handle
        return res;
      }

      return res;
    } catch (err) {
      attempt++;

      if (attempt >= retries) throw err;

      // Exponential backoff with jitter
      const jitter = Math.random() * 100;
      const wait = backoffMs * (2 ** (attempt - 1)) + jitter;
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Vérifie si un mot de passe a été compromis via HIBP
 * @param password - Le mot de passe à vérifier (en clair, envoyé via HTTPS)
 * @param useRetry - Utiliser retry avec backoff exponentiel (défaut: true)
 * @returns Résultat de la vérification
 */
export async function checkPasswordHIBP(
  password: string,
  useRetry = true
): Promise<HIBPResult> {
  // 🔧 DÉVELOPPEMENT: Désactiver HIBP si en mode dev et que la fonction n'est pas déployée
  const isDev = process.env.NODE_ENV === "development";
  
  if (!HIBP_FN_URL) {
    if (isDev) {
      // En dev, retourner succès sans vérification si la fonction n'est pas configurée
      console.warn("⚠️ HIBP Edge Function non déployée - vérification désactivée en développement");
      return {
        success: true,
        breached: false,
      };
    }
    return {
      success: false,
      breached: false,
      error: "HIBP Edge Function URL not configured",
    };
  }

  if (!password || password.trim().length === 0) {
    return {
      success: false,
      breached: false,
      error: "Password is required",
    };
  }

  try {
    const fetchFn = useRetry
      ? (url: string, opts: RequestInit) => fetchWithRetry(url, opts, 3, 300)
      : fetch;

    const res = await fetchFn(HIBP_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
      // Désactiver le cache pour éviter les problèmes CORS
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("HIBP function error", res.status, text);
      return {
        success: false,
        breached: false,
        error:
          res.status >= 500
            ? "Service temporairement indisponible. Veuillez réessayer dans quelques instants."
            : "Impossible de vérifier le mot de passe pour l'instant. Réessayez plus tard.",
      };
    }

    const data: HIBPResponse = await res.json();

    if (data.breached) {
      const count = data.count ?? 0;
      return {
        success: true,
        breached: true,
        count,
        error: `Ce mot de passe a déjà été compromis ${count > 0 ? `(${count.toLocaleString()} fois)` : ""}. Choisissez un autre mot de passe plus sécurisé.`,
      };
    }

    return {
      success: true,
      breached: false,
    };
  } catch (err) {
    console.error("HIBP check error:", err);
    
    // En développement, si CORS bloque, permettre quand même l'inscription
    if (isDev && err instanceof TypeError && err.message.includes("fetch")) {
      console.warn("⚠️ HIBP bloqué par CORS en dev - vérification ignorée");
      return {
        success: true,
        breached: false,
      };
    }
    
    return {
      success: false,
      breached: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la vérification du mot de passe. Veuillez réessayer.",
    };
  }
}

