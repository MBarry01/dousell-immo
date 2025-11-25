/**
 * Client HIBP utilisant l'Edge Function Supabase
 * Appelle /functions/v1/hibp-check au lieu de l'URL directe
 */

export async function checkPasswordViaEdge(password: string) {
  try {
    // 1) Calcule SHA-1 hex en majuscules
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

    // 2) Appeler l'Edge Function hibp-check
    // Utiliser l'URL relative pour que Next.js gère le proxy automatiquement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return {
        success: false,
        error: "NEXT_PUBLIC_SUPABASE_URL not configured",
      };
    }

    // Construire l'URL de la fonction Edge
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) {
      return {
        success: false,
        error: "Invalid Supabase URL format",
      };
    }

    const projectId = match[1];
    const functionUrl = `https://${projectId}.functions.supabase.co/hibp-check`;

    // Récupérer l'anon key pour l'authentification si nécessaire
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const res = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey && {
          Authorization: `Bearer ${anonKey}`,
        }),
      },
      body: JSON.stringify({ prefix }),
    }).catch((fetchError) => {
      // Si fetch échoue (CORS, réseau, etc.), on retourne null pour gérer dans le catch
      throw fetchError;
    });

    if (!res.ok) {
      // Service indisponible ou erreur réseau
      const errorText = await res.text().catch(() => "");
      console.error("HIBP Edge Function error:", res.status, errorText);
      
      // Si 401/403/404, la fonction n'est probablement pas déployée ou accessible
      // En développement, on ignore pour ne pas bloquer l'inscription
      const isDev = typeof window !== "undefined" && 
                    (window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1");
      
      if (isDev && (res.status === 401 || res.status === 403 || res.status === 404)) {
        console.warn("⚠️ HIBP Edge Function non accessible en dev - vérification ignorée");
        return { success: true, breached: false };
      }
      
      return {
        success: false,
        error: `Service HIBP indisponible (${res.status})`,
      };
    }

    const json = await res.json();

    if (!json || !Array.isArray(json.items)) {
      return {
        success: false,
        error: "Réponse HIBP invalide",
      };
    }

    // 3) Rechercher le suffixe retourné par la fonction
    const found = json.items.find(
      (item) => item.suffix?.toUpperCase() === suffix.toUpperCase()
    );

    if (found) {
      return {
        success: true,
        breached: true,
        count: found.count || 0,
        error: `Ce mot de passe a déjà été compromis ${found.count > 0 ? `(${found.count.toLocaleString()} fois)` : ""}. Choisissez un autre mot de passe plus sécurisé.`,
      };
    } else {
      return {
        success: true,
        breached: false,
      };
    }
  } catch (err) {
    console.error("checkPasswordViaEdge error", err);
    
    // Détecter si on est en développement (côté client)
    const isDev = typeof window !== "undefined" && 
                  (window.location.hostname === "localhost" || 
                   window.location.hostname === "127.0.0.1");
    
    // Si erreur réseau (CORS, fetch failed, etc.), permettre l'inscription en dev
    if (isDev) {
      const isNetworkError = 
        err instanceof TypeError || 
        err instanceof Error && (
          err.message.includes("fetch") ||
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("CORS")
        );
      
      if (isNetworkError) {
        console.warn("⚠️ HIBP bloqué par CORS/réseau en dev - vérification ignorée");
        return { success: true, breached: false };
      }
    }
    
    return {
      success: false,
      error: "Erreur réseau ou interne lors de la vérification HIBP",
    };
  }
}

