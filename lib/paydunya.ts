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
export function getPayDunyaBaseUrl(mode: PayDunyaMode): string {
  return mode === "live"
    ? "https://app.paydunya.com"
    : "https://app.paydunya.com/sandbox";
}

/**
 * Créer une facture PayDunya
 */
export async function createPayDunyaInvoice(
  invoice: PayDunyaInvoice
): Promise<PayDunyaInvoiceResponse> {
  const config = getPayDunyaConfig();
  const baseUrl = getPayDunyaBaseUrl(config.mode);
  const url = `${baseUrl}/api/v1/checkout-invoice/create`;

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
  const baseUrl = getPayDunyaBaseUrl(config.mode);
  const url = `${baseUrl}/api/v1/checkout-invoice/confirm/${token}`;

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
  const baseUrl = getPayDunyaBaseUrl(mode);
  return `${baseUrl}/checkout-invoice?token=${token}`;
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

