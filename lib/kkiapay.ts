/**
 * Configuration et utilitaires KKiaPay
 * Documentation: https://docs.kkiapay.me/
 */

export type KKiaPayMode = "sandbox" | "production";

export interface KKiaPayConfig {
  publicKey: string;
  privateKey: string;
  secret: string;
  mode: KKiaPayMode;
}

/**
 * Structure du webhook KKiaPay
 */
export interface KKiaPayWebhookPayload {
  transactionId: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  paymentMethod?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration KKiaPay depuis les variables d'environnement
 */
export function getKKiaPayConfig(): KKiaPayConfig {
  const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
  const secret = process.env.KKIAPAY_SECRET;
  const mode = (process.env.KKIAPAY_MODE || "sandbox") as KKiaPayMode;

  if (!publicKey || !privateKey || !secret) {
    throw new Error(
      "KKiaPay configuration manquante. Vérifiez NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY et KKIAPAY_SECRET dans .env"
    );
  }

  return {
    publicKey,
    privateKey,
    secret,
    mode,
  };
}

/**
 * URL de base de l'API KKiaPay selon le mode
 */
const KKIAPAY_API_BASE: Record<KKiaPayMode, string> = {
  sandbox: "https://api.kkiapay.me/api/v1",
  production: "https://api.kkiapay.me/api/v1",
};

export function getKKiaPayApiBaseUrl(mode: KKiaPayMode): string {
  return KKIAPAY_API_BASE[mode];
}

/**
 * Vérifier le statut d'une transaction KKiaPay
 */
export async function verifyKKiaPayTransaction(
  transactionId: string
): Promise<KKiaPayWebhookPayload> {
  const config = getKKiaPayConfig();
  const baseUrl = getKKiaPayApiBaseUrl(config.mode);
  const url = `${baseUrl}/transactions/${transactionId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.privateKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur KKiaPay (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Valider la signature du webhook KKiaPay
 * KKiaPay envoie un header 'x-kkiapay-signature' avec HMAC-SHA256
 */
export function validateKKiaPayWebhook(
  signature: string,
  payload: string
): boolean {
  try {
    const config = getKKiaPayConfig();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");

    // Calculer le HMAC-SHA256 avec le secret
    const expectedSignature = crypto
      .createHmac("sha256", config.secret)
      .update(payload)
      .digest("hex");

    // Comparaison sécurisée
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
