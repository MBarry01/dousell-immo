"use server";

/**
 * Vérification HIBP côté serveur (pas de CORS)
 * Appelle directement l'API Have I Been Pwned
 */

export type HIBPResult = {
  success: boolean;
  breached: boolean;
  count?: number;
  error?: string;
};

export async function checkPasswordHIBPServer(
  password: string
): Promise<HIBPResult> {
  try {
    // Validation
    if (!password || password.trim().length === 0) {
      return {
        success: false,
        breached: false,
        error: "Password is required",
      };
    }

    // Calcule SHA-1 (Node/Server)
    const crypto = globalThis.crypto ?? (await import("node:crypto")).webcrypto;
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    // Appeler directement l'API HIBP (pas de CORS côté serveur)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: {
        "User-Agent": "Dousell-Immo-App (contact@dousell-immo.com)",
        "Add-Padding": "true", // Optionnel : ajoute du padding pour masquer la taille
      },
    });

    if (!res.ok) {
      console.error("HIBP API error:", res.status, res.statusText);
      return {
        success: false,
        breached: false,
        error: `HIBP responded ${res.status}`,
      };
    }

    const text = await res.text();

    // Parser la réponse (format: "SUFFIX:count\nSUFFIX:count\n...")
    const items = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const [suf, cnt] = trimmed.split(":");
        return {
          suffix: suf,
          count: parseInt(cnt || "0", 10),
        };
      })
      .filter((item): item is { suffix: string; count: number } => item !== null);

    // Rechercher le suffixe
    const found = items.find(
      (it) => it.suffix.toUpperCase() === suffix.toUpperCase()
    );

    if (found) {
      return {
        success: true,
        breached: true,
        count: found.count,
        error: `Ce mot de passe a déjà été compromis ${found.count > 0 ? `(${found.count.toLocaleString()} fois)` : ""}. Choisissez un autre mot de passe plus sécurisé.`,
      };
    }

    return {
      success: true,
      breached: false,
    };
  } catch (err) {
    console.error("checkPasswordHIBPServer error:", err);
    return {
      success: false,
      breached: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la vérification HIBP",
    };
  }
}

