import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import React from "react";
import { InvoiceEmail } from "../emails/invoice-email";
import { ActivationApprovedEmail } from "../emails/activation-approved-email";
import { ActivationRejectedEmail } from "../emails/activation-rejected-email";

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
  cc?: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  from?: string;
};

/**
 * Fonction générique pour envoyer des emails via Gmail
 * @param options - Options d'envoi d'email
 * @returns Promise avec le résultat de l'envoi
 */
export async function sendEmail({
  to,
  cc,
  subject,
  html,
  react,
  attachments,
  replyTo,
  from: fromOverride,
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

    // Expéditeur : toujours le compte GMAIL_USER authentifié (SMTP Gmail l'exige)
    // fromOverride doit également utiliser GMAIL_USER comme adresse (display name libre)
    const defaultSender = `"Dousel" <${GMAIL_USER}>`;
    const sender = fromOverride || defaultSender;

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc.join(", ") : cc)
      : undefined;

    const mailOptions = {
      from: sender,
      to: recipients.join(", "),
      cc: ccRecipients,
      subject,
      html: emailHtml,
      attachments: formattedAttachments,
      replyTo: replyTo && replyTo !== 'noreply' ? replyTo : (process.env.CONTACT_EMAIL || undefined),
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
  return sendEmail({
    to,
    subject: `Votre facture Dousel${invoiceNumber ? ` - ${invoiceNumber}` : ""}`,
    react: React.createElement(InvoiceEmail, {
      clientName,
      invoiceNumber,
      amount,
    }),
    attachments: [
      {
        filename: "Facture-Dousel.pdf",
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
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
}

/**
 * Envoie un email de confirmation d'activation de la gestion locative
 */
export async function sendActivationApprovedEmail({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}) {
  return sendEmail({
    to,
    subject: "Gestion Locative Activée ! 🎉",
    react: React.createElement(ActivationApprovedEmail, { firstName }),
  });
}

/**
 * Envoie un email de refus d'activation
 */
export async function sendActivationRejectedEmail({
  to,
  firstName,
  reason,
}: {
  to: string;
  firstName: string;
  reason: string;
}) {
  return sendEmail({
    to,
    subject: "Mise à jour concernant votre demande Gestion Locative",
    react: React.createElement(ActivationRejectedEmail, { firstName, reason }),
  });
}
