import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import React from "react";

/**
 * Configuration du transporteur SMTP Gmail
 * Lit les variables d'environnement à l'exécution (pas à l'import)
 */
const createTransporter = () => {
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_USER et GMAIL_APP_PASSWORD doivent être définis dans les variables d'environnement"
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true pour 465, false pour les autres ports
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
};

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
};

/**
 * Fonction générique pour envoyer des emails via Gmail
 * @param options - Options d'envoi d'email
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendEmail({
  to,
  subject,
  html,
  react,
  attachments,
}: SendEmailOptions) {
  try {
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("❌ Configuration Gmail manquante");
      return {
        error: "Configuration Gmail manquante. Vérifiez GMAIL_USER et GMAIL_APP_PASSWORD.",
      };
    }

    const transporter = createTransporter();

    // Convertir React component en HTML si fourni
    let emailHtml = html;
    if (react && !html) {
      emailHtml = await render(react);
    }

    if (!emailHtml) {
      return {
        error: "Le contenu HTML ou un composant React doit être fourni",
      };
    }

    // Normaliser 'to' en tableau
    const recipients = Array.isArray(to) ? to : [to];

    // Préparer les attachments avec le bon format pour nodemailer
    const formattedAttachments = attachments?.map((att) => {
      let content = att.content;

      // Vérifier si le contenu est un Buffer sérialisé (problème fréquent avec Next.js/Server Actions)
      interface SerializedBuffer {
        type: string;
        data: number[];
      }

      if (
        content &&
        typeof content === "object" &&
        !Buffer.isBuffer(content) &&
        (content as SerializedBuffer).type === "Buffer" &&
        Array.isArray((content as SerializedBuffer).data)
      ) {
        console.log(`⚠️ Détection d'un Buffer sérialisé pour ${att.filename}, conversion en cours...`);
        content = Buffer.from((content as SerializedBuffer).data);
      }

      // Nodemailer accepte directement les Buffers
      // Format attendu: { filename, content (Buffer), contentType }
      const attachment: { filename: string; content: Buffer | string; contentType?: string } = {
        filename: att.filename,
        content: content,
      };

      // Ajouter contentType si spécifié
      if (att.contentType) {
        attachment.contentType = att.contentType;
      }

      // Pour les PDFs, s'assurer que le content est bien un Buffer
      if (att.contentType === "application/pdf") {
        if (Buffer.isBuffer(content)) {
          console.log(`📎 Préparation pièce jointe PDF: ${att.filename} (${content.length} bytes)`);
        } else {
          console.warn(`⚠️ Attention: Le contenu de ${att.filename} n'est pas un Buffer (Type: ${typeof content})`);
        }
      }

      return attachment;
    }) || [];

    // Configuration de l'email avec le nom d'expéditeur professionnel
    const mailOptions = {
      from: `"Doussel Immo Support" <${GMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      html: emailHtml,
      attachments: formattedAttachments,
    };

    console.log(`📧 Envoi d'email à: ${recipients.join(", ")}`);
    console.log(`📧 Sujet: ${subject}`);
    if (formattedAttachments.length > 0) {
      console.log(`📎 Pièces jointes: ${formattedAttachments.map(a => `${a.filename} (${Buffer.isBuffer(a.content) ? a.content.length + ' bytes' : 'string'})`).join(", ")}`);
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email envoyé avec succès:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'envoi de l'email",
    };
  }
}

/**
 * Fonction spécifique pour envoyer une facture par email
 * @param to - Adresse email du destinataire
 * @param clientName - Nom du client
 * @param pdfBuffer - Buffer du PDF de la facture
 * @param invoiceNumber - Numéro de facture (optionnel)
 * @param amount - Montant de la facture (optionnel)
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendInvoiceEmail({
  to,
  clientName,
  pdfBuffer,
  invoiceNumber,
  amount,
}: {
  to: string;
  clientName: string;
  pdfBuffer: Buffer;
  invoiceNumber?: string;
  amount?: number;
}) {
  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre facture Doussel Immo</title>
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
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #f59e0b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #05080c;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0 0 0;
        }
        .content {
          margin: 30px 0;
        }
        .content p {
          margin: 15px 0;
          color: #555;
        }
        .invoice-details {
          background-color: #f9fafb;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
        }
        .invoice-details p {
          margin: 5px 0;
        }
        .invoice-details strong {
          color: #05080c;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #f59e0b;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Doussel Immo</h1>
          <p>Votre partenaire immobilier à Dakar</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          
          <p>Nous vous remercions pour votre confiance. Veuillez trouver ci-joint votre facture.</p>
          
          ${invoiceNumber || amount
      ? `
          <div class="invoice-details">
            ${invoiceNumber ? `<p><strong>Numéro de facture:</strong> ${invoiceNumber}</p>` : ""}
            ${amount ? `<p><strong>Montant:</strong> ${amount.toLocaleString("fr-SN")} FCFA</p>` : ""}
          </div>
          `
      : ""}
          
          <p>Cette facture est également disponible en pièce jointe au format PDF.</p>
          
          <p>Pour toute question concernant cette facture, n'hésitez pas à nous contacter.</p>
        </div>
        
        <div class="footer">
          <p><strong>Doussel Immo</strong></p>
          <p>Email: support@dousell-immo.app</p>
          <p>Dakar, Sénégal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Votre facture Doussel Immo${invoiceNumber ? ` - ${invoiceNumber}` : ""}`,
    html: invoiceHtml,
    attachments: [
      {
        filename: "Facture-Doussel.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Email de l'admin (pour les notifications)
 */
export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "barrymohamadou98@gmail.com";
}
