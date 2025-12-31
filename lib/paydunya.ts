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

export interface PayDunyaWebhookPayload {
  invoice: {
    token: string;
    status: "completed" | "pending" | "cancelled";
    total_amount: number;
    description: string;
    items: PayDunyaInvoiceItem[];
  };
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  custom_data?: Record<string, unknown>;
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

  return {
    token: data.token,
    redirectUrl: getPayDunyaCheckoutUrl(data.token, config.mode),
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
  // En dev (localhost), le callback ne fonctionnera pas sans ngrok.
  // On utilise une URL ngrok si définie, sinon l'URL de l'app (qui échouera en local d'où l'importance de ngrok)
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
      ]
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
      return_url: `${appUrl}/portal?status=success`,
      cancel_url: `${appUrl}/portal?status=cancel`,
      callback_url: callbackUrl,
    },
    customer: {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone
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
    redirectUrl: getPayDunyaCheckoutUrl(data.token, config.mode),
    raw: data,
  };
}

/**
 * Valider la signature HMAC d'un webhook PayDunya
 */
export function validatePayDunyaWebhook(
  payload: string,
  signature: string
): boolean {
  try {
    const config = getPayDunyaConfig();
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", config.privateKey)
      .update(payload)
      .digest("hex");

    // Comparaison sécurisée des signatures
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (error) {
    console.error("Erreur lors de la validation de la signature:", error);
    return false;
  }
}
