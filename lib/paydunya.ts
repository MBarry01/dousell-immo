/**
 * Configuration et utilitaires PayDunya
 * Documentation: https://developers.paydunya.com/doc/FR/http_json
 */

export type PayDunyaMode = "test" | "live";

export interface PayDunyaConfig {
  masterKey: string;
  privateKey: string;
  token: string;
  mode: PayDunyaMode;
}

export interface PayDunyaInvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
}

export interface PayDunyaInvoice {
  invoice: {
    items: PayDunyaInvoiceItem[];
    total_amount: number;
    description: string;
    taxes?: Record<string, number>;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  store: {
    name: string;
    tagline?: string;
    postal_address?: string;
    phone?: string;
    logo_url?: string;
    website_url?: string;
  };
  actions: {
    cancel_url: string;
    return_url: string;
    callback_url?: string;
  };
  custom_data?: Record<string, unknown>;
}

export interface PayDunyaInvoiceResponse {
  response_code: string;
  response_text: string;
  description: string;
  token: string;
  response_url?: string;
  response_code_detail?: string;
}

/**
 * Structure complète du webhook PayDunya
 * Envoyé en application/x-www-form-urlencoded sous la clé "data"
 */
export interface PayDunyaWebhookPayload {
  response_code: string;
  response_text: string;
  hash: string; // SHA-512 hash de la MasterKey
  invoice: {
    token: string;
    status: "completed" | "pending" | "cancelled" | "failed";
    total_amount: number;
    description: string;
    items?: Record<string, PayDunyaInvoiceItem>;
    taxes?: Record<string, { name: string; amount: number }>;
  };
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  custom_data?: Record<string, unknown>;
  actions?: {
    cancel_url?: string;
    return_url?: string;
    callback_url?: string;
  };
  mode: "test" | "live";
  receipt_url?: string;
  fail_reason?: string; // Pour les paiements par carte échoués/annulés
  errors?: {
    message?: string;
    description?: string;
  };
}

/**
 * Configuration PayDunya depuis les variables d'environnement
 */
export function getPayDunyaConfig(): PayDunyaConfig {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  const mode = (process.env.PAYDUNYA_MODE || "test") as PayDunyaMode;

  if (!masterKey || !privateKey || !token) {
    throw new Error(
      "PayDunya configuration manquante. Vérifiez PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY et PAYDUNYA_TOKEN dans .env"
    );
  }

  return {
    masterKey,
    privateKey,
    token,
    mode,
  };
}

/**
 * URL de base de l'API PayDunya selon le mode
 */
const PAYDUNYA_API_BASE: Record<PayDunyaMode, string> = {
  test: "https://app.paydunya.com/sandbox-api/v1",
  live: "https://app.paydunya.com/api/v1",
};

const PAYDUNYA_CHECKOUT_BASE: Record<PayDunyaMode, string> = {
  test: "https://app.paydunya.com/sandbox-checkout-invoice",
  live: "https://app.paydunya.com/checkout-invoice",
};

export function getPayDunyaApiBaseUrl(mode: PayDunyaMode): string {
  return PAYDUNYA_API_BASE[mode];
}

export function getPayDunyaCheckoutBaseUrl(mode: PayDunyaMode): string {
  return PAYDUNYA_CHECKOUT_BASE[mode];
}

/**
 * Interface pour la requête de création de facture OPR (Onsite)
 */
export interface PayDunyaOnsiteRequest {
  invoice_data: PayDunyaInvoice;
  opr_data: {
    account_alias: string; // Numéro de téléphone ou email
  };
}

/**
 * Réponse de création OPR
 */
export interface PayDunyaOnsiteResponse {
  response_code: string;
  response_text: string;
  token: string;        // OPR Token
  invoice_token: string; // Token de facture classique
  description?: string;
}

/**
 * Réponse de confirmation OPR
 */
export interface PayDunyaOnsiteChargeResponse {
  response_code: string;
  response_text: string;
  invoice_data?: {
    status: string;
    receipt_url: string;
    invoice: {
      total_amount: number;
    };
  };
}

/**
 * Créer une facture PayDunya
 */
export async function createPayDunyaInvoice(
  invoice: PayDunyaInvoice
): Promise<PayDunyaInvoiceResponse> {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/checkout-invoice/create`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
    body: JSON.stringify(invoice),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur PayDunya (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (data.response_code !== "00") {
    throw new Error(
      `Erreur PayDunya: ${data.response_text} - ${data.description}`
    );
  }

  return data;
}

/**
 * Vérifier le statut d'une facture PayDunya
 */
export async function checkPayDunyaInvoiceStatus(
  token: string
): Promise<PayDunyaInvoiceResponse> {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/checkout-invoice/confirm/${token}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur PayDunya (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Créer une facture PayDunya OPR (Onsite Payment Request)
 * Cette méthode déclenche l'envoi du code OTP au client.
 */
export async function createOnsiteInvoice(
  invoice: PayDunyaInvoice,
  accountAlias: string
): Promise<PayDunyaOnsiteResponse> {
  const config = getPayDunyaConfig();
  // Utilisation de l'URL dynamique (confirmée par Setup.php)
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/opr/create`;

  const payload: PayDunyaOnsiteRequest = {
    invoice_data: invoice,
    opr_data: {
      account_alias: accountAlias
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Provide a clean error message instead of raw HTML
    if (response.status === 404) {
      throw new Error(
        "Service de paiement direct indisponible. Veuillez utiliser le paiement par redirection."
      );
    }
    const errorText = await response.text();
    // Extract error message if JSON, otherwise use generic message
    let cleanError = "Erreur lors de la création du paiement";
    try {
      const errorJson = JSON.parse(errorText);
      cleanError = errorJson.response_text || errorJson.message || cleanError;
    } catch {
      // Not JSON, check if it's HTML (404 page)
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        cleanError = `Erreur PayDunya (${response.status}): Service temporairement indisponible`;
      }
    }
    throw new Error(cleanError);
  }

  const data = await response.json();

  // PayDunya retourne "00" pour succès
  if (data.response_code !== "00") {
    throw new Error(
      `Erreur PayDunya OPR Create: ${data.response_text}`
    );
  }

  return data;
}

/**
 * Confirmer un paiement PayDunya OPR avec le code OTP
 */
export async function chargeOnsiteInvoice(
  oprToken: string,
  confirmToken: string
): Promise<PayDunyaOnsiteChargeResponse> {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/opr/charge`;

  const payload = {
    token: oprToken,
    confirm_token: confirmToken
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur PayDunya OPR Charge (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (data.response_code !== "00") {
    throw new Error(
      `Erreur PayDunya OPR Charge: ${data.response_text}`
    );
  }

  return data;
}

/**
 * URL de redirection vers le checkout PayDunya
 */
export function getPayDunyaCheckoutUrl(token: string, mode: PayDunyaMode): string {
  const baseUrl = getPayDunyaCheckoutBaseUrl(mode);
  // En sandbox, l'URL fournie par PayDunya est sandbox-checkout-invoice
  if (mode === "test") {
    return `${baseUrl}?token=${token}`;
  }
  return `${baseUrl}?token=${token}`;
}

/**
 * Initialiser un paiement "Boost annonce"
 */
export async function initializePayment(
  propertyId: string,
  title: string,
  price = 5000
) {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/checkout-invoice/create`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dousel-immo.vercel.app";
  const callbackUrl =
    process.env.PAYDUNYA_CALLBACK_URL ||
    process.env.NGROK_CALLBACK_URL ||
    `${appUrl}/api/webhooks/paydunya`;

  const payload = {
    invoice: {
      total_amount: price,
      description: `Boost annonce : ${title}`,
      channels: ['wave-senegal', 'orange-money-senegal']
    },
    store: {
      name: "Doussel Immo",
      tagline: "Immobilier Dakar",
      website_url:
        process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.vercel.app",
    },
    custom_data: {
      property_id: propertyId,
    },
    actions: {
      return_url: `${appUrl}/compte/mes-biens?status=success`,
      cancel_url: `${appUrl}/compte/mes-biens?status=cancel`,
      callback_url: callbackUrl,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur PayDunya (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (data.response_code !== "00") {
    throw new Error(
      `Erreur PayDunya: ${data.response_text} - ${data.description}`
    );
  }

  // ✅ CORRECTION: Utiliser directement l'URL retournée par PayDunya (response_text)
  // au lieu de construire l'URL manuellement (qui était incorrecte)
  return {
    token: data.token,
    redirectUrl: data.response_text, // URL complète retournée par PayDunya
    raw: data,
  };
}

/**
 * Initialiser un paiement de loyer
 */
export async function initializeRentalPayment(
  leaseId: string,
  amount: number,
  periodMonth: number,
  periodYear: number,
  tenantEmail: string,
  tenantName: string,
  tenantPhone?: string
) {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaApiBaseUrl(config.mode);
  const url = `${baseUrl}/checkout-invoice/create`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doussel-immo.vercel.app";
  const callbackUrl =
    process.env.PAYDUNYA_CALLBACK_URL ||
    process.env.NGROK_CALLBACK_URL ||
    `${appUrl}/api/webhooks/paydunya`;

  const description = `Loyer ${periodMonth}/${periodYear}`;

  const payload = {
    invoice: {
      total_amount: amount,
      description: description,
      items: [
        {
          name: description,
          quantity: 1,
          unit_price: amount,
          total_price: amount,
          description: `Règlement du loyer pour le bail ${leaseId}`
        }
      ],
      channels: ['wave-senegal', 'orange-money-senegal', 'card-senegal']
    },
    store: {
      name: "Doussel Immo",
      tagline: "Gestion Locative Simplifiée",
      website_url: appUrl,
    },
    custom_data: {
      type: 'rent',
      lease_id: leaseId,
      period_month: periodMonth,
      period_year: periodYear
    },
    actions: {
      return_url: `${appUrl}/locataire/paiement-succes?provider=paydunya`,
      cancel_url: `${appUrl}/locataire?status=cancel`,
      callback_url: callbackUrl,
    },
    customer: {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone ? tenantPhone.replace(/^(\+221|00221|221|\+)/g, '') : undefined
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur PayDunya (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (data.response_code !== "00") {
    throw new Error(
      `Erreur PayDunya: ${data.response_text} - ${data.description}`
    );
  }

  return {
    token: data.token,
    redirectUrl: data.response_text,
    raw: data,
  };
}

/**
 * Valider le hash SHA-512 d'un webhook PayDunya
 * PayDunya envoie un hash SHA-512 de la MasterKey dans le payload
 * Documentation: https://developers.paydunya.com/doc/FR/http_json
 */
export function validatePayDunyaWebhook(receivedHash: string): boolean {
  try {
    const config = getPayDunyaConfig();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");

    // Calculer le hash SHA-512 de la MasterKey
    const expectedHash = crypto
      .createHash("sha512")
      .update(config.masterKey)
      .digest("hex");

    // Comparaison sécurisée des hash
    if (receivedHash.length !== expectedHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch (error) {
    console.error("Erreur lors de la validation du hash:", error);
    return false;
  }
}
